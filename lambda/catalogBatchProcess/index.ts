import { SQSEvent } from "aws-lambda";
import { DynamoDB, SNS } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNS();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const SNS_TOPIC = process.env.SNS_TOPIC!;

export const handler = async (event: SQSEvent) => {
  const createdProducts = [];

  for (const record of event.Records) {
    const product = JSON.parse(record.body);

    // Example: add a unique id if not present
    if (!product.id) {
      product.id = `${Date.now()}-${Math.random()}`;
    }

    await dynamoDb
      .put({
        TableName: PRODUCTS_TABLE,
        Item: product,
      })
      .promise();

    createdProducts.push(product);
  }

  // Notify via SNS after all products are created
  if (createdProducts.length > 0) {
    await sns
      .publish({
        TopicArn: SNS_TOPIC,
        Subject: "Products created",
        Message: `Products created: ${createdProducts.map((p) => p.title || p.id).join(", ")}`,
      })
      .promise();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Batch processed", count: createdProducts.length }),
  };
};
