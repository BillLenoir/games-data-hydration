import fs from 'fs/promises';
import { expect, test } from '@jest/globals';

const rawResponseFile: string = '../src/data/rawResponse.xml';
const rawResponse = await fs.readFile(rawResponseFile);
console.log(rawResponse);


test('Is the raw response XML file readable?', async () => {
//  expect(testResponseJSON.singleResult.data).not.toBeUndefined();
});