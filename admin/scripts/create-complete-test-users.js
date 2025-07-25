// frontend 데이터 구조 기반으로 완전한 테스트 유저들을 생성하는 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

// frontend options.json 기반 옵션들
const OPTIONS = {
  genders: ["남", "여"],
  bodyTypes: ["보통", "마른", "모델핏", "운동하는체형", "귀엽고통통한", "통통한편", "포근한체형"],
  jobs: ["회사원", "학생", "자영업", "의사", "간호사", "교사", "공무원", "공기업", "요리사", "미용사", "교수", "판사", "검사", "변호사", "작가", "예술가", "운동선수", "연예인", "기타"],
  educations: ["고등학교", "전문대", "대학교", "대학원", "박사"],
  religions: ["무교", "불교", "천주교", "기독교", "기타"],
  mbtis: ["ISTJ","ISFJ","INFJ","INTJ","ISTP","ISFP","INFP","INTP","ESTP","ESFP","ENFP","ENTP","ESTJ","ESFJ","ENFJ","ENTJ"],
  interests: ["여행", "음악", "운동", "독서", "영화", "요리", "게임", "사진", "드라마 보기", "넷플릭스보기", "유튜브", "카페탐방", "맛집탐방", "산책", "캠핑", "반려동물", "봉사활동", "미술", "춤", "악기", "코딩", "쇼핑", "패션", "주식", "투자", "자기계발", "기타"],
  smoking: ["비흡연", "흡연"],
  drinking: ["비음주", "음주"],
  foods: ["한식", "중식", "일식", "양식", "분식", "샐러드", "디저트", "해산물", "고기", "채식", "기타"],
  childrenDesire: ["딩크족 희망", "자녀 희망"],
  salary: ["4천만원 미만", "4천만원 ~ 5천만원", "5천만원 ~ 7천만원", "7천만원 ~ 9천만원", "1억원 ~ 1억5천만원", "1억5천만원 ~ 2억원", "2억원 이상"],
  asset: ["5천만원 미만", "5천만원 ~ 1억원", "1억원 ~ 2억원", "2억원 ~ 3억원", "3억원 ~ 5억원", "5억원 ~ 10억원", "10억원 ~ 15억원", "15억원 ~ 20억원", "20억원 이상"],
  marriagePlans: ["1년 내", "1-2년 내", "2-3년 내", "3년 후", "미정"]
};

// user1@test.com의 데이터를 가져오는 함수
async function getApplicantData() {
  try {
    const userId = '1bc37de4-ead1-4881-b8d3-2f6ac9637d63';
    
    // 프로필 조회
    const profileResult = await dynamodb.send(new GetCommand({
      TableName: 'Profiles',
      Key: { user_id: userId }
    }));
    
    // 선호도 조회
    const preferencesResult = await dynamodb.send(new GetCommand({
      TableName: 'Preferences',
      Key: { user_id: userId }
    }));
    
    if (!profileResult.Item || !preferencesResult.Item) {
      throw new Error('user1@test.com의 프로필 또는 선호도 데이터를 찾을 수 없습니다.');
    }
    
    console.log('📋 user1@test.com 데이터 조회 완료');
    return {
      profile: profileResult.Item,
      preferences: preferencesResult.Item
    };
  } catch (error) {
    console.error('❌ user1@test.com 데이터 조회 실패:', error);
    throw error;
  }
}

