/**
 * AWS 공통 설정
 * @module config/aws
 * @description Admin에서 모든 AWS 서비스에서 공통으로 사용하는 설정
 */

import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

const AWS_CONFIG: DynamoDBClientConfig = {
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: 'AKIAU2GJ5ZJPVVVU5C4W',
    secretAccessKey: '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',
  },
};

export default AWS_CONFIG; 