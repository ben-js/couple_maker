const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function testRegionData() {
  try {
    const userId = 'test-region-user';
    
    // 다양한 거주지 테스트 데이터 생성
    const testProfiles = [
      {
        user_id: `${userId}-1`,
        name: '서울 강남 사용자',
        region: { region: '서울', district: '강남구' },
        // ... 다른 필드들
      },
      {
        user_id: `${userId}-2`,
        name: '서울 서초 사용자',
        region: { region: '서울', district: '서초구' },
        // ... 다른 필드들
      },
      {
        user_id: `${userId}-3`,
        name: '경기 의정부 사용자',
        region: { region: '경기', district: '의정부' },
        // ... 다른 필드들
      }
    ];

    for (const profile of testProfiles) {
      await docClient.send(new PutCommand({
        TableName: 'Profiles',
        Item: {
          ...profile,
          birth_date: { year: 1990, month: 1, day: 1 },
          gender: '남',
          height: '175',
          body_type: '평균',
          job: '회사원',
          education: '대학교',
          mbti: 'ISTJ',
          interests: ['여행'],
          favorite_foods: ['한식'],
          smoking: '비흡연',
          drinking: '음주',
          religion: '무교',
          children_desire: '자녀 희망',
          marriage_plans: '1-2년 내',
          salary: '5천만원 ~ 7천만원',
          asset: '1억원 ~ 2억원',
          introduction: '테스트 사용자입니다.',
          photos: []
        }
      }));
    }

    console.log('거주지 테스트 데이터 생성 완료');

    // 결과 확인
    for (const profile of testProfiles) {
      const result = await docClient.send(new GetCommand({
        TableName: 'Profiles',
        Key: { user_id: profile.user_id }
      }));
      
      console.log(`${profile.name}: ${result.Item.region.region} ${result.Item.region.district}`);
    }

  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

testRegionData(); 