// 랜덤 선택 함수
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 완전한 테스트 유저 생성 함수
async function createCompleteTestUser(userId, userData) {
  try {
    const password = await bcrypt.hash('1q2w3e4r', 10);
    
    // 1. Users 테이블에 유저 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Users',
      Item: {
        user_id: userId,
        email: userData.email,
        password: password,
        status: 'green',
        has_score: true,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    // 2. Profiles 테이블에 완전한 프로필 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Profiles',
      Item: {
        user_id: userId,
        email: userData.email,
        name: userData.name,
        birthDate: userData.birthDate,
        age: userData.age,
        gender: userData.gender,
        height: userData.height,
        bodyType: userData.bodyType,
        job: userData.job,
        education: userData.education,
        region: userData.region,
        mbti: userData.mbti,
        interests: userData.interests,
        favoriteFoods: userData.favoriteFoods,
        smoking: userData.smoking,
        drinking: userData.drinking,
        religion: userData.religion,
        childrenDesire: userData.childrenDesire,
        marriagePlans: userData.marriagePlans,
        salary: userData.salary,
        asset: userData.asset,
        introduction: userData.introduction,
        photos: userData.photos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    // 3. Preferences 테이블에 완전한 선호도 생성
    await dynamodb.send(new PutCommand({
      TableName: 'Preferences',
      Item: {
        user_id: userId,
        email: userData.email,
        preferred_gender: userData.preferred_gender,
        age_range: userData.age_range,
        height_range: userData.height_range,
        regions: userData.regions,
        job_types: userData.job_types,
        education_levels: userData.education_levels,
        body_types: userData.body_types,
        mbti_types: userData.mbti_types,
        interests: userData.preference_interests,
        smoking: userData.preference_smoking,
        drinking: userData.preference_drinking,
        religion: userData.preference_religion,
        children_desire: userData.preference_children_desire,
        marriage_plan: userData.marriage_plan,
        priority: userData.priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));

    // 4. Scores 테이블에 점수 생성
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

    console.log(`✅ ${userData.email} 완전한 테스트 유저 생성 완료`);
  } catch (error) {
    console.error(`❌ ${userData.email} 생성 실패:`, error);
  }
}

// user1@test.com의 데이터를 참고해서 테스트 유저 데이터 생성
async function createTestUsersData(applicantData) {
  const testUsers = [];
  const applicantGender = applicantData.profile.gender;
  const targetGender = applicantGender === '남' ? '여' : '남';
  
  console.log(`🎯 신청자 성별: ${applicantGender}, 대상 성별: ${targetGender}`);
  
  for (let i = 1; i <= 30; i++) {
    // 나이 (신청자 선호 범위 내)
    const age = applicantData.preferences.age_range ? 
      Math.floor(Math.random() * (applicantData.preferences.age_range.max - applicantData.preferences.age_range.min + 1)) + applicantData.preferences.age_range.min :
      Math.floor(Math.random() * 10) + 25;
    
    // 키 (신청자 선호 범위 내)
    const height = applicantData.preferences.height_range ?
      Math.floor(Math.random() * (applicantData.preferences.height_range.max - applicantData.preferences.height_range.min + 1)) + applicantData.preferences.height_range.min :
      (targetGender === '여' ? Math.floor(Math.random() * 20) + 155 : Math.floor(Math.random() * 20) + 170);
    
    // 지역 (신청자 선호 지역 중에서)
    const region = applicantData.preferences.regions && applicantData.preferences.regions.length > 0 ?
      applicantData.preferences.regions[Math.floor(Math.random() * applicantData.preferences.regions.length)] :
      { region: '서울', district: '강남구' };
    
    // 점수 생성
    const appearance = Math.floor(Math.random() * 40) + 60;
    const personality = Math.floor(Math.random() * 40) + 60;
    const job = Math.floor(Math.random() * 40) + 60;
    const education = Math.floor(Math.random() * 40) + 60;
    const economics = Math.floor(Math.random() * 40) + 60;
    const average = Math.round((appearance + personality + job + education + economics) / 5);
    
    // 등급 계산
    let grade;
    if (average >= 90) grade = 'S';
    else if (average >= 80) grade = 'A';
    else if (average >= 70) grade = 'B';
    else if (average >= 60) grade = 'C';
    else grade = 'D';

    const userData = {
      email: `testuser${i}@test.com`,
      name: `테스트유저${i}`,
      birthDate: { year: 2000 - age, month: Math.floor(Math.random() * 12) + 1, day: Math.floor(Math.random() * 28) + 1 },
      age: age,
      gender: targetGender,
      height: height.toString(),
      bodyType: getRandomItem(OPTIONS.bodyTypes),
      job: getRandomItem(OPTIONS.jobs),
      education: getRandomItem(OPTIONS.educations),
      region: region,
      mbti: getRandomItem(OPTIONS.mbtis),
      interests: getRandomItems(OPTIONS.interests, Math.floor(Math.random() * 3) + 3), // 3-5개
      favoriteFoods: getRandomItems(OPTIONS.foods, Math.floor(Math.random() * 2) + 1), // 1-3개
      smoking: getRandomItem(OPTIONS.smoking),
      drinking: getRandomItem(OPTIONS.drinking),
      religion: getRandomItem(OPTIONS.religions),
      childrenDesire: getRandomItem(OPTIONS.childrenDesire),
      marriagePlans: getRandomItem(OPTIONS.marriagePlans),
      salary: getRandomItem(OPTIONS.salary),
      asset: getRandomItem(OPTIONS.asset),
      introduction: `안녕하세요! 저는 ${age}살 ${targetGender}성입니다. ${getRandomItem(OPTIONS.interests)}을(를) 좋아하고, ${getRandomItem(OPTIONS.foods)}을(를) 즐겨 먹습니다.`,
      photos: [],
      // 선호도 (신청자와 반대 성별 선호)
      preferred_gender: applicantGender,
      age_range: { min: Math.max(18, age - 5), max: Math.min(50, age + 5) },
      height_range: targetGender === '여' ? { min: 170, max: 185 } : { min: 155, max: 170 },
      regions: [region],
      job_types: getRandomItems(OPTIONS.jobs, Math.floor(Math.random() * 2) + 1),
      education_levels: getRandomItems(OPTIONS.educations, Math.floor(Math.random() * 2) + 1),
      body_types: getRandomItems(OPTIONS.bodyTypes, Math.floor(Math.random() * 2) + 1),
      mbti_types: getRandomItems(OPTIONS.mbtis, Math.floor(Math.random() * 2) + 1),
      preference_interests: getRandomItems(OPTIONS.interests, Math.floor(Math.random() * 3) + 2),
      preference_smoking: getRandomItem([...OPTIONS.smoking, "상관없음"]),
      preference_drinking: getRandomItem([...OPTIONS.drinking, "상관없음"]),
      preference_religion: getRandomItem([...OPTIONS.religions, "상관없음"]),
      preference_children_desire: getRandomItem([...OPTIONS.childrenDesire, "상관없음"]),
      marriage_plan: getRandomItem(OPTIONS.marriagePlans),
      priority: "성격,외모,직업,학력,경제력",
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
  
  return testUsers;
}

// 메인 함수
async function createCompleteTestUsers() {
  try {
    console.log('🚀 완전한 테스트 유저 생성 시작...');
    
    // 1. user1@test.com 데이터 조회
    const applicantData = await getApplicantData();
    
    // 2. 테스트 유저 데이터 생성
    const testUsersData = await createTestUsersData(applicantData);
    
    console.log(`📊 ${testUsersData.length}명의 테스트 유저 데이터 생성 완료`);
    
    // 3. 테스트 유저들 생성
    for (let i = 0; i < testUsersData.length; i++) {
      const userId = `test_user_${i + 1}`;
      await createCompleteTestUser(userId, testUsersData[i]);
      
      // API 호출 제한을 위한 딜레이
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('🎉 모든 완전한 테스트 유저 생성 완료!');
    console.log(`📊 생성된 유저 수: ${testUsersData.length}명`);
    console.log('🎯 user1@test.com의 이상형 조건에 맞는 완전한 프로필/선호도 보유');
    console.log('🔐 모든 유저 비밀번호: 1q2w3e4r (bcrypt 해시)');
    
  } catch (error) {
    console.error('❌ 완전한 테스트 유저 생성 실패:', error);
  }
}

createCompleteTestUsers().catch(console.error); 