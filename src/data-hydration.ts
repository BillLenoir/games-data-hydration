/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// snippet-start:[s3.JavaScript.buckets.uploadV3]
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const hydrateData = async (gameData: string) => {
  const client = new S3Client({});
  const command = new PutObjectCommand({
    Bucket: 'beepbucket',
    Key: 'collectionData.txt',
    Body: gameData,
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};
// snippet-end:[s3.JavaScript.buckets.uploadV3]