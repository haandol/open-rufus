import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface IProps {
  readonly userPool: cognito.UserPool;
  readonly authApiKey: string;
}

export class HttpAPIGateway extends Construct {
  readonly api: apigw.IHttpApi;
  readonly authorizer: apigw.IHttpRouteAuthorizer;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    this.authorizer = this.createLambdaAuthorizer(props.authApiKey);
    this.api = this.createHttpApi();
  }

  private createLambdaAuthorizer(
    authApiKey: string
  ): apigw.IHttpRouteAuthorizer {
    const ns = this.node.tryGetContext("ns") as string;

    const layers: lambda.ILayerVersion[] = [
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "PowertoolsLayer",
        `arn:aws:lambda:${
          cdk.Stack.of(this).region
        }:017000801446:layer:AWSLambdaPowertoolsPythonV3-python313-x86_64:4`
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

    const fn = new lambda.Function(this, "LambdaAuthorizerFunction", {
      functionName: `${ns}HttpLambdaAuthorizer`,
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, "..", "functions", "auth")
      ),
      handler: "authorizer.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_13,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(3),
      memorySize: 256,
      environment: {
        API_KEY: authApiKey,
      },
      layers,
      role,
    });
    return new authorizers.HttpLambdaAuthorizer("LambdaAuthorizer", fn, {
      responseTypes: [authorizers.HttpLambdaResponseType.SIMPLE],
    });
  }

  private createHttpApi(): apigw.HttpApi {
    const ns = this.node.tryGetContext("ns") as string;

    const api = new apigw.HttpApi(this, "HttpApi", {
      apiName: `${ns}Api`,
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.PUT,
          apigw.CorsHttpMethod.DELETE,
          apigw.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          "Authorization",
          "Content-Type",
          "X-Amzn-Trace-Id",
          "X-Requested-With",
        ],
        allowCredentials: false,
        maxAge: cdk.Duration.hours(1),
      },
    });
    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: api.apiEndpoint,
    });
    return api;
  }
}
