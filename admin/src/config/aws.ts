import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

const AWS_CONFIG: DynamoDBClientConfig = {
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

export default AWS_CONFIG; 