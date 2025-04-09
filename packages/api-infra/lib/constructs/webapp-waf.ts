import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

export class WebappWAF extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly cidrAllowRanges: string[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsManagedRules: wafv2.CfnWebACL.RuleProperty = {
      name: "AWS-AWSManagedRulesCommonRuleSet",
      priority: 1,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          name: "AWSManagedRulesCommonRuleSet",
          vendorName: "AWS",
          excludedRules: [{ name: "SizeRestrictions_BODY" }],
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "awsCommonRules",
        sampledRequestsEnabled: true,
      },
    };

    this.webAcl = new wafv2.CfnWebACL(this, "WebACL", {
      defaultAction: {
        block: {},
      },
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "webACL",
        sampledRequestsEnabled: true,
      },
      rules: [awsManagedRules],
    });
  }
}

export class WebACLAssociation extends wafv2.CfnWebACLAssociation {
  constructor(scope: Construct, id: string, props: wafv2.CfnWebACLAssociationProps) {
      super(scope, id,{
          resourceArn: props.resourceArn,
          webAclArn: props.webAclArn,
      });
  }
}