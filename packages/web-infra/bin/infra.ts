#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { Config } from "../config/loader";

const app = new cdk.App({
  context: {
    ns: Config.app.ns,
    stage: Config.app.stage,
  },
});

new FrontendStack(app, `${Config.app.ns}FrontendStack`, {
  repositoryPath: Config.repository.path,
  repositoryBranch: Config.repository.branch,
  secretHeaderName: Config.cloudfront.secretHeaderName,
  secretHeaderValue: Config.cloudfront.secretHeaderValue,
});
