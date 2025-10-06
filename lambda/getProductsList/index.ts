import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME!;
const STOCK_TABLE = process.env.STOCK_TABLE_NAME!;

interface Product {
  id: string;
  [key: string]: any;
}

interface Stock {
  product_id: string;
  count: number;
}

export const handler = async (): Promise<APIGatewayProxyResult> => {
  // Scan products table (small dev dataset)
  const productsRes = await ddb.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
  const products: Product[] = productsRes.Items as Product[] || [];

  const keys = products.map(p => ({ product_id: p.id }));
  let stockMap: Record<string, number> = {};
  if (keys.length) {
    const resp = await ddb.send(new BatchGetCommand({
      RequestItems: {
        [STOCK_TABLE]: { Keys: keys }
      }
    }));
    const stocks: Stock[] = resp.Responses ? resp.Responses[STOCK_TABLE] as Stock[] : [];
    stockMap = stocks.reduce((acc: Record<string, number>, s: Stock) => { acc[s.product_id] = s.count; return acc; }, {});
  }

  const joined = products.map(p => ({ ...p, count: stockMap[p.id] ?? 0 }));
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(joined)
  };
};
