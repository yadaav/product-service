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
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const path = __importStar(require("path"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
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
        // API Gateway REST API
        const api = new apigateway.RestApi(this, 'ProductServiceApi', {
            restApiName: 'Product Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: ['GET', 'POST'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC1zZXJ2aWNlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvZHVjdC1zZXJ2aWNlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLCtEQUFpRDtBQUNqRCx1RUFBeUQ7QUFDekQsMkNBQTZCO0FBQzdCLG1FQUFxRDtBQUVyRCxNQUFhLG1CQUFvQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ2hDLGNBQWMsQ0FBUztJQUV2QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHNFQUFzRTtRQUN0RSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDOUYsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXJGLHdCQUF3QjtRQUN4QixNQUFNLGlCQUFpQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDckUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3BGLFlBQVksRUFBRSxpQkFBaUI7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxD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RjtBQXZHRCxrREF1R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuXG5leHBvcnQgY2xhc3MgUHJvZHVjdFNlcnZpY2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBwcm9kdWN0c0FwaVVybDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIOKchSBJbXBvcnQgZXhpc3RpbmcgdGFibGVzIChpZiB0aGV5IGFscmVhZHkgZXhpc3QpIG9yIGNyZWF0ZSBuZXcgb25lc1xuICAgIGNvbnN0IHByb2R1Y3RzVGFibGUgPSBkeW5hbW9kYi5UYWJsZS5mcm9tVGFibGVOYW1lKHRoaXMsICdQcm9kdWN0c1RhYmxlSW1wb3J0ZWQnLCAncHJvZHVjdHMnKTtcbiAgICBjb25zdCBzdG9ja1RhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZSh0aGlzLCAnU3RvY2tUYWJsZUltcG9ydGVkJywgJ3N0b2NrJyk7XG5cbiAgICAvLyBMYW1iZGE6IEdFVCAvcHJvZHVjdHNcbiAgICBjb25zdCBnZXRQcm9kdWN0c0xhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2dldFByb2R1Y3RzTGlzdCcsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdsYW1iZGEnLCAnZ2V0UHJvZHVjdHNMaXN0JykpLFxuICAgICAgZnVuY3Rpb25OYW1lOiAnZ2V0UHJvZHVjdHNMaXN0JyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYTogR0VUIC9wcm9kdWN0cy97cHJvZHVjdElkfVxuICAgIGNvbnN0IGdldFByb2R1Y3RzQnlJZExhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2dldFByb2R1Y3RzQnlJZCcsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdsYW1iZGEnLCAnZ2V0UHJvZHVjdHNCeUlkJykpLFxuICAgICAgZnVuY3Rpb25OYW1lOiAnZ2V0UHJvZHVjdHNCeUlkJyxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgICBjb25zdCBjb21tb25FbnYgPSB7XG4gICAgICBQUk9EVUNUU19UQUJMRV9OQU1FOiBwcm9kdWN0c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIFNUT0NLX1RBQkxFX05BTUU6IHN0b2NrVGFibGUudGFibGVOYW1lLFxuICAgICAgQVdTX05PREVKU19DT05ORUNUSU9OX1JFVVNFX0VOQUJMRUQ6ICcxJyxcbiAgICB9O1xuXG4gICAgLy8gY3JlYXRlIGxhbWJkYVxuICAgICAgY29uc3QgY3JlYXRlUHJvZHVjdExhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ2NyZWF0ZVByb2R1Y3QnLCB7XG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbGFtYmRhJywgJ2NyZWF0ZVByb2R1Y3QnKSksXG4gICAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnYsXG4gICAgICAgIGZ1bmN0aW9uTmFtZTogJ2NyZWF0ZVByb2R1Y3QnXG4gICAgICB9KTtcbiAgICAgIHByb2R1Y3RzVGFibGUuZ3JhbnRXcml0ZURhdGEoY3JlYXRlUHJvZHVjdExhbWJkYSk7XG4gICAgICBzdG9ja1RhYmxlLmdyYW50V3JpdGVEYXRhKGNyZWF0ZVByb2R1Y3RMYW1iZGEpOyAgICAgIFxuICAgIFxuXG4gICAgZ2V0UHJvZHVjdHNMYW1iZGEuYWRkRW52aXJvbm1lbnQoJ1BST0RVQ1RTX1RBQkxFX05BTUUnLCBwcm9kdWN0c1RhYmxlLnRhYmxlTmFtZSk7XG4gICAgZ2V0UHJvZHVjdHNMYW1iZGEuYWRkRW52aXJvbm1lbnQoJ1NUT0NLX1RBQkxFX05BTUUnLCBzdG9ja1RhYmxlLnRhYmxlTmFtZSk7XG5cbiAgICBnZXRQcm9kdWN0c0J5SWRMYW1iZGEuYWRkRW52aXJvbm1lbnQoJ1BST0RVQ1RTX1RBQkxFX05BTUUnLCBwcm9kdWN0c1RhYmxlLnRhYmxlTmFtZSk7XG4gICAgZ2V0UHJvZHVjdHNCeUlkTGFtYmRhLmFkZEVudmlyb25tZW50KCdTVE9DS19UQUJMRV9OQU1FJywgc3RvY2tUYWJsZS50YWJsZU5hbWUpO1xuXG4gICAgLy8gR3JhbnQgcmVhZCBwZXJtaXNzaW9ucyB0byBMYW1iZGFzXG4gICAgcHJvZHVjdHNUYWJsZS5ncmFudFJlYWREYXRhKGdldFByb2R1Y3RzTGFtYmRhKTtcbiAgICBzdG9ja1RhYmxlLmdyYW50UmVhZERhdGEoZ2V0UHJvZHVjdHNMYW1iZGEpO1xuXG4gICAgcHJvZHVjdHNUYWJsZS5ncmFudFJlYWREYXRhKGdldFByb2R1Y3RzQnlJZExhbWJkYSk7XG4gICAgc3RvY2tUYWJsZS5ncmFudFJlYWREYXRhKGdldFByb2R1Y3RzQnlJZExhbWJkYSk7XG5cbiAgICBjcmVhdGVQcm9kdWN0TGFtYmRhLmFkZEVudmlyb25tZW50KCdQUk9EVUNUU19UQUJMRV9OQU1FJywgcHJvZHVjdHNUYWJsZS50YWJsZU5hbWUpO1xuICAgIGNyZWF0ZVByb2R1Y3RMYW1iZGEuYWRkRW52aXJvbm1lbnQoJ1NUT0NLX1RBQkxFX05BTUUnLCBzdG9ja1RhYmxlLnRhYmxlTmFtZSk7XG5cbiAgICBwcm9kdWN0c1RhYmxlLmdyYW50V3JpdGVEYXRhKGNyZWF0ZVByb2R1Y3RMYW1iZGEpO1xuICAgIHN0b2NrVGFibGUuZ3JhbnRXcml0ZURhdGEoY3JlYXRlUHJvZHVjdExhbWJkYSk7XG4gICAgXG5cbiAgICAvLyBBUEkgR2F0ZXdheSBSRVNUIEFQSVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1Byb2R1Y3RTZXJ2aWNlQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdQcm9kdWN0IFNlcnZpY2UnLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IFsnR0VUJywgJ1BPU1QnXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyAvcHJvZHVjdHMgcmVzb3VyY2VcbiAgICBjb25zdCBwcm9kdWN0cyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdwcm9kdWN0cycpO1xuICAgIGNvbnN0IGdldFByb2R1Y3RzSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRQcm9kdWN0c0xhbWJkYSwge1xuICAgICAgcHJveHk6IHRydWUsXG4gICAgfSk7XG4gICAgcHJvZHVjdHMuYWRkTWV0aG9kKCdHRVQnLCBnZXRQcm9kdWN0c0ludGVncmF0aW9uLCB7XG4gICAgICBtZXRob2RSZXNwb25zZXM6IFt7IHN0YXR1c0NvZGU6ICcyMDAnIH1dLFxuICAgIH0pO1xuXG4gICAgLy8gL3Byb2R1Y3RzL3twcm9kdWN0SWR9IHJlc291cmNlXG4gICAgY29uc3QgcHJvZHVjdElkUmVzb3VyY2UgPSBwcm9kdWN0cy5hZGRSZXNvdXJjZSgne3Byb2R1Y3RJZH0nKTtcbiAgICBjb25zdCBnZXRQcm9kdWN0QnlJZEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UHJvZHVjdHNCeUlkTGFtYmRhLCB7XG4gICAgICBwcm94eTogdHJ1ZSxcbiAgICB9KTtcbiAgICBwcm9kdWN0SWRSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIGdldFByb2R1Y3RCeUlkSW50ZWdyYXRpb24sIHtcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW3sgc3RhdHVzQ29kZTogJzIwMCcgfSwgeyBzdGF0dXNDb2RlOiAnNDA0JyB9LCB7IHN0YXR1c0NvZGU6ICc0MDAnIH1dLFxuICAgIH0pO1xuICAgIFxuICAgIHByb2R1Y3RzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZVByb2R1Y3RMYW1iZGEsIHsgcHJveHk6IHRydWUgfSksIHtcbiAgICAgIG1ldGhvZFJlc3BvbnNlczogW3sgc3RhdHVzQ29kZTogJzIwMScgfSwgeyBzdGF0dXNDb2RlOiAnNDAwJyB9XVxuICAgIH0pO1xuXG4gICAgLy8gRXhwb3J0IEFQSSBVUkwgZm9yIGVhc3kgYWNjZXNzXG4gICAgdGhpcy5wcm9kdWN0c0FwaVVybCA9IGFwaS51cmw7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Byb2R1Y3RzQXBpVXJsJywge1xuICAgICAgdmFsdWU6IGAke3RoaXMucHJvZHVjdHNBcGlVcmx9cHJvZHVjdHNgLFxuICAgICAgZGVzY3JpcHRpb246ICdHRVQgZW5kcG9pbnQgZm9yIHByb2R1Y3RzJyxcbiAgICB9KTtcbiAgfVxufVxuIl19