import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ProductServiceStack extends cdk.Stack {
  public readonly productsApiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
