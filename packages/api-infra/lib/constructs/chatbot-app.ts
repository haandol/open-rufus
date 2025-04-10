import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

export interface IProps {
  readonly cluster: ecs.ICluster;
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  readonly loadBalancerSecurityGroup: ec2.ISecurityGroup;
  readonly cert: {
    recordName: string;
    domainName: string;
    hostedZoneId: string;
    certificateArn: string;
  };
  readonly chatbotTableName: string;
  readonly authApiKey: string;
  readonly itemRecApiHost: string;
  readonly itemSearchApiHost: string;
}

export class ChatbotApp extends Construct {
  readonly service: ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    // create app service
    const envVars = this.createEnvVars(props);
    const serviceSecurityGroup = this.createServiceSecurityGroup(props);
    this.service = this.createAlbFargateService(
      props,
      serviceSecurityGroup,
      envVars
    );
  }

  private createServiceSecurityGroup(props: IProps): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, "ServiceSecurityGroup", {
      vpc: props.cluster.vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.securityGroupId(props.loadBalancerSecurityGroup.securityGroupId),
      ec2.Port.tcp(8000),
      "Allow inbound ALB traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.cluster.vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      "Allow inbound VPC traffic"
    );
    return securityGroup;
  }

  private createAlbFargateService(
    props: IProps,
    serviceSecurityGroup: ec2.SecurityGroup,
    envVars: { [key: string]: ssm.IStringParameter }
  ): ApplicationLoadBalancedFargateService {
    const executionRole = this.createExecutionRole();
    const taskRole = this.createEcsTaskRole(props);

    const secrets = Object.keys(envVars).reduce((acc, key) => {
      acc[key] = ecs.Secret.fromSsmParameter(envVars[key]);
      return acc;
    }, {} as { [key: string]: ecs.Secret });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Cert",
      props.cert.certificateArn
    );
    const domainZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: props.cert.hostedZoneId,
        zoneName: props.cert.domainName,
      }
    );

    const service = new ApplicationLoadBalancedFargateService(
      this,
      "AlbFargateService",
      {
        cluster: props.cluster,
        loadBalancer: props.loadBalancer,
        certificate,
        domainZone,
        sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS,
        redirectHTTP: true,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        circuitBreaker: { rollback: true },
        publicLoadBalancer: true,
        openListener: false,
        platformVersion: ecs.FargatePlatformVersion.LATEST,
        cloudMapOptions: {
          name: "chatbot-app",
        },
        securityGroups: [serviceSecurityGroup],
        taskImageOptions: {
          taskRole,
          executionRole,
          image: ecs.ContainerImage.fromAsset(
            path.join(__dirname, "..", "..", "..", "app"),
            {
              file: "Dockerfile",
              platform: Platform.LINUX_AMD64,
            }
          ),
          command: [
            "uv",
            "run",
            "--",
            "uvicorn",
            "main:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
          ],
          containerPort: 8000,
          secrets,
        },
        healthCheck: {
          command: [
            "CMD-SHELL",
            "curl -f http://localhost:8000/health || exit 1",
          ],
        },
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
        desiredCount: 2,
        minHealthyPercent: 50,
        cpu: 1024,
        memoryLimitMiB: 2048,
      }
    );

    // auto scale task count
    const scalableTarget = service.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    });
    scalableTarget.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 80,
    });
    scalableTarget.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 80,
    });

    // configure health check
    service.targetGroup.configureHealthCheck({
      path: "/health",
    });
    // enable sticky session - alb managed cookie
    service.targetGroup.enableCookieStickiness(cdk.Duration.days(1));

    return service;
  }

  private createExecutionRole(): iam.Role {
    const role = new iam.Role(this, "ExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    // for cloudwatch
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );
    // for ssm
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: ["*"],
      })
    );
    // for secrets
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["kms:Decrypt", "secretsmanager:GetSecretValue"],
        resources: ["*"],
      })
    );
    // for ecr
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
        ],
        resources: ["*"],
      })
    );
    return role;
  }

  private createEcsTaskRole(props: IProps): iam.Role {
    const role = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    // for xray
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        resources: ["*"],
      })
    );
    // for bedrock invoke model
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: ["*"],
      })
    );
    // for s3
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: ["*"],
      })
    );
    // for dynamodb
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // IndexAccess
          "dynamodb:GetShardIterator",
          "dynamodb:Scan",
          "dynamodb:Query",
          // TableAccess
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:ConditionCheckItem",
          "dynamodb:PutItem",
          "dynamodb:DescribeTable",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
        ],
        resources: [
          `arn:aws:dynamodb:*:${cdk.Stack.of(this).account}:table/${
            props.chatbotTableName
          }`,
          `arn:aws:dynamodb:*:${cdk.Stack.of(this).account}:table/${
            props.chatbotTableName
          }/index/*`,
        ],
      })
    );
    return role;
  }

  private createEnvVars(props: IProps): {
    [key: string]: ssm.IStringParameter;
  } {
    const ns = this.node.tryGetContext("ns") as string;

    return {
      CHATBOT_TABLE_NAME: new ssm.StringParameter(this, "ChatbotTableName", {
        description: "Chatbot table name",
        parameterName: `${ns}ChatbotTableName`,
        stringValue: props.chatbotTableName,
        tier: ssm.ParameterTier.STANDARD,
      }),
      AUTH_API_KEY: new ssm.StringParameter(this, "AuthApiKey", {
        description: "Auth api key",
        parameterName: `${ns}AuthApiKey`,
        stringValue: props.authApiKey,
        tier: ssm.ParameterTier.STANDARD,
      }),
      ITEM_REC_API_HOST: new ssm.StringParameter(this, "ItemRecApiHost", {
        description: "Item rec api host",
        parameterName: `${ns}ItemRecApiHost`,
        stringValue: props.itemRecApiHost,
        tier: ssm.ParameterTier.STANDARD,
      }),
      ITEM_SEARCH_API_HOST: new ssm.StringParameter(this, "ItemSearchApiHost", {
        description: "Item search api host",
        parameterName: `${ns}ItemSearchApiHost`,
        stringValue: props.itemSearchApiHost,
        tier: ssm.ParameterTier.STANDARD,
      }),
    };
  }
}
