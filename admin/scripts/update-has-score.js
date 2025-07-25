// Users 테이블의 has_score를 true로 일괄 업데이트하는 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function main() {
  for (let i = 1; i <= 30; i++) {
    const user_id = `user_${i}`;
    await dynamodb.send(new UpdateCommand({
      TableName: 'Users',
      Key: { user_id },
      UpdateExpression: 'SET has_score = :val',
      ExpressionAttributeValues: { ':val': true }
    })).catch(e => console.error('Update 에러:', user_id, e));
    console.log(`Updated has_score for: ${user_id}`);
  }
  console.log('✅ has_score 업데이트 완료!');
}

main().catch(console.error); 