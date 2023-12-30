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
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EmailIdentity, Identity } from 'aws-cdk-lib/aws-ses';
import { ApiKey, ApiKeySourceType, Cors, LambdaIntegration, RestApi, UsagePlan } from 'aws-cdk-lib/aws-apigateway';
import { ReCaptchaAuthorizer } from 'cdk-lambda-recaptcha-authorizer';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';
const WEB_APP_DOMAIN = "polarops.ca"

export interface PolaropsStackProps extends cdk.StackProps {
  acmCert: acm.Certificate;
}

export class PolaropsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PolaropsStackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: "polarops.ca",
    });

    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `polarops.ca-website`,
      publicReadAccess: false, // no public access, user must access via cloudfront
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.GET],
          allowedOrigins: ["*"],
          exposedHeaders: [],
        },
      ],
    });

    const identity = new cloudfront.OriginAccessIdentity(this, "id");

    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [websiteBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            identity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const siteDistribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "cloudfront",
      {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
              originAccessIdentity: identity,
            },
            behaviors: [
              {
                viewerProtocolPolicy:
                  cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
                compress: true,
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        viewerCertificate: {
          aliases: ["polarops.ca", "www.polarops.ca", "polaropsconsulting.com", "www.polaropsconsulting.com", "polaropsconsulting.ca", "www.polaropsconsulting.ca"],
          props: {
            acmCertificateArn: props.acmCert.certificateArn,
            sslSupportMethod: "sni-only",
          },
        },
        defaultRootObject: "index.html",
        errorConfigurations: [
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    //Deploy site to s3
    new deploy.BucketDeployment(this, "Deployment", {
      sources: [deploy.Source.asset("./resources/build")],
      destinationBucket: websiteBucket,
      distribution: siteDistribution,
      distributionPaths: ["/*"]

    });

    new CfnOutput(this, "CloudFrontURL", {
      value: siteDistribution.distributionDomainName,
      description: "The distribution URL",
      exportName: "CloudfrontURL",
    });

    new CfnOutput(this, "BucketName", {
      value: websiteBucket.bucketName,
      description: "The name of the S3 bucket",
      exportName: "BucketName",
    });

    


  }

}
