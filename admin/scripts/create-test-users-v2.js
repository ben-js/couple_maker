// 매칭 알고리즘을 참고해서 테스트 유저들을 생성하는 스크립트 v2
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

// user1@test.com의 preferences를 가져오는 함수
async function getApplicantPreferences() {
  try {
    const result = await dynamodb.send(new GetCommand({
      TableName: 'Preferences',
      Key: { user_id: '1bc37de4-ead1-4881-b8d3-2f6ac9637d63' }
    }));
    
    if (!result.Item) {
      throw new Error('user1@test.com의 preferences를 찾을 수 없습니다.');
    }
    
    console.log('📋 신청자 preferences:', JSON.stringify(result.Item, null, 2));
    return result.Item;
  } catch (error) {
    console.error('❌ preferences 조회 실패:', error);
    throw error;
  }
}

// 테스트 유저 생성 함수
async function createTestUser(userId, userData) {
  try {
    // 1. Users 테이블에 유저 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Users',
      Item: {
        user_id: userId,
        email: userData.email,
        status: 'green', // 매칭 알고리즘에서 green/yellow만 허용
        has_score: true, // 점수가 있다고 표시
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    // 2. Profiles 테이블에 프로필 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Profiles',
      Item: {
        user_id: userId,
        email: userData.email,
        name: userData.name,
        age: userData.age,
        gender: userData.gender,
        height: userData.height,
        region: userData.region,
        job: userData.job,
        education: userData.education,
        religion: userData.religion,
        mbti: userData.mbti,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    // 3. Scores 테이블에 점수 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Scores',
      Item: {
        user_id: userId,
        appearance: userData.scores.appearance,
        personality: userData.scores.personality,
        job: userData.scores.job,
        education: userData.scores.education,
        economics: userData.scores.economics,
        average: userData.scores.average,
        grade: userData.scores.grade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    console.log(`✅ ${userData.email} 생성 완료`);
  } catch (error) {
    console.error(`❌ ${userData.email} 생성 실패:`, error);
  }
}

// 매칭 알고리즘 필터 조건에 맞는 테스트 유저들 생성
async function createTestUsers() {
  try {
    // 1. 신청자 preferences 조회
    const applicantPrefs = await getApplicantPreferences();
    
    // 2. 신청자 프로필 조회 (성별 확인용)
    const applicantProfile = await dynamodb.send(new GetCommand({
      TableName: 'Profiles',
      Key: { user_id: '1bc37de4-ead1-4881-b8d3-2f6ac9637d63' }
    }));
    
    const applicantGender = applicantProfile.Item?.gender;
    const targetGender = applicantGender === '남' ? '여' : '남';
    
    console.log(`🎯 신청자 성별: ${applicantGender}, 대상 성별: ${targetGender}`);
    console.log(`📏 나이 범위: ${applicantPrefs.age_range?.min}~${applicantPrefs.age_range?.max}`);
    console.log(`📏 키 범위: ${applicantPrefs.height_range?.min}~${applicantPrefs.height_range?.max}cm`);
    console.log(`📍 선호 지역: ${applicantPrefs.regions?.map(r => r.region).join(', ')}`);
    console.log(`⛪ 선호 종교: ${applicantPrefs.religion}`);

    // 3. 테스트 유저 데이터 생성 (매칭 알고리즘 필터 조건 준수)
    const testUsers = [];
    
    for (let i = 1; i <= 30; i++) {
      const age = applicantPrefs.age_range ? 
        Math.floor(Math.random() * (applicantPrefs.age_range.max - applicantPrefs.age_range.min + 1)) + applicantPrefs.age_range.min :
        Math.floor(Math.random() * 10) + 25; // 기본 25-34세
      
      const height = applicantPrefs.height_range ?
        Math.floor(Math.random() * (applicantPrefs.height_range.max - applicantPrefs.height_range.min + 1)) + applicantPrefs.height_range.min :
        (targetGender === '여' ? Math.floor(Math.random() * 20) + 155 : Math.floor(Math.random() * 20) + 170); // 여성 155-174cm, 남성 170-189cm
      
      const region = applicantPrefs.regions && applicantPrefs.regions.length > 0 ?
        applicantPrefs.regions[Math.floor(Math.random() * applicantPrefs.regions.length)] :
        { region: '서울', district: '강남구' };
      
      const religion = applicantPrefs.religion && applicantPrefs.religion !== '상관없음' ?
        applicantPrefs.religion :
        ['기독교', '천주교', '불교', '무교'][Math.floor(Math.random() * 4)];
      
      // 점수 생성 (매칭 알고리즘에서 사용)
      const appearance = Math.floor(Math.random() * 40) + 60; // 60-99
      const personality = Math.floor(Math.random() * 40) + 60;
      const job = Math.floor(Math.random() * 40) + 60;
      const education = Math.floor(Math.random() * 40) + 60;
      const economics = Math.floor(Math.random() * 40) + 60;
      const average = Math.round((appearance + personality + job + education + economics) / 5);
      
      // 등급 계산 (매칭 알고리즘에서 사용)
      let grade;
      if (average >= 90) grade = 'S';
      else if (average >= 80) grade = 'A';
      else if (average >= 70) grade = 'B';
      else if (average >= 60) grade = 'C';
      else grade = 'D';

      const userData = {
        email: `testuser${i}@test.com`,
        name: `테스트유저${i}`,
        age: age,
        gender: targetGender,
        height: height.toString(),
        region: region,
        job: ['회사원', '공무원', '의사', '변호사', '교사', '프리랜서'][Math.floor(Math.random() * 6)],
        education: ['고졸', '전문대졸', '대졸', '석사', '박사'][Math.floor(Math.random() * 5)],
        religion: religion,
        mbti: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'][Math.floor(Math.random() * 16)],
        scores: {
          appearance: appearance,
          personality: personality,
          job: job,
          education: education,
          economics: economics,
          average: average,
          grade: grade
        }
      };
      
      testUsers.push(userData);
    }

    // 4. 테스트 유저들 생성
    console.log(`🚀 ${testUsers.length}명의 테스트 유저 생성 시작...`);
    
    for (let i = 0; i < testUsers.length; i++) {
      const userId = `test_user_${i + 1}`;
      await createTestUser(userId, testUsers[i]);
      
      // API 호출 제한을 위한 딜레이
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('🎉 모든 테스트 유저 생성 완료!');
    console.log(`📊 생성된 유저 수: ${testUsers.length}명`);
    console.log(`🎯 대상 성별: ${targetGender}`);
    console.log(`📈 평균 점수 범위: 60-99점`);
    console.log(`🏆 등급 분포: S/A/B/C/D 등급`);
    
  } catch (error) {
    console.error('❌ 테스트 유저 생성 실패:', error);
  }
}

createTestUsers().catch(console.error); 