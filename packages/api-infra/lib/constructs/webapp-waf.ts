import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

const CLOUDFRONT_IP_LIST = [
  "120.52.22.96/27",
  "205.251.249.0/24",
  "180.163.57.128/26",
  "204.246.168.0/22",
  "111.13.171.128/26",
  "18.160.0.0/15",
  "205.251.252.0/23",
  "54.192.0.0/16",
  "204.246.173.0/24",
  "54.230.200.0/21",
  "120.253.240.192/26",
  "116.129.226.128/26",
  "130.176.0.0/17",
  "3.173.192.0/18",
  "108.156.0.0/14",
  "99.86.0.0/16",
  "13.32.0.0/15",
  "120.253.245.128/26",
  "13.224.0.0/14",
  "70.132.0.0/18",
  "15.158.0.0/16",
  "111.13.171.192/26",
  "13.249.0.0/16",
  "18.238.0.0/15",
  "18.244.0.0/15",
  "205.251.208.0/20",
  "3.165.0.0/16",
  "3.168.0.0/14",
  "65.9.128.0/18",
  "130.176.128.0/18",
  "58.254.138.0/25",
  "205.251.206.0/23",
  "54.230.208.0/20",
  "3.160.0.0/14",
  "116.129.226.0/25",
  "52.222.128.0/17",
  "18.164.0.0/15",
  "111.13.185.32/27",
  "64.252.128.0/18",
  "205.251.254.0/24",
  "3.166.0.0/15",
  "54.230.224.0/19",
  "71.152.0.0/17",
  "216.137.32.0/19",
  "204.246.172.0/24",
  "205.251.202.0/23",
  "18.172.0.0/15",
  "120.52.39.128/27",
  "118.193.97.64/26",
  "3.164.64.0/18",
  "18.154.0.0/15",
  "3.173.0.0/17",
  "54.240.128.0/18",
  "205.251.250.0/23",
  "180.163.57.0/25",
  "52.46.0.0/18",
  "3.174.0.0/15",
  "52.82.128.0/19",
  "54.230.0.0/17",
  "54.230.128.0/18",
  "54.239.128.0/18",
  "130.176.224.0/20",
  "36.103.232.128/26",
  "52.84.0.0/15",
  "143.204.0.0/16",
  "144.220.0.0/16",
  "120.52.153.192/26",
  "119.147.182.0/25",
  "120.232.236.0/25",
  "111.13.185.64/27",
  "3.164.0.0/18",
  "3.172.64.0/18",
  "54.182.0.0/16",
  "58.254.138.128/26",
  "120.253.245.192/27",
  "54.239.192.0/19",
  "18.68.0.0/16",
  "18.64.0.0/14",
  "120.52.12.64/26",
  "99.84.0.0/16",
  "205.251.204.0/23",
  "130.176.192.0/19",
  "52.124.128.0/17",
  "204.246.164.0/22",
  "13.35.0.0/16",
  "204.246.174.0/23",
  "3.164.128.0/17",
  "3.172.0.0/18",
  "36.103.232.0/25",
  "119.147.182.128/26",
  "118.193.97.128/25",
  "120.232.236.128/26",
  "204.246.176.0/20",
  "65.8.0.0/16",
  "65.9.0.0/17",
  "108.138.0.0/15",
  "120.253.241.160/27",
  "3.173.128.0/18",
  "64.252.64.0/18",
  "13.113.196.64/26",
  "13.113.203.0/24",
  "52.199.127.192/26",
  "13.124.199.0/24",
  "3.35.130.128/25",
  "52.78.247.128/26",
  "13.203.133.0/26",
  "13.233.177.192/26",
  "15.207.13.128/25",
  "15.207.213.128/25",
  "52.66.194.128/26",
  "13.228.69.0/24",
  "47.129.82.0/24",
  "47.129.83.0/24",
  "47.129.84.0/24",
  "52.220.191.0/26",
  "13.210.67.128/26",
  "13.54.63.128/26",
  "3.107.43.128/25",
  "3.107.44.0/25",
  "3.107.44.128/25",
  "43.218.56.128/26",
  "43.218.56.192/26",
  "43.218.56.64/26",
  "43.218.71.0/26",
  "99.79.169.0/24",
  "18.192.142.0/23",
  "18.199.68.0/22",
  "18.199.72.0/22",
  "18.199.76.0/22",
  "35.158.136.0/24",
  "52.57.254.0/24",
  "18.200.212.0/23",
  "52.212.248.0/26",
  "13.134.24.0/23",
  "18.175.65.0/24",
  "18.175.66.0/24",
  "18.175.67.0/24",
  "3.10.17.128/25",
  "3.11.53.0/24",
  "52.56.127.0/25",
  "15.188.184.0/24",
  "52.47.139.0/24",
  "3.29.40.128/26",
  "3.29.40.192/26",
  "3.29.40.64/26",
  "3.29.57.0/26",
  "18.229.220.192/26",
  "18.230.229.0/24",
  "18.230.230.0/25",
  "54.233.255.128/26",
  "56.125.46.0/24",
  "56.125.47.0/32",
  "56.125.48.0/24",
  "3.231.2.0/25",
  "3.234.232.224/27",
  "3.236.169.192/26",
  "3.236.48.0/23",
  "34.195.252.0/24",
  "34.226.14.0/24",
  "44.220.194.0/23",
  "44.220.196.0/23",
  "44.220.198.0/23",
  "44.220.200.0/23",
  "44.220.202.0/23",
  "44.222.66.0/24",
  "13.59.250.0/26",
  "18.216.170.128/25",
  "3.128.93.0/24",
  "3.134.215.0/24",
  "3.146.232.0/22",
  "3.147.164.0/22",
  "3.147.244.0/22",
  "52.15.127.128/26",
  "3.101.158.0/23",
  "52.52.191.128/26",
  "34.216.51.0/25",
  "34.223.12.224/27",
  "34.223.80.192/26",
  "35.162.63.192/26",
  "35.167.191.128/26",
  "35.93.168.0/23",
  "35.93.170.0/23",
  "35.93.172.0/23",
  "44.227.178.0/24",
  "44.234.108.128/25",
  "44.234.90.252/30",
];

