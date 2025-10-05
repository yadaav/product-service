import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  public readonly productsApiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda
    const getProductsLambda = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getProductsList')),
      functionName: 'getProductsList'
    });

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET']
      }
    });

    // /products resource
    const products = api.root.addResource('products');
    const getProductsIntegration = new apigateway.LambdaIntegration(getProductsLambda, {
      proxy: true
    });
    products.addMethod('GET', getProductsIntegration, {
      methodResponses: [{ statusCode: '200' }]
    });

    // Export API URL for easy access
    this.productsApiUrl = api.url; // e.g., https://xxxx.execute-api.region.amazonaws.com/
    new cdk.CfnOutput(this, 'ProductsApiUrl', {
      value: `${this.productsApiUrl}products`,
      description: 'GET endpoint for products'
    });

    // Lambda for GET /products/{productId}
const getProductsByIdLambda = new lambda.Function(this, 'getProductsById', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getProductsById')),
  functionName: 'getProductsById'
});

// Add path parameter resource under /products
const productIdResource = products.addResource('{productId}');

const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductsByIdLambda, {
  proxy: true
});

productIdResource.addMethod('GET', getProductByIdIntegration, {
  methodResponses: [{ statusCode: '200' }, { statusCode: '404' }, { statusCode: '400' }]
});
  }
}
