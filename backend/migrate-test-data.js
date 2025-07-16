const fs = require('fs');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2'
});

const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);

// JSON 파일 읽기 함수
function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`파일 읽기 실패: ${filePath}`, error);
    return [];
  }
}

// 테스트 데이터 마이그레이션 함수
async function migrateTestData() {
  try {
    console.log('=== 테스트 데이터 마이그레이션 시작 ===');
    
    const dataPath = path.join(__dirname, 'data');
    
    // 1. 사용자 데이터 마이그레이션
    const usersPath = path.join(dataPath, 'users.json');
    const users = readJson(usersPath);
    let migratedUsers = 0;
    
    for (const user of users) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: 'Users',
            Item: user
          })
        );
        migratedUsers++;
        console.log(`사용자 마이그레이션 완료: ${user.user_id}`);
      } catch (error) {
        console.error(`사용자 마이그레이션 실패: ${user.user_id}`, error);
      }
    }
    
    // 2. 프로필 데이터 마이그레이션
    const profilesPath = path.join(dataPath, 'profiles.json');
    const profiles = readJson(profilesPath);
    let migratedProfiles = 0;
    
    for (const profile of profiles) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: 'Profiles',
            Item: profile
          })
        );
        migratedProfiles++;
        console.log(`프로필 마이그레이션 완료: ${profile.user_id}`);
      } catch (error) {
        console.error(`프로필 마이그레이션 실패: ${profile.user_id}`, error);
      }
    }
    
    // 3. 이상형 데이터 마이그레이션
    const preferencesPath = path.join(dataPath, 'preferences.json');
    const preferences = readJson(preferencesPath);
    let migratedPreferences = 0;
    
    for (const preference of preferences) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: 'Preferences',
            Item: preference
          })
        );
        migratedPreferences++;
        console.log(`이상형 마이그레이션 완료: ${preference.user_id}`);
      } catch (error) {
        console.error(`이상형 마이그레이션 실패: ${preference.user_id}`, error);
      }
    }
    
    console.log('=== 테스트 데이터 마이그레이션 완료 ===');
    console.log(`마이그레이션 결과:`);
    console.log(`- 사용자: ${migratedUsers}/${users.length}`);
    console.log(`- 프로필: ${migratedProfiles}/${profiles.length}`);
    console.log(`- 이상형: ${migratedPreferences}/${preferences.length}`);
    
  } catch (error) {
    console.error('마이그레이션 에러:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateTestData()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateTestData }; 