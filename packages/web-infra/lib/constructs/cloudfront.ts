import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

interface Props {
  apiUri: string;
  bucket: s3.IBucket;
  secretHeaderName: string;
  secretHeaderValue: string;
}

export class Cloudfront extends Construct {
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const ns = this.node.tryGetContext("ns") as string;

    const apiHttpOrigin = new origins.HttpOrigin(props.apiUri, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      customHeaders: {
        [props.secretHeaderName]: props.secretHeaderValue,
      },
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(
      props.bucket,
      {
        customHeaders: {
          [props.secretHeaderName]: props.secretHeaderValue,
        },
      }
    );

    const cfDist = new cloudfront.Distribution(this, `${ns}Distribution`, {
      defaultBehavior: {
        origin: s3Origin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiHttpOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      comment: ns,
    });
    this.distributionId = cfDist.distributionId;

    new cdk.CfnOutput(this, `DistId`, {
      exportName: `${ns}DistId`,
      value: cfDist.distributionId,
    });
    new cdk.CfnOutput(this, `DistDomainName`, {
      exportName: `${ns}DistDomainName`,
      value: cfDist.distributionDomainName,
    });
  }
}
