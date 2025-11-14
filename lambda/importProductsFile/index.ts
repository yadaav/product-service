import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent } from 'aws-lambda';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;

export const handler = async (event: APIGatewayProxyEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const fileName = event.queryStringParameters?.name;
  if (!fileName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Missing file name in query string' })
    };
  }

  const key = `uploaded/${fileName}`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ url })
  };
};
