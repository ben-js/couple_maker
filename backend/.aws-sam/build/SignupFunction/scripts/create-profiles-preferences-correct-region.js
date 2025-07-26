const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-northeast-2'  // 서울 리전
});

const dynamodb = DynamoDBDocumentClient.from(client);

async function createProfilesAndPreferences() {
  console.log('🚀 프로필과 선호도(이상형) 생성 시작...');
  
  try {
    // 기존 사용자 조회
    const usersResponse = await dynamodb.send(new ScanCommand({ TableName: 'Users' }));
    const users = usersResponse.Items || [];
    
    console.log(`📊 ${users.length}명의 사용자 발견`);
    
    for (const user of users) {
      console.log(`\n👤 ${user.email} 프로필/선호도 생성 중...`);
      
      // 프로필 생성
      const profileData = {
        user_id: user.user_id,
        name: user.email === 'user1@test.com' ? '김민형' : '이영희',
        gender: user.email === 'user1@test.com' ? '남' : '여',
        birth_date: {
          year: user.email === 'user1@test.com' ? 2001 : 1998,
          month: user.email === 'user1@test.com' ? 8 : 3,
          day: user.email === 'user1@test.com' ? 9 : 15
        },
        height: user.email === 'user1@test.com' ? 180 : 165,
        body_type: '평균',
        education: '대학교',
        job: user.email === 'user1@test.com' ? '의료진' : '회사원',
        salary: user.email === 'user1@test.com' ? '5천만원 ~ 7천만원' : '3천만원 ~ 5천만원',
        assets: 'N/A',
        location: '서울',
        mbti: user.email === 'user1@test.com' ? 'INTJ' : 'ENFP',
        religion: '불교',
        smoking: '비흡연',
        drinking: '음주',
        marriage_plan: '1-2년 내',
        children_wish: '1-2명',
        interests: ['유튜브', '카페 탐방', '코딩'],
        favorite_food: '한식',
        introduction: user.email === 'user1@test.com' ? '하하' : '안녕하세요!',
        photos: []
      };

      try {
        await dynamodb.send(new PutCommand({
          TableName: 'Profiles',
          Item: profileData
        }));
        console.log(`✅ ${user.email} 프로필 생성 완료`);
        console.log(`   이름: ${profileData.name}, 성별: ${profileData.gender}, 키: ${profileData.height}cm`);
      } catch (error) {
        console.error(`❌ ${user.email} 프로필 생성 실패:`, error.message);
      }

      // 선호도(이상형) 생성
      const preferenceData = {
        user_id: user.user_id,
        preferred_gender: user.email === 'user1@test.com' ? '여' : '남',
        age_range: {
          min: user.email === 'user1@test.com' ? 20 : 25,
          max: user.email === 'user1@test.com' ? 30 : 35
        },
        height_range: {
          min: user.email === 'user1@test.com' ? 160 : 170,
          max: user.email === 'user1@test.com' ? 175 : 185
        },
        regions: [
          { region: '서울', district: '강남구' },
          { region: '경기', district: '성남시' }
        ],
        job_types: ['회사원', '의료진'],
        education_levels: ['대학교', '대학원'],
        body_types: ['평균', '슬림'],
        mbti_types: ['ENFP', 'INFJ'],
        interests: ['여행', '음악'],
        marriage_plan: '1-2년 내',
        children_desire: '자녀 희망',
        smoking: '비흡연',
        drinking: '음주',
        religion: '무교',
        priority: '성격'
      };

      try {
        await dynamodb.send(new PutCommand({
          TableName: 'Preferences',
          Item: preferenceData
        }));
        console.log(`✅ ${user.email} 선호도(이상형) 생성 완료`);
        console.log(`   선호 성별: ${preferenceData.preferred_gender}, 나이: ${preferenceData.age_min}-${preferenceData.age_max}세`);
      } catch (error) {
        console.error(`❌ ${user.email} 선호도 생성 실패:`, error.message);
      }

      // 사용자 정보 업데이트 (has_profile, has_preferences를 true로)
      try {
        await dynamodb.send(new PutCommand({
          TableName: 'Users',
          Item: {
            ...user,
            has_profile: true,
            has_preferences: true,
            updated_at: new Date().toISOString()
          }
        }));
        console.log(`✅ ${user.email} 사용자 정보 업데이트 완료 (프로필/선호도 있음)`);
      } catch (error) {
        console.error(`❌ ${user.email} 사용자 정보 업데이트 실패:`, error.message);
      }
    }

    // 생성된 데이터 확인
    console.log('\n📊 생성된 데이터 확인:');
    
    const profilesResponse = await dynamodb.send(new ScanCommand({ TableName: 'Profiles' }));
    const preferencesResponse = await dynamodb.send(new ScanCommand({ TableName: 'Preferences' }));
    
    console.log(`- Profiles: ${profilesResponse.Items?.length || 0}개`);
    console.log(`- Preferences: ${preferencesResponse.Items?.length || 0}개`);

    console.log('\n🎉 프로필과 선호도(이상형) 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createProfilesAndPreferences(); 