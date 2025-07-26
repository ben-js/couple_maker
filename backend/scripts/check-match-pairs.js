const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const AWS_CONFIG = require('../config/aws');

const ddbClient = new DynamoDBClient(AWS_CONFIG);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

async function checkMatchPairs() {
  try {
    console.log('🔍 MatchPairs 테이블 조회 시작...');
    
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'MatchPairs'
      })
    );
    
    console.log('📊 MatchPairs 테이블 데이터:');
    console.log('총 개수:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach((item, index) => {
        console.log(`\n--- MatchPair ${index + 1} ---`);
        console.log('match_id:', item.match_id);
        console.log('match_a_id:', item.match_a_id);
        console.log('match_b_id:', item.match_b_id);
        console.log('status:', item.status);
        console.log('confirm_proposed:', item.confirm_proposed);
        console.log('created_at:', item.created_at);
        console.log('updated_at:', item.updated_at);
        console.log('user_a_choices:', item.user_a_choices);
        console.log('user_b_choices:', item.user_b_choices);
      });
    } else {
      console.log('❌ MatchPairs 테이블에 데이터가 없습니다.');
    }
    
    // user_1이 포함된 매칭 확인
    console.log('\n🔍 user_1이 포함된 매칭 확인...');
    const user1Matches = result.Items?.filter(item => 
      item.match_a_id === 'user_1' || item.match_b_id === 'user_1'
    ) || [];
    
    console.log('user_1이 포함된 매칭 개수:', user1Matches.length);
    user1Matches.forEach((item, index) => {
      console.log(`\n--- user_1 매칭 ${index + 1} ---`);
      console.log('match_id:', item.match_id);
      console.log('match_a_id:', item.match_a_id);
      console.log('match_b_id:', item.match_b_id);
      console.log('status:', item.status);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkMatchPairs(); 