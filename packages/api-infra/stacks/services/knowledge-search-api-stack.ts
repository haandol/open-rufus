import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import { Construct } from "constructs";
import { EmbeddingPipeline } from "../../constructs/embbedding-pipeline";

interface IProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  osDomain: opensearch.IDomain;
  osSecurityGroup: ec2.ISecurityGroup;
  indexName: string;
  api: apigw.IHttpApi;
  authorizer: apigw.IHttpRouteAuthorizer;
  embeddingModelArn: string;
}

export class KnowledgeSearchAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    const fn = this.createKnowledgeSearchLambda(props);
    this.registerKnowledgeSearchRoutes(props.api, props.authorizer, fn);

    new EmbeddingPipeline(this, "EmbeddingPipeline", {
      vpc: props.vpc,
      osDomain: props.osDomain,
      osSecurityGroup: props.osSecurityGroup,
      indexName: props.indexName,
      embeddingModelArn: props.embeddingModelArn,
    });
  }

  private createKnowledgeSearchLambda(props: IProps): lambda.IFunction {
    const ns = this.node.tryGetContext("ns") as string;

    const layers: lambda.ILayerVersion[] = [
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "PowertoolsLayer",
        `arn:aws:lambda:${this.region}:017000801446:layer:AWSLambdaPowertoolsPythonV3-python313-x86_64:7`
      ),
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "OpensearchPy",
        `arn:aws:lambda:${this.region}:770693421928:layer:Klayers-p312-opensearch-py:6`
      ),
    ];

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
    // Add permissions to invoke bedrock embedding models
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: [props.embeddingModelArn],
      })
    );
    // Add permissions to read/write to OpenSearch
    props.osDomain.grantReadWrite(role);

    const fn = new lambda.Function(this, "KnowledgeSearchAPIFunction", {
      functionName: `${ns}KnowledgeSearchAPI`,
      code: lambda.Code.fromAsset(
        path.resolve(
          __dirname,
          "..",
          "..",
          "functions",
          "services",
          "knowledge-search"
        )
      ),
      handler: "index.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(10),
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

    return fn;
  }

  private registerKnowledgeSearchRoutes(
    httpApi: apigw.IHttpApi,
    authorizer: apigw.IHttpRouteAuthorizer,
    fn: lambda.IFunction
  ) {
    const integration = new HttpLambdaIntegration(
      "KnowledgeSearchServiceInteg",
      fn
    );
    new apigw.HttpRoute(this, "CorsKnowledgeSearchServiceRouteV1", {
      httpApi,
      routeKey: apigw.HttpRouteKey.with(
        "/v1/search/knowledge/{proxy+}",
        apigw.HttpMethod.OPTIONS
      ),
      integration,
      authorizer: new apigw.HttpNoneAuthorizer(),
    });
    new apigw.HttpRoute(this, "KnowledgeSearchServiceRouteV1", {
      httpApi,
      routeKey: apigw.HttpRouteKey.with(
        "/v1/search/knowledge/{proxy+}",
        apigw.HttpMethod.ANY
      ),
      integration,
      authorizer,
    });
  }
}
