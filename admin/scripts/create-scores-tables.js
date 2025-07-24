// Scores, ScoreHistory 테이블 생성 스크립트
require('dotenv').config();
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });
const dynamodb = new AWS.DynamoDB();

async function createTable(params) {
  try {
    await dynamodb.createTable(params).promise();
    console.log(`Created table: ${params.TableName}`);
  } catch (e) {
    if (e.code === 'ResourceInUseException') {
      console.log(`Table already exists: ${params.TableName}`);
    } else {
      throw e;
    }
  }
}

const scoresParams = {
  TableName: 'Scores',
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },
    { AttributeName: 'created_at', KeyType: 'RANGE' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

const scoreHistoryParams = {
  TableName: 'ScoreHistory',
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' },
  ],
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },
    { AttributeName: 'created_at', KeyType: 'RANGE' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

(async () => {
  await createTable(scoresParams);
  await createTable(scoreHistoryParams);
  console.log('테이블 생성 완료!');
})(); 