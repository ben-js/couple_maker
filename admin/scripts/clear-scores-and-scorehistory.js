// Scores, ScoreHistory 테이블 전체 데이터 삭제 스크립트
require('dotenv').config();
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function deleteAllFromTable(tableName) {
  const scanParams = { TableName: tableName };
  const data = await dynamodb.scan(scanParams).promise();
  for (const item of data.Items) {
    const key = {};
    // 복합키 지원 (user_id + created_at)
    if (item.user_id && item.created_at) {
      key.user_id = item.user_id;
      key.created_at = item.created_at;
    } else if (item.user_id) {
      key.user_id = item.user_id;
    }
    await dynamodb.delete({ TableName: tableName, Key: key }).promise();
    console.log(`Deleted from ${tableName}:`, key);
  }
  console.log(`All items deleted from ${tableName}`);
}

(async () => {
  await deleteAllFromTable('Scores');
  await deleteAllFromTable('ScoreHistory');
  console.log('All done!');
})(); 