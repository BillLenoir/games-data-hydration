import { TmsTypeScriptAppProject } from "@10mi2/tms-projen-projects";
import { NodePackageManager } from "projen/lib/javascript";

const project = new TmsTypeScriptAppProject({
  defaultReleaseBranch: "main",
  name: "data-preparation",
  projenrcTs: true,
  packageManager: NodePackageManager.YARN_BERRY,

  deps: [
    "node-fetch",
    "xml-js",
    "@aws-sdk/client-s3",
    "dotenv",
  ] /* Runtime dependencies of this module. */,
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    "@jest/globals",
    "tsx",
    "@tsconfig/node18",
    "@10mi2/tms-projen-projects",
  ] /* Build dependencies for this module. */,
  // packageName: undefined,  /* The "name" in package.json. */
  gitignore: ["src/data/", "src/.env", "src/data/rawResponse.xml"],
});
project.synth();
