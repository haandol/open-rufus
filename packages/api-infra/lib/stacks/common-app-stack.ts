import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";
import { WebappWAF, WebACLAssociation } from "../constructs/webapp-waf";

interface IProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc;
  readonly tableName: string;
  readonly allowIpList: string[];
}

export class CommonAppStack extends cdk.Stack {
  // chat app
  readonly chatbotTable: dynamodb.ITable;
  // ecs fargate service
  readonly cluster: ecs.ICluster;
  readonly securityGroup: ec2.ISecurityGroup;
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  // external api
  readonly externalApi: apigw.IHttpApi;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    // setup chat history for chainlit app
    this.chatbotTable = this.newChatbotTable(props.tableName);

    // setup ECS fargate service
    this.cluster = this.newECSCluster(props.vpc);
    this.securityGroup = this.newSecurityGroup(props.vpc, props.allowIpList);
    this.loadBalancer = this.newALB(props.vpc);

    // setup WAF
    const waf = new WebappWAF(this, "WebappWAF");
    new WebACLAssociation(this, "WebACLAssociation", {
      resourceArn: this.loadBalancer.loadBalancerArn,
      webAclArn: waf.webAcl.attrArn,
    });

    // setup http api
    this.externalApi = this.createHttpApi();
  }

  private newECSCluster(vpc: ec2.IVpc): ecs.Cluster {
    const ns: string = this.node.tryGetContext("ns") as string;
    const cluster = new ecs.Cluster(this, "Cluster", {
      clusterName: ns.toLowerCase(),
      vpc,
      defaultCloudMapNamespace: {
        name: ns.toLowerCase(),
      },
      enableFargateCapacityProviders: true,
      containerInsights: true,
    });
    return cluster;
  }

  private newSecurityGroup(vpc: ec2.IVpc, allowIpList: string[]): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });
    allowIpList.forEach((ip) => {
      securityGroup.addIngressRule(ec2.Peer.ipv4(ip), ec2.Port.tcp(80), "Allow inbound HTTP traffic");
    });
    return securityGroup;
  }

  private newChatbotTable(tableName: string): dynamodb.Table {
    const isProd = this.node.tryGetContext("isProd") as boolean;

    const table = new dynamodb.Table(this, "ChatbotTable", {
      tableName,
      partitionKey: {
        name: "PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });
    // for general purpose
    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "GS1PK",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "GS1SK",
        type: dynamodb.AttributeType.STRING,
      },
    });

    return table;
  }

  private newALB(vpc: ec2.IVpc): elbv2.IApplicationLoadBalancer {
    const ns = this.node.tryGetContext("ns") as string;
    return new elbv2.ApplicationLoadBalancer(this, "ALB", {
      loadBalancerName: `${ns}CommonAppALB`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      internetFacing: true,
      securityGroup: this.securityGroup,
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