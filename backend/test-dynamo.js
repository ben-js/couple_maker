const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function createTestData() {
  try {
    // Profiles 테이블에 테스트 데이터 추가
    const profileData = {
      user_id: 'test-user-1',
      name: '테스트 사용자',
      birth_date: {
        year: 1990,
        month: 1,
        day: 1
      },
      gender: '남',
      height: '175',
      body_type: '평균',
      job: '회사원',
      education: '대학교',
      region: {
        region: '서울',
        district: '강남구'
      },
      mbti: 'ISTJ',
      interests: ['여행', '음악', '독서'],
      favorite_foods: ['한식', '양식'],
      smoking: '비흡연',
      drinking: '음주',
      religion: '무교',
      children_desire: '자녀 희망',
      marriage_plans: '1-2년 내',
      salary: '5천만원 ~ 7천만원',
      asset: '1억원 ~ 2억원',
      introduction: '안녕하세요! 테스트 사용자입니다.',
      photos: []
    };

    await docClient.send(new PutCommand({
      TableName: 'Profiles',
      Item: profileData
    }));

    console.log('Profiles 테이블에 테스트 데이터 추가 완료');

    // Preferences 테이블에 테스트 데이터 추가
    const preferenceData = {
      user_id: 'test-user-1',
      age_range: { min: 25, max: 35 },
      height_range: { min: 160, max: 180 },
      regions: [{ region: '서울', district: '강남구' }],
      job_types: ['회사원', '전문직'],
      education_levels: ['대학교', '대학원'],
      body_types: ['슬림', '평균'],
      mbti_types: ['ISTJ', 'ISFJ'],
      interests: ['여행', '음악', '독서'],
      smoking: '비흡연',
      drinking: '음주',
      religion: '무교',
      children_desire: '자녀 희망',
      marriage_plan: '1-2년 내',
      priority: '성격'
    };

    await docClient.send(new PutCommand({
      TableName: 'Preferences',
      Item: preferenceData
    }));

    console.log('Preferences 테이블에 테스트 데이터 추가 완료');

  } catch (error) {
    console.error('테스트 데이터 생성 실패:', error);
  }
}

createTestData(); 