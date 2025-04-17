import * as cdk from "aws-cdk-lib";
import { Config } from "../config/loader";
import { VpcStack } from "../stacks/vpc-stack";
import { CommonAppStack } from "../stacks/common-app-stack";
import { AuthStack } from "../stacks/auth-stack";
import { ChatbotAppStack } from "../stacks/services/chatbot-app-stack";
import { ItemSearchAPIStack } from "../stacks/services/item-search-api-stack";

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
  cloudfront: Config.cloudfront,
  externalApiKey: Config.external.apiKey,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
commonAppStack.addDependency(vpcStack);

// Chatbot App
const chatbotAppStack = new ChatbotAppStack(app, `${Config.app.ns}ChatbotApp`, {
  cluster: commonAppStack.cluster,
  loadBalancer: commonAppStack.loadBalancer,
  loadBalancerSecurityGroup: commonAppStack.loadBalancerSecurityGroup,
  externalApi: {
    endpoint: commonAppStack.externalApi.api.apiEndpoint,
    apiKey: Config.external.apiKey,
  },
  cert: Config.cert,
  chatbot: Config.chatbot,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
chatbotAppStack.addDependency(commonAppStack);

// External APIs
// Item Search API
const itemSearchAPIStack = new ItemSearchAPIStack(
  app,
  `${Config.app.ns}ItemSearchAPI`,
  {
    vpc: vpcStack.vpc,
    osDomain: commonAppStack.opensearchCluster.domain,
    osSecurityGroup: commonAppStack.opensearchCluster.securityGroup,
    api: commonAppStack.externalApi.api,
    authorizer: commonAppStack.externalApi.authorizer,
    indexName: Config.external.itemSearch.indexName,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);
itemSearchAPIStack.addDependency(commonAppStack);

const tags = cdk.Tags.of(app);
tags.add("namespace", Config.app.ns);
tags.add("stage", Config.app.stage);

app.synth();
