import { S3Event } from "aws-lambda";
import { SQS } from "aws-sdk";
import csv from "csv-parser";
import S3 from "aws-sdk/clients/s3";

const sqs = new SQS();
const s3 = new S3();

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    const queueUrl = process.env.SQS_URL!;

    const s3Stream = s3.getObject({ Bucket: bucket, Key: key }).createReadStream();

    await new Promise((resolve, reject) => {
      const sendPromises: Promise<any>[] = [];
      s3Stream
        .pipe(csv())
        .on("data", (row) => {
          // No logging here
          sendPromises.push(
            sqs
              .sendMessage({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(row),
              })
              .promise()
          );
        })
        .on("end", async () => {
          await Promise.all(sendPromises);
          resolve(undefined);
        })
        .on("error", reject);
    });
  }
};
