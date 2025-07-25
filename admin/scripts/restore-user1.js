// user1@test.com 유저 복구 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function restoreUser1() {
  try {
    const userId = '1bc37de4-ead1-4881-b8d3-2f6ac9637d63';
    const email = 'user1@test.com';
    
    console.log('🔄 user1@test.com 복구 시작...');
    
    // 1. Users 테이블에 유저 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Users',
      Item: {
        user_id: userId,
        email: email,
        status: 'green',
        has_score: true,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Users 테이블 복구 완료');

    // 2. Profiles 테이블에 프로필 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Profiles',
      Item: {
        user_id: userId,
        email: email,
        name: '테스트유저1',
        age: 28,
        gender: '남',
        height: '175',
        region: { region: '서울', district: '강남구' },
        job: '회사원',
        education: '대졸',
        religion: '무교',
        mbti: 'ENFP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Profiles 테이블 복구 완료');

    // 3. Preferences 테이블에 선호도 생성 (기존 데이터 복원)
    await dynamodb.send(new PutCommand({
      TableName: 'Preferences',
      Item: {
        user_id: userId,
        email: email,
        preferred_gender: '여',
        age_range: { min: 20, max: 30 },
        height_range: { min: 160, max: 175 },
        regions: [
          { region: '서울', district: '강남구' },
          { region: '경기', district: '성남시' }
        ],
        religion: '무교',
        job_types: ['회사원', '의료진'],
        education_levels: ['대학교', '대학원'],
        mbti_types: ['ENFP', 'INFJ'],
        body_types: ['평균', '슬림'],
        priority: '성격,외모,직업,학력,가치관,취미,경제력,거주지',
        marriage_plan: '1-2년 내',
        children_desire: '자녀 희망',
        smoking: '비흡연',
        drinking: '음주',
        interests: ['여행', '음악'],
        locations: ['강남구', '성남시'],
        created_at: '2025-07-23T12:11:03.076Z',
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Preferences 테이블 복구 완료');

    // 4. Scores 테이블에 점수 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Scores',
      Item: {
        user_id: userId,
        appearance: 85,
        personality: 90,
        job: 80,
        education: 85,
        economics: 88,
        average: 86,
        grade: 'A',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    console.log('✅ Scores 테이블 복구 완료');

    console.log('🎉 user1@test.com 복구 완료!');
    console.log('📧 이메일:', email);
    console.log('🆔 User ID:', userId);
    console.log('👤 성별: 남성');
    console.log('🎯 선호 성별: 여성');
    console.log('📊 평균 점수: 86점 (A등급)');
    
  } catch (error) {
    console.error('❌ user1@test.com 복구 실패:', error);
  }
}

restoreUser1().catch(console.error); 