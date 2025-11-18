"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductServiceStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const path = __importStar(require("path"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const eventSources = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
class ProductServiceStack extends cdk.Stack {
    productsApiUrl;
    constructor(scope, id, props) {
        super(scope, id, props);
        // ✅ Import existing tables (if they already exist) or create new ones
        const productsTable = dynamodb.Table.fromTableName(this, 'ProductsTableImported', 'products');
        const stockTable = dynamodb.Table.fromTableName(this, 'StockTableImported', 'stock');
        // Lambda: GET /products
        const getProductsLambda = new lambda.Function(this, 'getProductsList', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getProductsList')),
            functionName: 'getProductsList',
        });
        // Lambda: GET /products/{productId}
        const getProductsByIdLambda = new lambda.Function(this, 'getProductsById', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getProductsById')),
            functionName: 'getProductsById',
        });
        // Lambda environment variables
        const commonEnv = {
            PRODUCTS_TABLE_NAME: productsTable.tableName,
            STOCK_TABLE_NAME: stockTable.tableName,
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        };
        // create lambda
        const createProductLambda = new lambda.Function(this, 'createProduct', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'createProduct')),
            environment: commonEnv,
            functionName: 'createProduct'
        });
        productsTable.grantWriteData(createProductLambda);
        stockTable.grantWriteData(createProductLambda);
        getProductsLambda.addEnvironment('PRODUCTS_TABLE_NAME', productsTable.tableName);
        getProductsLambda.addEnvironment('STOCK_TABLE_NAME', stockTable.tableName);
        getProductsByIdLambda.addEnvironment('PRODUCTS_TABLE_NAME', productsTable.tableName);
        getProductsByIdLambda.addEnvironment('STOCK_TABLE_NAME', stockTable.tableName);
        // Grant read permissions to Lambdas
        productsTable.grantReadData(getProductsLambda);
        stockTable.grantReadData(getProductsLambda);
        productsTable.grantReadData(getProductsByIdLambda);
        stockTable.grantReadData(getProductsByIdLambda);
        createProductLambda.addEnvironment('PRODUCTS_TABLE_NAME', productsTable.tableName);
        createProductLambda.addEnvironment('STOCK_TABLE_NAME', stockTable.tableName);
        productsTable.grantWriteData(createProductLambda);
        stockTable.grantWriteData(createProductLambda);
        // 1. Create SQS queue catalogItemsQueue
        const catalogItemsQueue = new sqs.Queue(this, "catalogItemsQueue", {
            visibilityTimeout: cdk.Duration.seconds(30),
        });
        // 2. Create the Lambda catalogBatchProcess
        const catalogBatchProcess = new lambda.Function(this, "catalogBatchProcess", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "index.handler",
            code: lambda.Code.fromAsset("lambda/catalogBatchProcess"),
            environment: {
                PRODUCTS_TABLE: productsTable.tableName,
                SQS_URL: catalogItemsQueue.queueUrl,
            },
        });
        // 3. Grant Lambda permissions
        productsTable.grantWriteData(catalogBatchProcess);
        // 4. SQS → Lambda event source (batch size = 5)
        catalogBatchProcess.addEventSource(new eventSources.SqsEventSource(catalogItemsQueue, {
            batchSize: 5,
        }));
        // --- SNS topic and email subscription ---
        const createProductTopic = new sns.Topic(this, "createProductTopic");
        new sns.Subscription(this, "emailSubscription", {
            topic: createProductTopic,
            protocol: sns.SubscriptionProtocol.EMAIL,
            endpoint: "mahendra_yadav@epam.com",
        });
        createProductTopic.grantPublish(catalogBatchProcess);
        catalogBatchProcess.addEnvironment("SNS_TOPIC", createProductTopic.topicArn);
        // --- end SNS additions ---
        // Reference the existing Lambda function by ARN
        // const importFileParser = lambda.Function.fromFunctionArn(
        //   this,
        //   "ImportFileParserFunction",
        //   "arn:aws:lambda:us-east-1:837282923698:function:importFileParser"
        // );
        const importFileParser = lambda.Function.fromFunctionAttributes(this, "ImportFileParserFunction", {
            functionArn: "arn:aws:lambda:us-east-1:837282923698:function:importFileParser",
            role: iam.Role.fromRoleArn(this, "ImportFileParserRole", "arn:aws:iam::837282923698:role/importFileParserRole", { mutable: false })
        });
        // 4. Permissions — allow importFileParser to send SQS messages
        catalogItemsQueue.grantSendMessages(importFileParser);
        // API Gateway REST API
        const api = new apigateway.RestApi(this, 'ProductServiceApi', {
            restApiName: 'Product Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: ['GET', 'POST', 'OPTIONS'],
                allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token', 'X-Amz-User-Agent']
            },
        });
        // /products resource
        const products = api.root.addResource('products');
        const getProductsIntegration = new apigateway.LambdaIntegration(getProductsLambda, {
            proxy: true,
        });
        products.addMethod('GET', getProductsIntegration, {
            methodResponses: [{ statusCode: '200' }],
        });
        // /products/{productId} resource
        const productIdResource = products.addResource('{productId}');
        const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductsByIdLambda, {
            proxy: true,
        });
        productIdResource.addMethod('GET', getProductByIdIntegration, {
            methodResponses: [{ statusCode: '200' }, { statusCode: '404' }, { statusCode: '400' }],
        });
        products.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda, { proxy: true }), {
            methodResponses: [{ statusCode: '201' }, { statusCode: '400' }]
        });
        // Export API URL for easy access
        this.productsApiUrl = api.url;
        new cdk.CfnOutput(this, 'ProductsApiUrl', {
            value: `${this.productsApiUrl}products`,
            description: 'GET endpoint for products',
        });
    }
}
exports.ProductServiceStack = ProductServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC1zZXJ2aWNlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvZHVjdC1zZXJ2aWNlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHlEQUEyQztBQUczQywrREFBaUQ7QUFDakQsdUVBQXlEO0FBQ3pELDJDQUE2QjtBQUM3QixtRUFBcUQ7QUFDckQseURBQTJDO0FBQzNDLG1GQUFxRTtBQUNyRSx5REFBMkM7QUFHM0MsTUFBYSxtQkFBb0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNoQyxjQUFjLENBQVM7SUFFdkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixzRUFBc0U7UUFDdEUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzlGLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVyRix3QkFBd0I7UUFDeEIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3JFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLGVBQWU7WUFDeEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNwRixZQUFZLEVBQUUsaUJBQWlCO1NBQ2hDLENBQUMsQ0FBQztRQUVI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RUFBRSxJQUFJO1NBQ1osQ0FBQyxDQUFDO1FBQ0gsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSx5QkFBeUIsRUFBRTtZQUM1RCxlQUFlLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQztTQUN2RixDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1lBQ2pHLGVBQWUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1NBQ2hFLENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxVQUFVO1lBQ3ZDLFdBQVcsRUFBRSwyQkFBMkI7U0FDekMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbEtELGtEQWtLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcblxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgZXZlbnRTb3VyY2VzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgKiBhcyBzdWJzY3JpcHRpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBQcm9kdWN0U2VydmljZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHByb2R1Y3RzQXBpVXJsOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8g4pyFIEltcG9ydCBleGlzdGluZyB0YWJsZXMgKGlmIHRoZXkgYWxyZWFkeSBleGlzdCkgb3IgY3JlYXRlIG5ldyBvbmVzXG4gICAgY29uc3QgcHJvZHVjdHNUYWJsZSA9IGR5bmFtb2RiLlRhYmxlLmZyb21UYWJsZU5hbWUodGhpcywgJ1Byb2R1Y3RzVGFibGVJbXBvcnRlZCcsICdwcm9kdWN0cycpO1xuICAgIGNvbnN0IHN0b2NrVGFibGUgPSBkeW5hbW9kYi5UYWJsZS5mcm9tVGFibGVOYW1lKHRoaXMsICdTdG9ja1RhYmxlSW1wb3J0ZWQnLCAnc3RvY2snKTtcblxuICAgIC8vIExhbWJkYTogR0VUIC9wcm9kdWN0c1xuICAgIGNvbnN0IGdldFByb2R1Y3RzTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZ2V0UHJvZHVjdHNMaXN0Jywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2xhbWJkYScsICdnZXRQcm9kdWN0c0xpc3QnKSksXG4gICAgICBmdW5jdGlvbk5hbWU6ICdnZXRQcm9kdWN0c0xpc3QnLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhOiBHRVQgL3Byb2R1Y3RzL3twcm9kdWN0SWR9XG4gICAgY29uc3QgZ2V0UHJvZHVjdHNCeUlkTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZ2V0UHJvZHVjdHNCeUlkJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2xhbWJkYScsICdnZXRQcm9kdWN0c0J5SWQnKSksXG4gICAgICBmdW5jdGlvbk5hbWU6ICdnZXRQcm9kdWN0c0J5SWQnLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGVudmlyb25tZW50IHZhcmlhYmxlc1xuICAgIGNvbnN0IGNvbW1vbkVudiA9IHtcbiAgICAgIFBST0RVQ1RTX1RBQkxFX05BTUU6IHByb2R1Y3RzVGFibGUudGFibGVOYW1lLFxuICAgICAgU1RPQ0tfVEFCTEVfTkFNRTogc3RvY2tUYWJsZS50YWJsZU5hbWUsXG4gICAgICBBV1NfTk9ERUpTX0NPTk5FQ1RJT05fUkVVU0VfRU5BQkxFRDogJzEnLFxuICAgIH07XG5cbiAgICAvLyBjcmVhdGUgbGFtYmRhXG4gICAgICBjb25zdCBjcmVhdGVQcm9kdWN0TGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnY3JlYXRlUHJvZHVjdCcsIHtcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdsYW1iZGEnLCAnY3JlYXRlUHJvZHVjdCcpKSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudixcbiAgICAgICAgZnVuY3Rpb25OYW1lOiAnY3JlYXRlUHJvZHVjdCdcbiAgICAgIH0pO1xuICAgICAgcHJvZHVjdHNUYWJsZS5ncmFudFdyaXRlRGF0YShjcmVhdGVQcm9kdWN0TGFtYmRhKTtcbiAgICAgIHN0b2NrVGFibGUuZ3JhbnRXcml0ZURhdGEoY3JlYXRlUHJvZHVjdExhbWJkYSk7ICAgICAgXG4gICAgXG5cbiAgICBnZXRQcm9kdWN0c0xhbWJkYS5hZGRFbnZpcm9ubWVudCgnUFJPRFVDVFNfVEFCTEVfTkFNRScsIHByb2R1Y3RzVGFibGUudGFibGVOYW1lKTtcbiAgICBnZXRQcm9kdWN0c0xhbWJkYS5hZGRFbnZpcm9ubWVudCgnU1RPQ0tfVEFCTEVfTkFNRScsIHN0b2NrVGFibGUudGFibGVOYW1lKTtcblxuICAgIGdldFByb2R1Y3RzQnlJZExhbWJkYS5hZGRFbnZpcm9ubWVudCgnUFJPRFVDVFNfVEFCTEVfTkFNRScsIHByb2R1Y3RzVGFibGUudGFibGVOYW1lKTtcbiAgICBnZXRQcm9kdWN0c0J5SWRMYW1iZGEuYWRkRW52aXJvbm1lbnQoJ1NUT0NLX1RBQkxFX05BTUUnLCBzdG9ja1RhYmxlLnRhYmxlTmFtZSk7XG5cbiAgICAvLyBHcmFudCByZWFkIHBlcm1pc3Npb25zIHRvIExhbWJkYXNcbiAgICBwcm9kdWN0c1RhYmxlLmdyYW50UmVhZERhdGEoZ2V0UHJvZHVjdHNMYW1iZGEpO1xuICAgIHN0b2NrVGFibGUuZ3JhbnRSZWFkRGF0YShnZXRQcm9kdWN0c0xhbWJkYSk7XG5cbiAgICBwcm9kdWN0c1RhYmxlLmdyYW50UmVhZERhdGEoZ2V0UHJvZHVjdHNCeUlkTGFtYmRhKTtcbiAgICBzdG9ja1RhYmxlLmdyYW50UmVhZERhdGEoZ2V0UHJvZHVjdHNCeUlkTGFtYmRhKTtcblxuICAgIGNyZWF0ZVByb2R1Y3RMYW1iZGEuYWRkRW52aXJvbm1lbnQoJ1BST0RVQ1RTX1RBQkxFX05BTUUnLCBwcm9kdWN0c1RhYmxlLnRhYmxlTmFtZSk7XG4gICAgY3JlYXRlUHJvZHVjdExhbWJkYS5hZGRFbnZpcm9ubWVudCgnU1RPQ0tfVEFCTEVfTkFNRScsIHN0b2NrVGFibGUudGFibGVOYW1lKTtcblxuICAgIHByb2R1Y3RzVGFibGUuZ3JhbnRXcml0ZURhdGEoY3JlYXRlUHJvZHVjdExhbWJkYSk7XG4gICAgc3RvY2tUYWJsZS5ncmFudFdyaXRlRGF0YShjcmVhdGVQcm9kdWN0TGFtYmRhKTtcbiAgICBcbiAgICAvLyAxLiBDcmVhdGUgU1FTIHF1ZXVlIGNhdGFsb2dJdGVtc1F1ZXVlXG4gICAgY29uc3QgY2F0YWxvZ0l0ZW1zUXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsIFwiY2F0YWxvZ0l0ZW1zUXVldWVcIiwge1xuICAgICAgdmlzaWJpbGl0eVRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIC8vIDIuIENyZWF0ZSB0aGUgTGFtYmRhIGNhdGFsb2dCYXRjaFByb2Nlc3NcbiAgICBjb25zdCBjYXRhbG9nQmF0Y2hQcm9jZXNzID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcImNhdGFsb2dCYXRjaFByb2Nlc3NcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiBcImluZGV4LmhhbmRsZXJcIixcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImxhbWJkYS9jYXRhbG9nQmF0Y2hQcm9jZXNzXCIpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUFJPRFVDVFNfVEFCTEU6IHByb2R1Y3RzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBTUVNfVVJMOiBjYXRhbG9nSXRlbXNRdWV1ZS5xdWV1ZVVybCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyAzLiBHcmFudCBMYW1iZGEgcGVybWlzc2lvbnNcbiAgICBwcm9kdWN0c1RhYmxlLmdyYW50V3JpdGVEYXRhKGNhdGFsb2dCYXRjaFByb2Nlc3MpO1xuXG4gICAgLy8gNC4gU1FTIOKGkiBMYW1iZGEgZXZlbnQgc291cmNlIChiYXRjaCBzaXplID0gNSlcbiAgICBjYXRhbG9nQmF0Y2hQcm9jZXNzLmFkZEV2ZW50U291cmNlKFxuICAgICAgbmV3IGV2ZW50U291cmNlcy5TcXNFdmVudFNvdXJjZShjYXRhbG9nSXRlbXNRdWV1ZSwge1xuICAgICAgICBiYXRjaFNpemU6IDUsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyAtLS0gU05TIHRvcGljIGFuZCBlbWFpbCBzdWJzY3JpcHRpb24gLS0tXG4gICAgY29uc3QgY3JlYXRlUHJvZHVjdFRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCBcImNyZWF0ZVByb2R1Y3RUb3BpY1wiKTtcblxuICAgIG5ldyBzbnMuU3Vic2NyaXB0aW9uKHRoaXMsIFwiZW1haWxTdWJzY3JpcHRpb25cIiwge1xuICAgICAgdG9waWM6IGNyZWF0ZVByb2R1Y3RUb3BpYyxcbiAgICAgIHByb3RvY29sOiBzbnMuU3Vic2NyaXB0aW9uUHJvdG9jb2wuRU1BSUwsXG4gICAgICBlbmRwb2ludDogXCJtYWhlbmRyYV95YWRhdkBlcGFtLmNvbVwiLCBcbiAgICB9KTtcblxuICAgIGNyZWF0ZVByb2R1Y3RUb3BpYy5ncmFudFB1Ymxpc2goY2F0YWxvZ0JhdGNoUHJvY2Vzcyk7XG5cbiAgICBjYXRhbG9nQmF0Y2hQcm9jZXNzLmFkZEVudmlyb25tZW50KFwiU05TX1RPUElDXCIsIGNyZWF0ZVByb2R1Y3RUb3BpYy50b3BpY0Fybik7XG4gICAgLy8gLS0tIGVuZCBTTlMgYWRkaXRpb25zIC0tLVxuXG4gICAgLy8gUmVmZXJlbmNlIHRoZSBleGlzdGluZyBMYW1iZGEgZnVuY3Rpb24gYnkgQVJOXG4gICAgLy8gY29uc3QgaW1wb3J0RmlsZVBhcnNlciA9IGxhbWJkYS5GdW5jdGlvbi5mcm9tRnVuY3Rpb25Bcm4oXG4gICAgLy8gICB0aGlzLFxuICAgIC8vICAgXCJJbXBvcnRGaWxlUGFyc2VyRnVuY3Rpb25cIixcbiAgICAvLyAgIFwiYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjgzNzI4MjkyMzY5ODpmdW5jdGlvbjppbXBvcnRGaWxlUGFyc2VyXCJcbiAgICAvLyApO1xuICAgIGNvbnN0IGltcG9ydEZpbGVQYXJzZXIgPSBsYW1iZGEuRnVuY3Rpb24uZnJvbUZ1bmN0aW9uQXR0cmlidXRlcyh0aGlzLCBcIkltcG9ydEZpbGVQYXJzZXJGdW5jdGlvblwiLCB7XG4gICAgICBmdW5jdGlvbkFybjogXCJhcm46YXdzOmxhbWJkYTp1cy1lYXN0LTE6ODM3MjgyOTIzNjk4OmZ1bmN0aW9uOmltcG9ydEZpbGVQYXJzZXJcIixcbiAgICAgIHJvbGU6IGlhbS5Sb2xlLmZyb21Sb2xlQXJuKFxuICAgICAgICB0aGlzLFxuICAgICAgICBcIkltcG9ydEZpbGVQYXJzZXJSb2xlXCIsXG4gICAgICAgIFwiYXJuOmF3czppYW06OjgzNzI4MjkyMzY5ODpyb2xlL2ltcG9ydEZpbGVQYXJzZXJSb2xlXCIsXG4gICAgICAgIHsgbXV0YWJsZTogZmFsc2UgfVxuICAgICAgKVxuICAgIH0pO1xuXG4gICAgLy8gNC4gUGVybWlzc2lvbnMg4oCUIGFsbG93IGltcG9ydEZpbGVQYXJzZXIgdG8gc2VuZCBTUVMgbWVzc2FnZXNcbiAgICBjYXRhbG9nSXRlbXNRdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhpbXBvcnRGaWxlUGFyc2VyKTtcblxuICAgIC8vIEFQSSBHYXRld2F5IFJFU1QgQVBJXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnUHJvZHVjdFNlcnZpY2VBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ1Byb2R1Y3QgU2VydmljZScsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsIFxuICAgICAgICBhbGxvd01ldGhvZHM6IFsnR0VUJywgJ1BPU1QnLCAnT1BUSU9OUyddLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BbXotRGF0ZScsICdYLUFwaS1LZXknLCAnWC1BbXotU2VjdXJpdHktVG9rZW4nLCAnWC1BbXotVXNlci1BZ2VudCddXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gL3Byb2R1Y3RzIHJlc291cmNlXG4gICAgY29uc3QgcHJvZHVjdHMgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgncHJvZHVjdHMnKTtcbiAgICBjb25zdCBnZXRQcm9kdWN0c0ludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UHJvZHVjdHNMYW1iZGEsIHtcbiAgICAgIHByb3h5OiB0cnVlLFxuICAgIH0pO1xuICAgIHByb2R1Y3RzLmFkZE1ldGhvZCgnR0VUJywgZ2V0UHJvZHVjdHNJbnRlZ3JhdGlvbiwge1xuICAgICAgbWV0aG9kUmVzcG9uc2VzOiBbeyBzdGF0dXNDb2RlOiAnMjAwJyB9XSxcbiAgICB9KTtcblxuICAgIC8vIC9wcm9kdWN0cy97cHJvZHVjdElkfSByZXNvdXJjZVxuICAgIGNvbnN0IHByb2R1Y3RJZFJlc291cmNlID0gcHJvZHVjdHMuYWRkUmVzb3VyY2UoJ3twcm9kdWN0SWR9Jyk7XG4gICAgY29uc3QgZ2V0UHJvZHVjdEJ5SWRJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdldFByb2R1Y3RzQnlJZExhbWJkYSwge1xuICAgICAgcHJveHk6IHRydWUsXG4gICAgfSk7XG4gICAgcHJvZHVjdElkUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBnZXRQcm9kdWN0QnlJZEludGVncmF0aW9uLCB7XG4gICAgICBtZXRob2RSZXNwb25zZXM6IFt7IHN0YXR1c0NvZGU6ICcyMDAnIH0sIHsgc3RhdHVzQ29kZTogJzQwNCcgfSwgeyBzdGF0dXNDb2RlOiAnNDAwJyB9XSxcbiAgICB9KTtcbiAgICBcbiAgICBwcm9kdWN0cy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihjcmVhdGVQcm9kdWN0TGFtYmRhLCB7IHByb3h5OiB0cnVlIH0pLCB7XG4gICAgICBtZXRob2RSZXNwb25zZXM6IFt7IHN0YXR1c0NvZGU6ICcyMDEnIH0sIHsgc3RhdHVzQ29kZTogJzQwMCcgfV1cbiAgICB9KTtcblxuICAgIC8vIEV4cG9ydCBBUEkgVVJMIGZvciBlYXN5IGFjY2Vzc1xuICAgIHRoaXMucHJvZHVjdHNBcGlVcmwgPSBhcGkudXJsO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQcm9kdWN0c0FwaVVybCcsIHtcbiAgICAgIHZhbHVlOiBgJHt0aGlzLnByb2R1Y3RzQXBpVXJsfXByb2R1Y3RzYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR0VUIGVuZHBvaW50IGZvciBwcm9kdWN0cycsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==