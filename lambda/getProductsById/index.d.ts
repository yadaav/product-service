export type Product = {
    id: string;
    title: string;
    price: number;
    currency: string;
    image: string;
    category: string;
};
interface APIGatewayEvent {
    pathParameters?: {
        productId?: string;
    };
}
export declare const handler: (event: APIGatewayEvent) => Promise<{
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Access-Control-Allow-Origin': string;
    };
    body: string;
}>;
export {};
