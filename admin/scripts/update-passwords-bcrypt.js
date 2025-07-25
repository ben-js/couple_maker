// 모든 유저의 비밀번호를 bcrypt 해시로 업데이트하는 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function updateAllPasswordsBcrypt() {
  try {
    const plainPassword = '1q2w3e4r';
    const hash = await bcrypt.hash(plainPassword, 10);
    
    console.log('🔐 모든 유저의 비밀번호를 bcrypt 해시로 업데이트 시작...');
    
    // 1. Users 테이블에서 모든 유저 조회
    const usersResult = await dynamodb.send(new ScanCommand({
      TableName: 'Users'
    }));

    console.log(`📊 총 ${usersResult.Items.length}명의 유저 발견`);
    
    // 2. 각 유저의 비밀번호 업데이트
    for (const user of usersResult.Items) {
      try {
        await dynamodb.send(new UpdateCommand({
          TableName: 'Users',
          Key: { user_id: user.user_id },
          UpdateExpression: 'SET password = :password, updated_at = :updated_at',
          ExpressionAttributeValues: {
            ':password': hash,
            ':updated_at': new Date().toISOString()
          }
        }));
        
        console.log(`✅ ${user.email} 비밀번호(bcrypt) 업데이트 완료`);
      } catch (error) {
        console.error(`❌ ${user.email} 비밀번호(bcrypt) 업데이트 실패:`, error);
      }
    }

    console.log('🎉 모든 유저의 비밀번호(bcrypt) 업데이트 완료!');
    console.log('🔐 bcrypt 해시:', hash);
    console.log(`📊 업데이트된 유저 수: ${usersResult.Items.length}명`);
    
  } catch (error) {
    console.error('❌ 비밀번호(bcrypt) 업데이트 실패:', error);
  }
}

updateAllPasswordsBcrypt().catch(console.error); 