import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambda_event_sources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as oss from "aws-cdk-lib/aws-opensearchservice";
import { Construct } from "constructs";
import * as path from "path";

export interface IProps {
  readonly vpc: ec2.IVpc;
  readonly osDomain: oss.IDomain;
  readonly osSecurityGroup: ec2.ISecurityGroup;
  readonly indexName: string;
  readonly embeddingModelArn: string;
}

export class EmbeddingPipeline extends Construct {
  public readonly inputBucket: s3.IBucket;
  public readonly processingQueue: sqs.IQueue;
  public readonly notificationTopic: sns.ITopic;
  public readonly embedderFunction: lambda.IFunction;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    // S3 Bucket
    this.inputBucket = this.createInputBucket();

    // SNS Topic
    this.notificationTopic = this.createNotificationTopic();

    // Configure S3 event notifications to SNS
    this.inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(this.notificationTopic)
      // Optionally add filters for specific prefixes or suffixes (e.g., .txt, .pdf)
      // { prefix: 'uploads/', suffix: '.txt' }
    );

    // SQS Queue + DLQ
    this.processingQueue = this.createProcessingQueue();

    // SNS Subscription to SQS Queue
    this.notificationTopic.addSubscription(
      new sns_subscriptions.SqsSubscription(this.processingQueue, {
        rawMessageDelivery: true,
      })
    );

    // Lambda Role
    const role = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    // Add default Lambda permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );
    // Add permissions to vpc connections
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DescribeSubnets",
          "ec2:DetachNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses",
        ],
        resources: ["*"],
      })
    );
    // Add permissions to write to X-Ray
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        resources: ["*"],
      })
    );
    // Add permissions
    props.osDomain.grantReadWrite(role);
    this.inputBucket.grantRead(role);
    this.processingQueue.grantConsumeMessages(role);

    this.embedderFunction = this.createEmbedderFunction(props, role);
    // Set SQS queue as Lambda event source
    this.embedderFunction.addEventSource(
      new lambda_event_sources.SqsEventSource(this.processingQueue, {
        batchSize: 5,
        maxBatchingWindow: cdk.Duration.minutes(1),
        reportBatchItemFailures: true,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "InputBucketNameOutput", {
      value: this.inputBucket.bucketName,
      description: "Name of the S3 bucket for document uploads",
    });
    new cdk.CfnOutput(this, "ProcessingQueueUrlOutput", {
      value: this.processingQueue.queueUrl,
      description: "URL of the SQS queue for processing tasks",
    });
  }

  private createInputBucket(): s3.IBucket {
    return new s3.Bucket(this, "Bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Adjust for production
      autoDeleteObjects: true, // Adjust for production
    });
  }

  private createProcessingQueue(): sqs.IQueue {
    const deadLetterQueue = new sqs.Queue(this, "DLQ", {
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    return new sqs.Queue(this, "ProcessingQueue", {
      visibilityTimeout: cdk.Duration.minutes(15),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: deadLetterQueue,
      },
    });
  }

  private createNotificationTopic(): sns.ITopic {
    return new sns.Topic(this, "Topic", {
      displayName: "Embedding Pipeline Notification Topic",
      enforceSSL: true,
    });
  }

  private createEmbedderFunction(
    props: IProps,
    role: iam.IRole
  ): lambda.IFunction {
    const layers: lambda.ILayerVersion[] = [
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "PowertoolsLayer",
        `arn:aws:lambda:${
          cdk.Stack.of(this).region
        }:017000801446:layer:AWSLambdaPowertoolsPythonV3-python313-x86_64:7`
      ),
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "OpensearchPy",
        `arn:aws:lambda:${
          cdk.Stack.of(this).region
        }:770693421928:layer:Klayers-p312-opensearch-py:6`
      ),
    ];

    return new lambda.Function(this, "EmbedderFunction", {
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, "..", "..", "functions", "services", "embedder")
      ),
      handler: "index.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        OPENSEARCH_HOST: `${props.osDomain.domainEndpoint}`,
        INDEX_NAME: props.indexName,
        EMBEDDING_MODEL_ARN: props.embeddingModelArn,
      },
      securityGroups: [props.osSecurityGroup],
      vpc: props.vpc,
      layers,
      role,
    });
  }
}
