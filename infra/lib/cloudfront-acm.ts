import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as deploy from 'aws-cdk-lib/aws-s3-deployment';

import { Construct } from 'constructs';
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { RemovalPolicy } from 'aws-cdk-lib';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
export class CloudfrontAcmStack extends cdk.Stack {
    public readonly acmCert: acm.Certificate;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.acmCert = new acm.Certificate(this, "Certificate", {
        domainName: "*.polarops.ca",
        validation: acm.CertificateValidation.fromDns(),
        subjectAlternativeNames: [ "*.polaropsconsulting.ca", "*.polaropsconsulting.com","polarops.ca", "polaropsconsulting.ca", "polaropsconsulting.com"],
      });

  }
}
