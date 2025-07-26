const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB 클라이언트 설정
const ddbClient = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// 삭제할 테스트 사용자 ID 목록
const testUserIds = ['user_001', 'user_002'];

async function deleteTestUser(userId) {
  try {
    console.log(`🗑️  ${userId} 사용자 삭제 중...`);
    
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: 'Users',
        Key: { user_id: userId }
      })
    );
    
    console.log(`✅ ${userId} 사용자 삭제 완료`);
    return true;
  } catch (error) {
    console.error(`❌ ${userId} 사용자 삭제 실패:`, error.message);
    return false;
  }
}

async function deleteAllTestUsers() {
  console.log('🚀 테스트 사용자 삭제 시작...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const userId of testUserIds) {
    const success = await deleteTestUser(userId);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // 빈 줄 추가
  }
  
  console.log('📊 삭제 결과:');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${failCount}명`);
  
  if (successCount > 0) {
    console.log('\n🎉 테스트 사용자 삭제 완료!');
    console.log('\n📋 삭제된 사용자:');
    testUserIds.forEach(userId => {
      console.log(`- ${userId}`);
    });
  } else {
    console.log('\n❌ 모든 사용자 삭제 실패');
  }
}

// 스크립트 실행
deleteAllTestUsers().catch(console.error); 