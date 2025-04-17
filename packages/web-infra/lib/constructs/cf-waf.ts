import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

interface IProps {
  readonly allowIpList: string[];
}

export class CloudfrontWAF extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const rules = this.createRules(props);
    this.webAcl = new wafv2.CfnWebACL(this, "WebACL", {
      defaultAction: {
        block: {},
      },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "WebACL",
        sampledRequestsEnabled: true,
      },
      rules,
    });
  }

  private createRules(props: IProps): wafv2.CfnWebACL.RuleProperty[] {
    // Block AWSManagedRulesAmazonIpReputationList
    const awsManagedRulesAmazonIpReputationList: wafv2.CfnWebACL.RuleProperty =
      {
        name: "AWS-AWSManagedRulesAmazonIpReputationList",
        priority: 20,
        statement: {
          managedRuleGroupStatement: {
            name: "AWSManagedRulesAmazonIpReputationList",
            vendorName: "AWS",
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: "AWSManagedRulesAmazonIpReputationListMetric",
          sampledRequestsEnabled: true,
        },
        overrideAction: {
          none: {},
        },
      };

    // Block AWSManagedRulesCommonRuleSet
    const awsCommonRuleSet: wafv2.CfnWebACL.RuleProperty = {
      name: "AWS-AWSManagedRulesCommonRuleSet",
      priority: 40,
      statement: {
        managedRuleGroupStatement: {
          name: "AWSManagedRulesCommonRuleSet",
          vendorName: "AWS",
          excludedRules: [
            {
              name: "SizeRestrictions_BODY",
            },
          ],
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "AWSManagedRulesCommonRuleSetMetric",
        sampledRequestsEnabled: true,
      },
      overrideAction: {
        none: {},
      },
    };

    // Block AWSManagedRulesKnownBadInputsRuleSet
    const awsManagedRulesKnownBadInputsRuleSet: wafv2.CfnWebACL.RuleProperty = {
      name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
      priority: 50,
      statement: {
        managedRuleGroupStatement: {
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          vendorName: "AWS",
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "AWSManagedRulesKnownBadInputsRuleSetMetric",
        sampledRequestsEnabled: true,
      },
      overrideAction: {
        none: {},
      },
    };

    // AllowIpListRuleSet
    const ipSet = new wafv2.CfnIPSet(this, "IpSet", {
      addresses: props.allowIpList,
      ipAddressVersion: "IPV4",
      scope: "CLOUDFRONT",
    });
    const allowIpListRuleSet: wafv2.CfnWebACL.RuleProperty = {
      name: "AllowIpListRuleSet",
      priority: 80,
      statement: {
        ipSetReferenceStatement: {
          arn: ipSet.attrArn,
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "AllowIpList",
      },
      action: {
        allow: {},
      },
    };

    return [
      awsManagedRulesAmazonIpReputationList,
      awsCommonRuleSet,
      awsManagedRulesKnownBadInputsRuleSet,
      allowIpListRuleSet,
    ];
  }
}