interface IProps {
  readonly allowIpList: string[];
  readonly cfSecretHeaderName: string;
  readonly cfSecretHeaderValue: string;
}

export class WebappWAF extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id);

    const rules = this.createRules(props);
    this.webAcl = new wafv2.CfnWebACL(this, "WebACL", {
      defaultAction: {
        block: {},
      },
      scope: "REGIONAL",
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
      addresses: CLOUDFRONT_IP_LIST.concat(props.allowIpList),
      ipAddressVersion: "IPV4",
      scope: "REGIONAL",
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

    // Alow Invalid CloudFront Header
    const allowInvalidCloudFrontHeader: wafv2.CfnWebACL.RuleProperty = {
      name: "AllowInvalidCloudFrontHeader",
      priority: 100,
      statement: {
        byteMatchStatement: {
          fieldToMatch: {
            singleHeader: { Name: props.cfSecretHeaderName },
          },
          positionalConstraint: "EXACTLY",
          searchString: props.cfSecretHeaderValue,
          textTransformations: [
            {
              priority: 0,
              type: "NONE",
            },
          ],
        },
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "AllowInvalidCloudFrontHeader",
        sampledRequestsEnabled: true,
      },
      action: { allow: {} },
    };

    return [
      awsManagedRulesAmazonIpReputationList,
      awsCommonRuleSet,
      awsManagedRulesKnownBadInputsRuleSet,
      allowIpListRuleSet,
      allowInvalidCloudFrontHeader,
    ];
  }
}

export class WebACLAssociation extends wafv2.CfnWebACLAssociation {
  constructor(
    scope: Construct,
    id: string,
    props: wafv2.CfnWebACLAssociationProps
  ) {
    super(scope, id, {
      resourceArn: props.resourceArn,
      webAclArn: props.webAclArn,
    });
  }
}
