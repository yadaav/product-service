import * as cdk from 'aws-cdk-lib';
import * as iam from "aws-cdk-lib/aws-iam";

import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

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
    catalogBatchProcess.addEventSource(
      new eventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );

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

    const importFileParser = lambda.Function.fromFunctionAttributes(this, "ImportFileParserFunction", {
      functionArn: "arn:aws:lambda:us-east-1:837282923698:function:importFileParser",
      role: iam.Role.fromRoleArn(
        this,
        "ImportFileParserRole",
        "arn:aws:iam::837282923698:role/importFileParserRole",
        { mutable: false }
      )
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
