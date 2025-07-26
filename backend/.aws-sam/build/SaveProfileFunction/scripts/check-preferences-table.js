const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function checkPreferencesTable() {
  try {
    console.log('🔍 Preferences 테이블 확인 중...');
    
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Preferences',
        Limit: 10
      })
    );

    console.log('📊 Preferences 테이블 데이터:');
    console.log('총 아이템 수:', result.Count);
    console.log('스캔된 아이템 수:', result.ScannedCount);
    
    if (result.Items && result.Items.length > 0) {
      console.log('\n📋 아이템 목록:');
      result.Items.forEach((item, index) => {
        console.log(`\n--- 아이템 ${index + 1} ---`);
        console.log('user_id:', item.user_id);
        console.log('preferred_gender:', item.preferred_gender);
        console.log('age_range:', item.age_range);
        console.log('height_range:', item.height_range);
        console.log('regions:', item.regions);
        console.log('job_types:', item.job_types);
        console.log('education_levels:', item.education_levels);
        console.log('body_types:', item.body_types);
        console.log('mbti_types:', item.mbti_types);
        console.log('interests:', item.interests);
        console.log('marriage_plan:', item.marriage_plan);
        console.log('children_desire:', item.children_desire);
        console.log('smoking:', item.smoking);
        console.log('drinking:', item.drinking);
        console.log('religion:', item.religion);
        console.log('priority:', item.priority);
      });
    } else {
      console.log('❌ Preferences 테이블에 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ Preferences 테이블 확인 실패:', error);
  }
}

checkPreferencesTable(); 