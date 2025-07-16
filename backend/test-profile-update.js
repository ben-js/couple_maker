const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function testProfileUpdate() {
  try {
    const userId = 'test-user-2';
    
    // 1. Users 테이블에 사용자 생성 (has_profile: false로 시작)
    await docClient.send(new PutCommand({
      TableName: 'Users',
      Item: {
        user_id: userId,
        email: 'test2@example.com',
        password: 'hashedpassword',
        is_verified: true,
        has_profile: false,
        has_preferences: false,
        grade: 'general',
        status: 'green',
        points: 100,
        created_at: new Date().toISOString()
      }
    }));

    console.log('Users 테이블에 테스트 사용자 생성 완료');

    // 2. Profiles 테이블에 프로필 저장
    const profileData = {
      user_id: userId,
      name: '테스트 사용자 2',
      birth_date: {
        year: 1995,
        month: 6,
        day: 15
      },
      gender: '여',
      height: '165',
      body_type: '평균',
      job: '회사원',
      education: '대학교',
      region: {
        region: '서울',
        district: '서초구'
      },
      mbti: 'ENFP',
      interests: ['여행', '음악', '독서'],
      favorite_foods: ['한식', '양식'],
      smoking: '비흡연',
      drinking: '음주',
      religion: '무교',
      children_desire: '자녀 희망',
      marriage_plans: '1-2년 내',
      salary: '5천만원 ~ 7천만원',
      asset: '1억원 ~ 2억원',
      introduction: '안녕하세요! 테스트 사용자 2입니다.',
      photos: []
    };

    await docClient.send(new PutCommand({
      TableName: 'Profiles',
      Item: profileData
    }));

    console.log('Profiles 테이블에 프로필 저장 완료');

    // 3. Users 테이블의 has_profile을 true로 업데이트
    await docClient.send(new UpdateCommand({
      TableName: 'Users',
      Key: { user_id: userId },
      UpdateExpression: 'set has_profile = :val',
      ExpressionAttributeValues: { ':val': true }
    }));

    console.log('Users 테이블 has_profile 업데이트 완료');

    // 4. 결과 확인
    const userResult = await docClient.send(new GetCommand({
      TableName: 'Users',
      Key: { user_id: userId }
    }));

    const profileResult = await docClient.send(new GetCommand({
      TableName: 'Profiles',
      Key: { user_id: userId }
    }));

    console.log('\n=== 결과 확인 ===');
    console.log('Users 데이터:', JSON.stringify(userResult.Item, null, 2));
    console.log('\nProfiles 데이터:', JSON.stringify(profileResult.Item, null, 2));

  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

testProfileUpdate(); 