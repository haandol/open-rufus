import * as cdk from "aws-cdk-lib";
import { Config } from "../config/loader";
import { VpcStack } from "../lib/stacks/vpc-stack";
import { CommonAppStack } from "../lib/stacks/common-app-stack";
import { AuthStack } from "../lib/stacks/auth-stack";
import { ChatbotAppStack } from "../lib/stacks/services/chatbot-app-stack";
// import { ItemSearchAPIStack } from "../lib/stacks/services/item-search-api-stack";
// import { ItemRecAPIStack } from "../lib/stacks/services/item-rec-api-stack";
// import { OpensearchStack } from "../lib/stacks/opensearch-stack";

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
  allowIpList: Config.cloudfront.allowIpList,
  cfSecretHeaderName: Config.cloudfront.secretHeaderName,
  cfSecretHeaderValue: Config.cloudfront.secretHeaderValue,
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
  authApiKey: Config.auth.apiKey,
  itemRecApiHost: Config.external.itemRec.endpoint,
  itemSearchApiHost: Config.external.itemSearch.endpoint,
  chatbotTableName: Config.chatbot.tableName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
chatbotAppStack.addDependency(commonAppStack);

/*
// External services
const opensearchStack = new OpensearchStack(
  app,
  `${Config.app.ns}Opensearch`,
  {
    vpc: vpcStack.vpc,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  },
);
opensearchStack.addDependency(vpcStack);

const itemSearchAPIStack = new ItemSearchAPIStack(
  app,
  `${Config.app.ns}ItemSearchAPI`,
  {
    vpc: vpcStack.vpc,
    api: commonAppStack.externalApi,
    osDomain: opensearchStack.os.domain,
    osSecurityGroup: opensearchStack.os.securityGroup,
    indexName: Config.external.itemSearch.indexName,
    authApiKey: Config.auth.apiKey,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  },
);
itemSearchAPIStack.addDependency(vpcStack);
itemSearchAPIStack.addDependency(commonAppStack);
itemSearchAPIStack.addDependency(opensearchStack);

const itemRecAPIStack = new ItemRecAPIStack(
  app,
  `${Config.app.ns}ItemRec`,
  {
    vpc: vpcStack.vpc,
    api: commonAppStack.externalApi,
    osDomain: opensearchStack.os.domain,
    osSecurityGroup: opensearchStack.os.securityGroup,
    indexName: Config.external.itemRec.indexName,
    authApiKey: Config.auth.apiKey,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  },
);
itemRecAPIStack.addDependency(vpcStack);
itemRecAPIStack.addDependency(commonAppStack);
itemRecAPIStack.addDependency(opensearchStack);
*/

const tags = cdk.Tags.of(app);
tags.add("namespace", Config.app.ns);
tags.add("stage", Config.app.stage);

app.synth();
