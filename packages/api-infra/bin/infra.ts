import * as cdk from "aws-cdk-lib";
import { Config } from "../config/loader";
import { VpcStack } from "../lib/stacks/vpc-stack";
import { CommonAppStack } from "../lib/stacks/common-app-stack";
import { AuthStack } from "../lib/stacks/auth-stack";
import { ChatbotAppStack } from "../lib/stacks/services/chatbot-app-stack";

const app = new cdk.App({
  context: {
    ns: Config.app.ns,
    stage: Config.app.stage,
    isProd: Config.app.stage.toLowerCase() === "prod",
  },
});

new AuthStack(app, `${Config.app.ns}Auth`, {
  callbackUrls: Config.auth.callbackUrls,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const vpcStack = new VpcStack(app, `${Config.app.ns}Vpc`, {
  vpcId: Config.vpc?.vpcId,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const commonAppStack = new CommonAppStack(app, `${Config.app.ns}CommonApp`, {
  vpc: vpcStack.vpc,
  tableName: Config.chatbot.tableName,
  allowIpList: Config.chatbot.allowIpList,
  cloudfront: Config.cloudfront,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
commonAppStack.addDependency(vpcStack);

const chatbotAppStack = new ChatbotAppStack(app, `${Config.app.ns}ChatbotApp`, {
  cluster: commonAppStack.cluster,
  loadBalancer: commonAppStack.loadBalancer,
  loadBalancerSecurityGroup: commonAppStack.loadBalancerSecurityGroup,
  cert: Config.cert,
  chatbotTableName: Config.chatbot.tableName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
chatbotAppStack.addDependency(commonAppStack);

const tags = cdk.Tags.of(app);
tags.add("namespace", Config.app.ns);
tags.add("stage", Config.app.stage);

app.synth();
