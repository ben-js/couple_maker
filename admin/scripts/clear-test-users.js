// 테스트용 유저 데이터 삭제 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function main() {
  for (let i = 3; i <= 42; i++) {
    const user_id = `user_${i}`;
    await dynamodb.send(new DeleteCommand({ TableName: 'Users', Key: { user_id } }));
    await dynamodb.send(new DeleteCommand({ TableName: 'Profiles', Key: { user_id } }));
    await dynamodb.send(new DeleteCommand({ TableName: 'Preferences', Key: { user_id } }));
    // Scores: user_id로 Scan 후 created_at별로 삭제
    const scoreScan = await dynamodb.send(new ScanCommand({ TableName: 'Scores', FilterExpression: 'user_id = :uid', ExpressionAttributeValues: { ':uid': user_id } }));
    if (scoreScan.Items) {
      for (const item of scoreScan.Items) {
        await dynamodb.send(new DeleteCommand({ TableName: 'Scores', Key: { user_id, created_at: item.created_at } }));
      }
    }
    console.log(`Deleted user: user${i}@test.com`);
  }
  console.log('✅ 테스트 유저 40명 삭제 완료!');
}

main().catch(console.error); 