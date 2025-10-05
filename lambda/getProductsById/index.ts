import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, 'products.json');

export type Product = {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  category: string;
};

let products: Product[] = [];
try {
  const raw = fs.readFileSync(productsPath, 'utf8');
  products = JSON.parse(raw) as Product[];
  console.log('Loaded products count:', products.length);
} catch (err) {
  console.error('Failed to load products.json', err);
  products = [];
}

interface APIGatewayEvent {
  pathParameters?: { productId?: string };
  // include other fields if you want to test locally
}

export const handler = async (event: APIGatewayEvent) => {
  console.log('EVENT', JSON.stringify(event));
  const productId = event.pathParameters?.productId ?? null;
  console.log('productId resolved:', productId);

  if (!productId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Missing productId in path' })
    };
  }

  const normalizedId = String(productId).trim().toLowerCase();
  const product = products.find(p =>
    [p.id, (p as any).productId, (p as any).sku, (p as any).slug]
      .filter(Boolean)
      .some(v => String(v).trim().toLowerCase() === normalizedId)
  );

  if (!product) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Product not found' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(product)
  };
};
