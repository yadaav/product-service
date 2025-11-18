import { APIGatewayProxyEvent } from 'aws-lambda';
export declare const handler: (event: APIGatewayProxyEvent) => Promise<{
    statusCode: number;
    headers: {
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Allow-Methods': string;
    };
    body: string;
}>;
