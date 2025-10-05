const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE = process.env.STOCK_TABLE_NAME;

import { APIGatewayProxyEvent } from 'aws-lambda';

exports.handler = async (event: APIGatewayProxyEvent) => {
  const id = event.pathParameters && event.pathParameters.productId;
  if (!id) return { statusCode: 400, body: JSON.stringify({ message: 'Missing productId' }) };

  const productRes = await ddb.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }));
  if (!productRes.Item) return { statusCode: 404, body: JSON.stringify({ message: 'Product not found' }) };

  const stockRes = await ddb.send(new GetCommand({ TableName: STOCK_TABLE, Key: { product_id: id } }));
  const count = stockRes.Item ? stockRes.Item.count : 0;
  const joined = { ...productRes.Item, count };
  return { statusCode: 200, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify(joined) };
};
