const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const ddbDocClient = require('./utils/dynamoClient');

// Cognito 설정
const USER_POOL_ID = 'ap-northeast-2_B00TBxxGS';
const CLIENT_ID = '4agpf837q7oajaj3t6ghqv4a5m';
const REGION = 'ap-northeast-2';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

async function createTestUser(email, password, name) {
  try {
    console.log(`\n🔧 ${email} 사용자 생성 중...`);
    
    // 1. Cognito에 사용자 생성 (이메일 인증 없이)
    const createUserParams = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true' // 이메일 인증 완료로 설정
        },
        {
          Name: 'name',
          Value: name
        }
      ],
      MessageAction: 'SUPPRESS' // 이메일 발송 안함
    };

    const createCommand = new AdminCreateUserCommand(createUserParams);
    const createResult = await cognitoClient.send(createCommand);
    
    console.log(`✅ Cognito 사용자 생성 완료: ${createResult.User.Username}`);
    
    // 2. 비밀번호 설정 (영구 비밀번호로 설정)
    const setPasswordParams = {
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true // 영구 비밀번호로 설정
    };

    const setPasswordCommand = new AdminSetUserPasswordCommand(setPasswordParams);
    await cognitoClient.send(setPasswordCommand);
    
    console.log(`✅ 비밀번호 설정 완료`);
    
    // 3. DynamoDB에 사용자 정보 저장
    const userId = createResult.User.Username; // Cognito의 Username 사용
    const userData = {
      user_id: userId,
      email: email,
      is_verified: true,
      has_profile: false,
      has_preferences: false,
      grade: 'general',
      status: 'green',
      is_deleted: false,
      points: 100, // 회원가입 보너스
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await ddbDocClient.send(new PutCommand({
      TableName: 'Users',
      Item: userData
    }));
    
    console.log(`✅ DynamoDB 사용자 정보 저장 완료`);
    
    return {
      success: true,
      userId: userId,
      message: `${email} 사용자 생성 완료`
    };
    
  } catch (error) {
    console.error(`❌ ${email} 사용자 생성 실패:`, error);
    
    if (error.name === 'UsernameExistsException') {
      console.log(`⚠️  ${email} 사용자가 이미 존재합니다.`);
      return {
        success: false,
        message: `${email} 사용자가 이미 존재합니다.`
      };
    }
    
    return {
      success: false,
      message: `${email} 사용자 생성 중 오류 발생: ${error.message}`
    };
  }
}

async function main() {
  console.log('🚀 테스트용 사용자 생성 시작...\n');
  
  const testUsers = [
    {
      email: 'user1@test.com',
      password: '1q2w3e4r',
      name: '테스트사용자1'
    },
    {
      email: 'user2@test.com',
      password: '1q2w3e4r',
      name: '테스트사용자2'
    }
  ];
  
  for (const user of testUsers) {
    const result = await createTestUser(user.email, user.password, user.name);
    if (result.success) {
      console.log(`🎉 ${user.email} 생성 성공!`);
      console.log(`   - 사용자 ID: ${result.userId}`);
      console.log(`   - 비밀번호: ${user.password}`);
    } else {
      console.log(`💥 ${user.email} 생성 실패: ${result.message}`);
    }
  }
  
  console.log('\n📋 생성된 테스트 사용자 정보:');
  console.log('user1@test.com / 1q2w3e4r');
  console.log('user2@test.com / 1q2w3e4r');
  console.log('\n✨ 이제 앱에서 이 계정으로 로그인할 수 있습니다!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestUser }; 