import { SQSEvent } from "aws-lambda";
export declare const handler: (event: SQSEvent) => Promise<{
    statusCode: number;
    body: string;
}>;
