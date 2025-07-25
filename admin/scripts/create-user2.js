// user2@test.com 여성 유저 생성 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function createUser2() {
  try {
    const userId = 'c92c0d21-3176-4203-b0ff-77bcc453bb34';
    const email = 'user2@test.com';
    const password = '1q2w3e4r';
    
    console.log('🚀 user2@test.com (여성) 생성 시작...');
    
    // 1. Users 테이블에 유저 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Users',
      Item: {
        user_id: userId,
        email: email,
        password: password, // 비밀번호 설정
        status: 'green',
        has_score: true,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Users 테이블 생성 완료');

    // 2. Profiles 테이블에 프로필 생성 (여성)
    await dynamodb.send(new PutCommand({
      TableName: 'Profiles',
      Item: {
        user_id: userId,
        email: email,
        name: '테스트유저2',
        age: 26,
        gender: '여',
        height: '165',
        region: { region: '서울', district: '서초구' },
        job: '의사',
        education: '대학원',
        religion: '무교',
        mbti: 'INFJ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Profiles 테이블 생성 완료');

    // 3. Preferences 테이블에 선호도 생성 (남성 선호)
    await dynamodb.send(new PutCommand({
      TableName: 'Preferences',
      Item: {
        user_id: userId,
        email: email,
        preferred_gender: '남',
        age_range: { min: 25, max: 35 },
        height_range: { min: 170, max: 185 },
        regions: [
          { region: '서울', district: '강남구' },
          { region: '서울', district: '서초구' },
          { region: '경기', district: '성남시' }
        ],
        religion: '무교',
        job_types: ['회사원', '의료진', '공무원'],
        education_levels: ['대학교', '대학원', '석사'],
        mbti_types: ['ENFP', 'ENTJ', 'INTJ'],
        body_types: ['평균', '슬림'],
        priority: '성격,외모,직업,학력,가치관,취미,경제력,거주지',
        marriage_plan: '1-2년 내',
        children_desire: '자녀 희망',
        smoking: '비흡연',
        drinking: '음주',
        interests: ['여행', '음악', '독서'],
        locations: ['강남구', '서초구', '성남시'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Preferences 테이블 생성 완료');

    // 4. Scores 테이블에 점수 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Scores',
      Item: {
        user_id: userId,
        appearance: 88,
        personality: 92,
        job: 95,
        education: 90,
        economics: 85,
        average: 90,
        grade: 'S',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Scores 테이블 생성 완료');

    console.log('🎉 user2@test.com 생성 완료!');
    console.log('📧 이메일:', email);
    console.log('🆔 User ID:', userId);
    console.log('🔐 비밀번호:', password);
    console.log('👤 성별: 여성');
    console.log('🎯 선호 성별: 남성');
    console.log('📊 평균 점수: 90점 (S등급)');
    console.log('💼 직업: 의사');
    console.log('🎓 학력: 대학원');
    
  } catch (error) {
    console.error('❌ user2@test.com 생성 실패:', error);
  }
}

createUser2().catch(console.error); 