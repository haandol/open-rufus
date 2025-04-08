import * as cdk from "aws-cdk-lib";
import * as nag from "cdk-nag";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Opensearch } from "../constructs/opensearch";

interface IProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class OpensearchStack extends cdk.Stack {
  readonly os: Opensearch;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    this.os = new Opensearch(this, "Opensearch", {
      vpc: props.vpc,
    });

    // Nag
    nag.NagSuppressions.addResourceSuppressions(this.os.securityGroup, [
      {
        id: "AwsPrototyping-EC2RestrictedCommonPorts",
        reason: "443 is required for OpenSearch",
      },
      {
        id: "AwsPrototyping-EC2RestrictedInbound",
        reason: "It did not allow inbound traffic from the outside of the VPC",
      },
      {
        id: "AwsPrototyping-EC2RestrictedSSH",
        reason: "It did not allow SSH access",
      },
    ]);
    nag.NagSuppressions.addResourceSuppressions(this.os.domain, [
      {
        id: "AwsPrototyping-OpenSearchAllowlistedIPs",
        reason: "It did not allow inbound traffic from the outside of the VPC",
      },
      {
        id: "AwsPrototyping-IAMNoManagedPolicies",
        reason: "es:* is required for OpenSearch for the dashboard",
      },
    ]);
    nag.NagSuppressions.addStackSuppressions(this, [
      {
        id: "AwsPrototyping-LambdaLatestVersion",
        reason:
          "It is not possible to specify a version for the Lambda function",
      },
      {
        id: "AwsPrototyping-IAMNoManagedPolicies",
        reason: "It is not possible to specify a role for the Lambda function",
      },
    ]);
  }
}
