import * as fs from "fs";
import * as path from "path";
import * as joi from "joi";
import * as toml from "toml";

interface IConfig {
  app: {
    ns: string;
    stage: "Dev" | "Prod";
  };
  auth: {
    callbackUrls: string[];
  };
  vpc?: {
    vpcId?: string;
  };
  cert: {
    recordName: string;
    domainName: string;
    hostedZoneId: string;
    certificateArn: string;
  };
  chatbot: {
    tableName: string;
    allowIpList: string[];
  };
  cloudfront: {
    secretHeaderName: string;
    secretHeaderValue: string;
  };
}

const cfg = toml.parse(
  fs.readFileSync(path.resolve(__dirname, "..", ".toml"), "utf-8")
);
console.log("loaded config", JSON.stringify(cfg, null, 2));

const schema = joi
  .object({
    app: joi
      .object({
        ns: joi.string().required(),
        stage: joi.string().valid("Dev", "Prod").required(),
      })
      .required(),
    auth: joi
      .object({
        callbackUrls: joi.array().items(joi.string()).required(),
      })
      .required(),
    vpc: joi
      .object({
        vpcId: joi.string().optional(),
      })
      .optional(),
    cert: joi
      .object({
        recordName: joi.string().required(),
        domainName: joi.string().required(),
        hostedZoneId: joi.string().required(),
        certificateArn: joi.string().required(),
      })
      .required(),
    chatbot: joi
      .object({
        tableName: joi.string().required(),
        allowIpList: joi
          .array()
          .items(joi.string().ip({ cidr: "required" }))
          .required(),
      })
      .required(),
    cloudfront: joi
      .object({
        secretHeaderName: joi.string().required(),
        secretHeaderValue: joi.string().required(),
      })
      .required(),
  })
  .unknown();

const { error } = schema.validate(cfg);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const Config: IConfig = {
  ...cfg,
  app: {
    ...cfg.app,
    ns: `${cfg.app.ns}${cfg.app.stage}`,
  },
};
