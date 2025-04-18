import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as nag from "cdk-nag";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as oss from "aws-cdk-lib/aws-opensearchservice";

interface IProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc;
  readonly osDomain: oss.IDomain;
  readonly osSecurityGroup: ec2.ISecurityGroup;
  readonly indexName: string;
  readonly api: apigw.IHttpApi;
  readonly authorizer: apigw.IHttpRouteAuthorizer;
}

export class ItemSearchAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    const fn = this.createItemSearchAPILambda(
      props.vpc,
      props.osSecurityGroup,
      props.osDomain,
      props.indexName
    );
    this.registerItemSearchAPIRoutes(props.api, props.authorizer, fn);

    // Nag
    nag.NagSuppressions.addStackSuppressions(this, [
      {
        id: "AwsPrototyping-IAMNoWildcardPermissions",
        reason: "* resource is required for logs and vpc access",
      },
      {
        id: "AwsPrototyping-APIGWAuthorization",
        reason:
          "CORS is enabled for the API Gateway, and the OPTIONS method is allowed without authorization",
      },
    ]);
  }

  private createItemSearchAPILambda(
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup,
    osDomain: oss.IDomain,
    indexName: string
  ): lambda.Function {
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
    // Add permissions to read/write to OpenSearch
    osDomain.grantReadWrite(role);

    return new lambda.Function(this, "ItemSearchAPILambda", {
      functionName: `${ns}ItemSearchAPI`,
      code: lambda.Code.fromAsset(
        path.resolve(
          __dirname,
          "..",
          "..",
          "functions",
          "services",
          "item-search"
        )
      ),
      handler: "index.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 512,
      environment: {
        OPENSEARCH_HOST: `${osDomain.domainEndpoint}`,
        INDEX_NAME: indexName,
      },
      securityGroups: [securityGroup],
      vpc,
      layers,
      role,
    });
  }

  private registerItemSearchAPIRoutes(
    httpApi: apigw.IHttpApi,
    authorizer: apigw.IHttpRouteAuthorizer,
    fn: lambda.IFunction
  ) {
    const integration = new integrations.HttpLambdaIntegration(
      "ItemSearchAPIServiceInteg",
      fn
    );
    new apigw.HttpRoute(this, "CorsItemSearchAPIServiceRouteV1", {
      httpApi,
      routeKey: apigw.HttpRouteKey.with(
        "/v1/search/item/{proxy+}",
        apigw.HttpMethod.OPTIONS
      ),
      integration,
      authorizer: new apigw.HttpNoneAuthorizer(),
    });
    new apigw.HttpRoute(this, "ItemSearchAPIServiceRouteV1", {
      httpApi,
      routeKey: apigw.HttpRouteKey.with(
        "/v1/search/item/{proxy+}",
        apigw.HttpMethod.ANY
      ),
      integration,
      authorizer,
    });
  }
}
