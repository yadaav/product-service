const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE = process.env.STOCK_TABLE_NAME;

import { APIGatewayProxyEvent } from 'aws-lambda';

exports.handler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body ? JSON.parse(event.body) : event;
    if (!body || !body.title || typeof body.price !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Invalid payload. Required: title (string), price (number).' })
      };
    }

    const id = uuidv4();
    const product = {
      id,
      title: body.title,
      description: body.description || '',
      price: body.price
    };

    await ddb.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));

    const initialCount = typeof body.count === 'number' ? body.count : 0;
    if (initialCount >= 0 && STOCK_TABLE) {
      const stockItem = { product_id: id, count: initialCount };
      await ddb.send(new PutCommand({ TableName: STOCK_TABLE, Item: stockItem }));
    }

    const responseBody = { id, product, stock: initialCount };
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(responseBody)
    };
  } catch (err) {
    console.error('createProduct error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
