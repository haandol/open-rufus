import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { ChatbotApp } from "../../constructs/chatbot-app";

interface IProps extends cdk.StackProps {
  cluster: ecs.ICluster;
  loadBalancer: elbv2.IApplicationLoadBalancer;
  authApiKey: string;
  itemRecApiHost: string;
  itemSearchApiHost: string;
  chatbotTableName: string;
}

export class ChatbotAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    new ChatbotApp(this, "ChatbotApp", {
      cluster: props.cluster,
      loadBalancer: props.loadBalancer,
      authApiKey: props.authApiKey,
      itemRecApiHost: props.itemRecApiHost,
      itemSearchApiHost: props.itemSearchApiHost,
      chatbotTableName: props.chatbotTableName,
    });
  }
}
