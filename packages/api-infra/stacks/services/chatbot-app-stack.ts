import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import { ChatbotApp } from "../../constructs/chatbot-app";

interface IProps extends cdk.StackProps {
  cluster: ecs.ICluster;
  loadBalancer: elbv2.IApplicationLoadBalancer;
  loadBalancerSecurityGroup: ec2.ISecurityGroup;
  cert: {
    recordName: string;
    domainName: string;
    hostedZoneId: string;
    certificateArn: string;
  };
  chatbot: {
    tableName: string;
    modelName: string;
  };
}

export class ChatbotAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    new ChatbotApp(this, "ChatbotApp", {
      cluster: props.cluster,
      loadBalancer: props.loadBalancer,
      loadBalancerSecurityGroup: props.loadBalancerSecurityGroup,
      cert: props.cert,
      chatbot: props.chatbot,
    });
  }
}
