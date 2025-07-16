const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2'
});

// DynamoDB 테이블 생성 함수
async function createDynamoDBTables() {
  try {
    console.log('=== DynamoDB 테이블 생성 시작 ===');
    
    // 1. Users 테이블 생성
    try {
      await dynamoClient.send(new CreateTableCommand({
        TableName: 'Users',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }));
      console.log('Users 테이블 생성 완료');
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('Users 테이블이 이미 존재합니다');
      } else {
        console.error('Users 테이블 생성 실패:', error);
      }
    }
    
    // 2. Profiles 테이블 생성
    try {
      await dynamoClient.send(new CreateTableCommand({
        TableName: 'Profiles',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }));
      console.log('Profiles 테이블 생성 완료');
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('Profiles 테이블이 이미 존재합니다');
      } else {
        console.error('Profiles 테이블 생성 실패:', error);
      }
    }
    
    // 3. Preferences 테이블 생성
    try {
      await dynamoClient.send(new CreateTableCommand({
        TableName: 'Preferences',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }));
      console.log('Preferences 테이블 생성 완료');
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        console.log('Preferences 테이블이 이미 존재합니다');
      } else {
        console.error('Preferences 테이블 생성 실패:', error);
      }
    }
    
    console.log('=== DynamoDB 테이블 생성 완료 ===');
    
  } catch (error) {
    console.error('DynamoDB 테이블 생성 에러:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  createDynamoDBTables()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { createDynamoDBTables }; 