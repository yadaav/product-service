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
class ProductServiceStack extends cdk.Stack {
    productsApiUrl;
    constructor(scope, id, props) {
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
exports.ProductServiceStack = ProductServiceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC1zZXJ2aWNlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvZHVjdC1zZXJ2aWNlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLCtEQUFpRDtBQUNqRCx1RUFBeUQ7QUFDekQsMkNBQTZCO0FBRTdCLE1BQWEsbUJBQW9CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDaEMsY0FBYyxDQUFTO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsU0FBUztRQUNULE1BQU0saUJBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNyRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDcEYsWUFBWSxFQUFFLGlCQUFpQjtTQUNoQyxDQUFDLENBQUM7UUFFSCx1QkFBdUI7UUFDdkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUM1RCxXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLDJCQUEyQixFQUFFO2dCQUMzQixZQUFZLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXO2dCQUN6QyxZQUFZLEVBQUUsQ0FBQyxLQUFLLENBQUM7YUFDdEI7U0FDRixDQUFDLENBQUM7UUFFSCxxQkFBcUI7UUFDckIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEQsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRTtZQUNqRixLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLHNCQUFzQixFQUFFO1lBQ2hELGVBQWUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1NBQ3pDLENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyx1REFBdUQ7UUFDdEYsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxVQUFVO1lBQ3ZDLFdBQVcsRUFBRSwyQkFBMkI7U0FDekMsQ0FBQyxDQUFDO1FBRUgsdUNBQXVDO1FBQzNDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN6RSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDcEYsWUFBWSxFQUFFLGlCQUFpQjtTQUNoQyxDQUFDLENBQUM7UUFFSCw4Q0FBOEM7UUFDOUMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTlELE1BQU0seUJBQXlCLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLEVBQUU7WUFDeEYsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFDLENBQUM7UUFFSCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLHlCQUF5QixFQUFFO1lBQzVELGVBQWUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDO1NBQ3ZGLENBQUMsQ0FBQztJQUNELENBQUM7Q0FDRjtBQTFERCxrREEwREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBQcm9kdWN0U2VydmljZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHByb2R1Y3RzQXBpVXJsOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gTGFtYmRhXG4gICAgY29uc3QgZ2V0UHJvZHVjdHNMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdnZXRQcm9kdWN0c0xpc3QnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnbGFtYmRhJywgJ2dldFByb2R1Y3RzTGlzdCcpKSxcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2dldFByb2R1Y3RzTGlzdCdcbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IFJFU1QgQVBJXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnUHJvZHVjdFNlcnZpY2VBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ1Byb2R1Y3QgU2VydmljZScsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogWydHRVQnXVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gL3Byb2R1Y3RzIHJlc291cmNlXG4gICAgY29uc3QgcHJvZHVjdHMgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgncHJvZHVjdHMnKTtcbiAgICBjb25zdCBnZXRQcm9kdWN0c0ludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UHJvZHVjdHNMYW1iZGEsIHtcbiAgICAgIHByb3h5OiB0cnVlXG4gICAgfSk7XG4gICAgcHJvZHVjdHMuYWRkTWV0aG9kKCdHRVQnLCBnZXRQcm9kdWN0c0ludGVncmF0aW9uLCB7XG4gICAgICBtZXRob2RSZXNwb25zZXM6IFt7IHN0YXR1c0NvZGU6ICcyMDAnIH1dXG4gICAgfSk7XG5cbiAgICAvLyBFeHBvcnQgQVBJIFVSTCBmb3IgZWFzeSBhY2Nlc3NcbiAgICB0aGlzLnByb2R1Y3RzQXBpVXJsID0gYXBpLnVybDsgLy8gZS5nLiwgaHR0cHM6Ly94eHh4LmV4ZWN1dGUtYXBpLnJlZ2lvbi5hbWF6b25hd3MuY29tL1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQcm9kdWN0c0FwaVVybCcsIHtcbiAgICAgIHZhbHVlOiBgJHt0aGlzLnByb2R1Y3RzQXBpVXJsfXByb2R1Y3RzYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR0VUIGVuZHBvaW50IGZvciBwcm9kdWN0cydcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBmb3IgR0VUIC9wcm9kdWN0cy97cHJvZHVjdElkfVxuY29uc3QgZ2V0UHJvZHVjdHNCeUlkTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnZ2V0UHJvZHVjdHNCeUlkJywge1xuICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2xhbWJkYScsICdnZXRQcm9kdWN0c0J5SWQnKSksXG4gIGZ1bmN0aW9uTmFtZTogJ2dldFByb2R1Y3RzQnlJZCdcbn0pO1xuXG4vLyBBZGQgcGF0aCBwYXJhbWV0ZXIgcmVzb3VyY2UgdW5kZXIgL3Byb2R1Y3RzXG5jb25zdCBwcm9kdWN0SWRSZXNvdXJjZSA9IHByb2R1Y3RzLmFkZFJlc291cmNlKCd7cHJvZHVjdElkfScpO1xuXG5jb25zdCBnZXRQcm9kdWN0QnlJZEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZ2V0UHJvZHVjdHNCeUlkTGFtYmRhLCB7XG4gIHByb3h5OiB0cnVlXG59KTtcblxucHJvZHVjdElkUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBnZXRQcm9kdWN0QnlJZEludGVncmF0aW9uLCB7XG4gIG1ldGhvZFJlc3BvbnNlczogW3sgc3RhdHVzQ29kZTogJzIwMCcgfSwgeyBzdGF0dXNDb2RlOiAnNDA0JyB9LCB7IHN0YXR1c0NvZGU6ICc0MDAnIH1dXG59KTtcbiAgfVxufVxuIl19