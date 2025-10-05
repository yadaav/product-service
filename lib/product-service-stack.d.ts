import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare class ProductServiceStack extends cdk.Stack {
    readonly productsApiUrl: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
