import * as path from "path";
import * as joi from "joi";
import * as toml from "toml";
import * as fs from "fs";

interface IConfig {
  app: {
    ns: string;
    stage: string;
  };
  cloudfront: {
    secretHeaderName: string;
    secretHeaderValue: string;
  };
  repository: {
    path: string;
    branch: string;
  };
}

const cfg = toml.parse(
  fs.readFileSync(path.resolve(__dirname, "..", ".toml"), "utf-8")
);
console.log("loaded config", cfg);

const schema = joi
  .object({
    app: joi.object({
      ns: joi.string().required(),
      stage: joi.string().required(),
    }),
    cloudfront: joi
      .object({
        secretHeaderName: joi.string().required(),
        secretHeaderValue: joi.string().required(),
      })
      .required(),
    repository: joi
      .object({
        path: joi.string(),
        branch: joi.string(),
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
