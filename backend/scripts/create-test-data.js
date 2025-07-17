const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// DynamoDB 클라이언트 설정
const ddbClient = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// 비밀번호 해시화 함수
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 테스트 사용자 데이터 (UUID 사용)
const testUsers = [
  {
    user_id: uuidv4(),
    email: 'user1@test.com',
    password: '1q2w3e4r', // 원본 비밀번호 (해시화됨)
    is_verified: true,
    has_profile: false,
    has_preferences: false,
    grade: 'general',
    status: 'green',
    is_deleted: false,
    deleted_at: null,
    delete_reason: null,
    points: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    user_id: uuidv4(),
    email: 'user2@test.com',
    password: '1q2w3e4r', // 원본 비밀번호 (해시화됨)
    is_verified: true,
    has_profile: false,
    has_preferences: false,
    grade: 'general',
    status: 'green',
    is_deleted: false,
    deleted_at: null,
    delete_reason: null,
    points: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function createTestUser(userData) {
  try {
    console.log(`👤 ${userData.email} 사용자 생성 중...`);
    
    // 비밀번호 해시화
    const hashedPassword = await hashPassword(userData.password);
    const userDataWithHashedPassword = {
      ...userData,
      password: hashedPassword
    };
    
    await ddbDocClient.send(
      new PutCommand({
        TableName: 'Users',
        Item: userDataWithHashedPassword
      })
    );
    
    console.log(`✅ ${userData.email} 사용자 생성 완료`);
    console.log(`   user_id: ${userData.user_id}`);
    console.log(`   points: ${userData.points}`);
    console.log(`   status: ${userData.status}`);
    console.log(`   password: ${userData.password} (해시화됨)`);
    return true;
  } catch (error) {
    console.error(`❌ ${userData.email} 사용자 생성 실패:`, error.message);
    return false;
  }
}

async function createAllTestUsers() {
  console.log('🚀 테스트 사용자 생성 시작...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const userData of testUsers) {
    const success = await createTestUser(userData);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log(''); // 빈 줄 추가
  }
  
  console.log('📊 생성 결과:');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${failCount}명`);
  
  if (successCount > 0) {
    console.log('\n🎉 테스트 사용자 생성 완료!');
    console.log('\n📋 생성된 사용자 정보:');
    testUsers.forEach(user => {
      console.log(`- ${user.email}`);
      console.log(`  user_id: ${user.user_id}`);
      console.log(`  points: ${user.points}`);
      console.log(`  status: ${user.status}`);
      console.log('');
    });
    console.log('🔑 로그인 정보:');
    console.log('- 이메일: user1@test.com / user2@test.com');
    console.log('- 비밀번호: 1q2w3e4r');
    console.log('\n💡 참고: user_id는 UUID로 생성되어 매번 다릅니다.');
  } else {
    console.log('\n❌ 모든 사용자 생성 실패');
  }
}

// 스크립트 실행
createAllTestUsers().catch(console.error); 