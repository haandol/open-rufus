import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { GithubOIDC } from "../constructs/github-oidc";
import { Cloudfront } from "../constructs/cloudfront";
import { CloudfrontWAF } from "../constructs/cf-waf";

interface Props extends cdk.StackProps {
  readonly apiUri: string;
  readonly repositoryPath: string;
  readonly repositoryBranch: string;
  readonly secretHeaderName: string;
  readonly secretHeaderValue: string;
  readonly allowIpList: string[];
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const ns = this.node.tryGetContext("ns") as string;

    new GithubOIDC(this, `${ns}GithubOIDC`, {
      repositoryPath: props.repositoryPath,
      repositoryBranch: props.repositoryBranch,
    });

    const bucket = new s3.Bucket(this, `${ns}Bucket`, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cfWAF = new CloudfrontWAF(this, `${ns}CloudfrontWAF`, {
      allowIpList: props.allowIpList,
    });

    new Cloudfront(this, `${ns}Cloudfront`, {
      bucket,
      apiUri: props.apiUri,
      secretHeaderName: props.secretHeaderName,
      secretHeaderValue: props.secretHeaderValue,
      webAclArn: cfWAF.webAcl.attrArn,
    });

    new cdk.CfnOutput(this, `${ns}BucketName`, {
      value: bucket.bucketName,
    });
  }
}
