// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface CdkImageTestingProps {
  // Define construct properties here
}

export class CdkImageTesting extends Construct {

  constructor(scope: Construct, id: string, props: CdkImageTestingProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkImageTestingQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
