import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as csv from 'csv-parser';

const s3 = new S3Client({});

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const s3Object = await s3.send(getObjectCommand);

    if (!s3Object.Body) continue;

    await new Promise((resolve, reject) => {
      const results: any[] = [];
      s3Object.Body.pipe(csv())
        .on('data', (data) => {
          console.log('Parsed record:', data);
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }
};
