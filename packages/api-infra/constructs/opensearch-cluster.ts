import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as oss from "aws-cdk-lib/aws-opensearchservice";
import { Construct } from "constructs";

export interface IProps {
  vpc: ec2.IVpc;
}

export class OpensearchCluster extends Construct {
  readonly domain: oss.IDomain;
  readonly securityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    // Service-linked role that Amazon OpenSearch Service will use
    // this.createOpensearchServiceLinkedRole();

    const securityGroup = this.createSecurityGroup(props.vpc);
    const domain = this.createDomain(props.vpc, securityGroup);

    this.domain = domain;
    this.securityGroup = securityGroup;
  }

  private createDomain(
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup
  ): oss.Domain {
    const isProd = this.node.tryGetContext("isProd") as boolean;
    console.log("isProd", isProd);

    const openSearchPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(cdk.Stack.of(this).account)],
      actions: ["es:*"],
      resources: ["*"],
    });

    const zoneAwareness: oss.ZoneAwarenessConfig | undefined = isProd
      ? {
          enabled: true,
          availabilityZoneCount: 3,
        }
      : undefined;

    const domain = new oss.Domain(this, "OpenSearchDomain", {
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      version: oss.EngineVersion.OPENSEARCH_2_17,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      enforceHttps: true,
      accessPolicies: [openSearchPolicy],
      ebs: {
        volumeSize: 128,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      capacity: {
        masterNodes: isProd ? 1 : 0,
        masterNodeInstanceType: "r7g.large.search",
        dataNodes: isProd ? 3 : 1,
        dataNodeInstanceType: "r7g.large.search",
      },
      securityGroups: [securityGroup],
      zoneAwareness,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });
    domain.connections.allowFrom(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      "Allow opensearch https port from the VPC"
    );
    domain.connections.allowFrom(
      securityGroup,
      ec2.Port.tcp(443),
      "Allow opensearch https port from the security group"
    );
    domain.connections.allowFrom(
      securityGroup,
      ec2.Port.tcpRange(9200, 9300),
      "Allow opensearch service ports from the security group"
    );
    domain.connections.allowFrom(
      securityGroup,
      ec2.Port.tcp(5601),
      "Allow opensearch dashboard port from the security group"
    );
    return domain;
  }

  private createSecurityGroup(vpc: ec2.IVpc): ec2.SecurityGroup {
    return new ec2.SecurityGroup(this, "OpenSearchSecurityGroup", { vpc });
  }

  /*
  private createOpensearchServiceLinkedRole() {
    new iam.CfnServiceLinkedRole(this, "OpenSearchServiceLinkedRole", {
      awsServiceName: "es.amazonaws.com",
      description: "Service-linked role for Amazon OpenSearch Service",
    });
  }
  */
}
