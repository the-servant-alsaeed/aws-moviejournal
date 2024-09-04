import { readFileSync } from "node:fs";

import { AWS } from "@serverless/typescript";
import yml from "js-yaml";

import functions from "./functions";
import resources from "./resources";

module.exports = {
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    stage: '${opt:stage, self:custom.defaultStage}',
    deploymentMethod: 'direct',
    memorySize: 1024,
    architecture: 'arm64',
    versionFunctions: false,
    logRetentionInDays: 365,
  },
  plugins: ["serverless-esbuild", "serverless-iam-roles-per-function"],
  service: "movie-app-serverless-backend",
  package: {
    individually: true
  },
  custom: {
    defaultStage: "dev",
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: true,
      sourcesContent: false,
      treeShaking: true,
      outExtension: {
        '.js': '.mjs'
      },
      plugins: './esbuild-plugin.js',
      banner: {
        // https://github.com/evanw/esbuild/issues/1921
        js: "import { createRequire } from 'module';import { fileURLToPath } from 'url';import { dirname } from 'path';const require = createRequire(import.meta.url);const __filename = fileURLToPath(import.meta.url);const __dirname = dirname(__filename);"
      },
      target: 'node20',
      platform: 'node',
      format: 'esm',
      concurrency: 10
    }
  },
  functions: Array.isArray(functions)
    ? functions.reduce((res: any, row) => {
        const data = yml.load(readFileSync(row));
        for (let [key, val] of Object.entries<any>(data)) {
          res[key] = { ...res[key], ...val };
        }
        return res;
      }, {})
    : functions,
  resources: Array.isArray(resources)
  ? resources.reduce((res: any, row) => {
      const data = yml.load(readFileSync(row));
      for (let [key, val] of Object.entries<any>(data)) {
        res[key] = { ...res[key], ...val };
      }
      return res;
    }, {})
  : resources,
} as AWS;
