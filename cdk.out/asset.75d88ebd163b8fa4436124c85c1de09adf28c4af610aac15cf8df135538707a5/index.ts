import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '..', 'getProductsList', 'products.json');

export type Product = {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  category: string;
};

let products: Product[] = [];

// Lazy load products once
try {
  const raw = fs.readFileSync(productsPath, 'utf8');
  products = JSON.parse(raw) as Product[];
} catch (err) {
  console.error('Failed to load products.json', err);
  products = [];
}

// Define API Gateway event type (basic)
interface APIGatewayEvent {
  pathParameters?: {
    productId?: string;
  };
}

export const handler = async (event: APIGatewayEvent) => {
  const productId = event.pathParameters?.productId ?? null;

  if (!productId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Missing productId in path' })
    };
  }

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Product not found' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(product)
  };
};
