import { typescript } from 'projen';
const project = new typescript.TypeScriptAppProject({
  defaultReleaseBranch: 'main',
  name: 'data-hydration',
  projenrcTs: true,

  deps: [
    'node-fetch',
    'xml-js',
  ], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    '@jest/globals',
  ], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();