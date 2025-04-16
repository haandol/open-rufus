import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";
import { WebappWAF, WebACLAssociation } from "../constructs/webapp-waf";
import { OpensearchCluster } from "../constructs/opensearch-cluster";
import { HttpAPIGateway } from "../constructs/external-api-gateway";

interface IProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc;
  readonly tableName: string;
  readonly allowIpList: string[];
  readonly cloudfront: {
    secretHeaderName: string;
    secretHeaderValue: string;
  };
  readonly externalApiKey: string;
}

export class CommonAppStack extends cdk.Stack {
  // chat app
  readonly chatbotTable: dynamodb.ITable;
  // ecs fargate service
  readonly cluster: ecs.ICluster;
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  readonly loadBalancerSecurityGroup: ec2.ISecurityGroup;
  // opensearch
  readonly opensearchCluster: OpensearchCluster;
  // external api
  readonly externalApi: HttpAPIGateway;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    // setup chat history for chainlit app
    this.chatbotTable = this.newChatbotTable(props.tableName);

    // setup ECS fargate service
    this.cluster = this.newECSCluster(props.vpc);
    this.loadBalancerSecurityGroup = this.newSecurityGroup(
      props.vpc,
      props.allowIpList
    );
    this.loadBalancer = this.newALB(props.vpc, this.loadBalancerSecurityGroup);

    // setup WAF
    const waf = new WebappWAF(this, "WebappWAF", {
      allowIpList: props.allowIpList,
      cfSecretHeaderName: props.cloudfront.secretHeaderName,
      cfSecretHeaderValue: props.cloudfront.secretHeaderValue,
    });
    new WebACLAssociation(this, "WebACLAssociation", {
      resourceArn: this.loadBalancer.loadBalancerArn,
      webAclArn: waf.webAcl.attrArn,
    });

    // for external services
    // setup opensearch
    this.opensearchCluster = new OpensearchCluster(this, "Opensearch", {
      vpc: props.vpc,
    });
    // setup external api
    this.externalApi = new HttpAPIGateway(this, "ExternalApi", {
      authApiKey: props.externalApiKey,
    });
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

  private newSecurityGroup(
    vpc: ec2.IVpc,
    allowIpList: string[]
  ): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      "Allow inbound VPC traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.prefixList("pl-82a045eb"),
      ec2.Port.tcp(443),
      "Allow inbound traffic from CloudFront"
    );
    allowIpList.forEach((ip) => {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(443),
        "Allow inbound traffic from specific IP"
      );
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

  private newALB(
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup
  ): elbv2.IApplicationLoadBalancer {
    const ns = this.node.tryGetContext("ns") as string;
    return new elbv2.ApplicationLoadBalancer(this, "ALB", {
      loadBalancerName: `${ns}CommonAppALB`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      internetFacing: true,
      securityGroup,
    });
  }
}
