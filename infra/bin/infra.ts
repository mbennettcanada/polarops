#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PolaropsStack } from '../lib/polarops-stack';
import { CloudfrontAcmStack } from '../lib/cloudfront-acm';



const app = new cdk.App();
const cloudfrontAcm = new CloudfrontAcmStack(app, 'CloudfrontAcmStack', {
  env: {
    account: "906948391283",
    region: 'us-east-1',
  },
  crossRegionReferences: true
})
new PolaropsStack(app, 'PolaropsStack', {
  acmCert: cloudfrontAcm.acmCert,
  env: {
    account: "906948391283",
	region: 'us-east-2',
  },
  crossRegionReferences:true
});
