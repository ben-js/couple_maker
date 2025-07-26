const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({
  region: 'ap-northeast-2'  // 서울 리전
});

const dynamodb = DynamoDBDocumentClient.from(client);

async function createUsersCorrectRegion() {
  console.log('🚀 올바른 리전(ap-northeast-2)으로 테스트 사용자 생성 시작...');
  
  const users = [
    {
      email: 'user1@test.com',
      password: '1q2w3e4r',
      points: 100,
      status: 'green',
      has_profile: false,
      has_preferences: false
    },
    {
      email: 'user2@test.com', 
      password: '1q2w3e4r',
      points: 50,
      status: 'green',
      has_profile: false,
      has_preferences: false
    }
  ];

  for (const userData of users) {
    try {
      console.log(`\n👤 ${userData.email} 사용자 생성 중...`);
      
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // 사용자 생성
      const userParams = {
        TableName: 'Users',
        Item: {
          user_id: userId,
          email: userData.email,
          password: hashedPassword,
          points: userData.points,
          status: userData.status,
          has_profile: userData.has_profile,
          has_preferences: userData.has_preferences,
          is_verified: true,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      await dynamodb.send(new PutCommand(userParams));

      console.log(`✅ ${userData.email} 사용자 생성 완료`);
      console.log(`   user_id: ${userId}`);
      console.log(`   password: ${userData.password} (해시화됨)`);
      console.log(`   status: ${userData.status}`);
      console.log(`   region: ap-northeast-2 (서울)`);
      
    } catch (error) {
      console.error(`❌ ${userData.email} 사용자 생성 실패:`, error.message);
    }
  }

  // 생성된 사용자 확인
  try {
    const response = await dynamodb.send(new ScanCommand({ TableName: 'Users' }));
    console.log(`\n📊 생성된 사용자 수: ${response.Items?.length || 0}명`);
    if (response.Items?.length > 0) {
      response.Items.forEach(user => console.log(`- ${user.email} | ${user.user_id} | ${user.status} | ${user.points} points`));
    }
  } catch (error) {
    console.error('사용자 확인 실패:', error.message);
  }

  console.log('\n🎉 테스트 사용자 생성 완료!');
}

createUsersCorrectRegion(); 