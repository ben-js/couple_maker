// 테스트 유저들의 Preferences를 생성하는 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

// 테스트 유저의 preferences 생성 함수
async function createTestPreferences(userId, email, gender) {
  try {
    // 성별에 따른 선호 성별 설정 (반대 성별 선호)
    const preferredGender = gender === '남' ? '여' : '남';
    
    // 기본 preferences 데이터 생성
    const preferences = {
      user_id: userId,
      email: email,
      preferred_gender: preferredGender,
      
      // 나이 범위 (20-35세)
      age_range: {
        min: 20,
        max: 35
      },
      
      // 키 범위 (성별에 따라 다름)
      height_range: preferredGender === '여' ? 
        { min: 155, max: 170 } : // 여성 선호 키
        { min: 170, max: 185 },  // 남성 선호 키
      
      // 지역 (서울, 경기 중심)
      regions: [
        { region: '서울', district: '강남구' },
        { region: '서울', district: '서초구' },
        { region: '경기', district: '성남시' },
        { region: '경기', district: '수원시' }
      ],
      
      // 종교 (다양하게)
      religion: ['기독교', '천주교', '불교', '무교'][Math.floor(Math.random() * 4)],
      
      // 직업 유형
      job_types: [
        '회사원',
        '공무원',
        '의료진',
        '교육진',
        '프리랜서'
      ],
      
      // 학력 수준
      education_levels: [
        '대학교',
        '대학원',
        '석사',
        '박사'
      ],
      
      // MBTI 유형 (다양하게)
      mbti_types: [
        'ENFP', 'INFJ', 'INTJ', 'ENTP',
        'ENFJ', 'INFP', 'ISTJ', 'ISFJ'
      ],
      
      // 체형 선호
      body_types: [
        '평균',
        '슬림',
        '글래머'
      ],
      
      // 우선순위
      priority: '성격,외모,직업,학력,가치관,취미,경제력,거주지',
      
      // 결혼 계획
      marriage_plan: ['1년 내', '1-2년 내', '2-3년 내'][Math.floor(Math.random() * 3)],
      
      // 자녀 희망
      children_desire: ['자녀 희망', '자녀 무관'][Math.floor(Math.random() * 2)],
      
      // 흡연
      smoking: ['비흡연', '흡연 무관'][Math.floor(Math.random() * 2)],
      
      // 음주
      drinking: ['음주', '음주 무관'][Math.floor(Math.random() * 2)],
      
      // 관심사
      interests: [
        '여행', '음악', '영화', '독서',
        '운동', '요리', '게임', '쇼핑'
      ],
      
      // 위치
      locations: [
        '강남구', '서초구', '성남시', '수원시'
      ],
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Preferences 테이블에 저장
    await dynamodb.send(new PutCommand({
      TableName: 'Preferences',
      Item: preferences
    }));

    console.log(`✅ ${email} preferences 생성 완료`);
  } catch (error) {
    console.error(`❌ ${email} preferences 생성 실패:`, error);
  }
}

// 모든 테스트 유저들의 preferences 생성
async function createAllTestPreferences() {
  try {
    console.log('🚀 테스트 유저들의 Preferences 생성 시작...');
    
    for (let i = 1; i <= 30; i++) {
      const userId = `test_user_${i}`;
      const email = `testuser${i}@test.com`;
      
      // 해당 유저의 프로필에서 성별 정보 가져오기
      try {
        const profileResult = await dynamodb.send(new GetCommand({
          TableName: 'Profiles',
          Key: { user_id: userId }
        }));
        
        if (profileResult.Item) {
          const gender = profileResult.Item.gender;
          await createTestPreferences(userId, email, gender);
        } else {
          console.log(`⚠️ ${email}의 프로필을 찾을 수 없습니다.`);
        }
      } catch (error) {
        console.error(`❌ ${email} 프로필 조회 실패:`, error);
      }
      
      // API 호출 제한을 위한 딜레이
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('🎉 모든 테스트 유저의 Preferences 생성 완료!');
    console.log('📊 생성된 Preferences 수: 30개');
    console.log('🎯 양방향 매칭을 위한 선호도 정보 완성');
    
  } catch (error) {
    console.error('❌ Preferences 생성 실패:', error);
  }
}

createAllTestPreferences().catch(console.error); 