const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2'
});

const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);

// DynamoDB 데이터 확인 함수
async function checkDynamoDBData() {
  try {
    console.log('=== DynamoDB 데이터 확인 시작 ===');
    
    // 1. Preferences 테이블 데이터 확인
    console.log('\n--- Preferences 테이블 데이터 ---');
    const preferencesResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Preferences',
        ProjectionExpression: 'user_id, priority, preferred_gender, age_range'
      })
    );
    
    if (preferencesResult.Items && preferencesResult.Items.length > 0) {
      preferencesResult.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. 사용자 ID: ${item.user_id}`);
        console.log(`   선호 성별: ${item.preferred_gender}`);
        console.log(`   나이 범위: ${item.age_range}`);
        console.log(`   우선순위: ${JSON.stringify(item.priority)} (타입: ${typeof item.priority})`);
        console.log(`   우선순위 배열 여부: ${Array.isArray(item.priority)}`);
      });
    } else {
      console.log('Preferences 테이블에 데이터가 없습니다.');
    }
    
    // 2. Users 테이블 데이터 확인
    console.log('\n--- Users 테이블 데이터 ---');
    const usersResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Users',
        ProjectionExpression: 'user_id, email, has_profile, has_preferences'
      })
    );
    
    if (usersResult.Items && usersResult.Items.length > 0) {
      usersResult.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. 사용자 ID: ${item.user_id}`);
        console.log(`   이메일: ${item.email}`);
        console.log(`   프로필 등록: ${item.has_profile}`);
        console.log(`   이상형 등록: ${item.has_preferences}`);
      });
    } else {
      console.log('Users 테이블에 데이터가 없습니다.');
    }
    
    // 3. Profiles 테이블 데이터 확인
    console.log('\n--- Profiles 테이블 데이터 ---');
    const profilesResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Profiles',
        ProjectionExpression: 'user_id, name, gender, age'
      })
    );
    
    if (profilesResult.Items && profilesResult.Items.length > 0) {
      profilesResult.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. 사용자 ID: ${item.user_id}`);
        console.log(`   이름: ${item.name}`);
        console.log(`   성별: ${item.gender}`);
        console.log(`   나이: ${item.age}`);
      });
    } else {
      console.log('Profiles 테이블에 데이터가 없습니다.');
    }
    
    console.log('\n=== DynamoDB 데이터 확인 완료 ===');
    
  } catch (error) {
    console.error('데이터 확인 에러:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  checkDynamoDBData()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkDynamoDBData }; 