import { typescript } from 'projen';
const project = new typescript.TypeScriptAppProject({
  defaultReleaseBranch: 'main',
  name: 'data-preparation',
  projenrcTs: true,

  deps: [
    'node-fetch',
    'xml-js',
    '@aws-sdk/client-s3',
  ], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    '@jest/globals',
    'tsx',
    '@tsconfig/node18',
    '@10mi2/tms-projen-projects',
  ], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
  gitignore: [
    'src/data/',
  ],
});
project.synth();