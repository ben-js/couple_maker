// 기존 테스트 유저들을 삭제하는 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function deleteTestUsers() {
  try {
    // 1. Users 테이블에서 테스트 유저들 삭제
    console.log('🔍 Users 테이블에서 테스트 유저들 검색 중...');
    const usersResult = await dynamodb.send(new ScanCommand({
      TableName: 'Users',
      FilterExpression: 'contains(email, :email)',
      ExpressionAttributeValues: { ':email': 'test.com' }
    }));

    console.log(`📧 테스트 이메일 유저 ${usersResult.Items.length}명 발견`);
    
    for (const user of usersResult.Items) {
      console.log(`🗑️ Users 테이블에서 삭제: ${user.email} (${user.user_id})`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Users',
        Key: { user_id: user.user_id }
      }));
    }

    // 2. Profiles 테이블에서 테스트 유저들 삭제
    console.log('🔍 Profiles 테이블에서 테스트 유저들 검색 중...');
    const profilesResult = await dynamodb.send(new ScanCommand({
      TableName: 'Profiles',
      FilterExpression: 'contains(email, :email)',
      ExpressionAttributeValues: { ':email': 'test.com' }
    }));

    console.log(`📧 테스트 이메일 프로필 ${profilesResult.Items.length}명 발견`);
    
    for (const profile of profilesResult.Items) {
      console.log(`🗑️ Profiles 테이블에서 삭제: ${profile.email} (${profile.user_id})`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Profiles',
        Key: { user_id: profile.user_id }
      }));
    }

    // 3. Preferences 테이블에서 테스트 유저들 삭제
    console.log('🔍 Preferences 테이블에서 테스트 유저들 검색 중...');
    const preferencesResult = await dynamodb.send(new ScanCommand({
      TableName: 'Preferences',
      FilterExpression: 'contains(email, :email)',
      ExpressionAttributeValues: { ':email': 'test.com' }
    }));

    console.log(`📧 테스트 이메일 선호도 ${preferencesResult.Items.length}명 발견`);
    
    for (const preference of preferencesResult.Items) {
      console.log(`🗑️ Preferences 테이블에서 삭제: ${preference.email} (${preference.user_id})`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Preferences',
        Key: { user_id: preference.user_id }
      }));
    }

    // 4. Scores 테이블에서 테스트 유저들 삭제
    console.log('🔍 Scores 테이블에서 테스트 유저들 검색 중...');
    const scoresResult = await dynamodb.send(new ScanCommand({
      TableName: 'Scores',
      FilterExpression: 'contains(user_id, :user_id)',
      ExpressionAttributeValues: { ':user_id': 'user_' }
    }));

    console.log(`📊 테스트 유저 점수 ${scoresResult.Items.length}명 발견`);
    
    for (const score of scoresResult.Items) {
      console.log(`🗑️ Scores 테이블에서 삭제: ${score.user_id}`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Scores',
        Key: { user_id: score.user_id }
      }));
    }

    console.log('✅ 테스트 유저들 삭제 완료!');
  } catch (error) {
    console.error('❌ 삭제 중 에러 발생:', error);
  }
}

deleteTestUsers().catch(console.error); 