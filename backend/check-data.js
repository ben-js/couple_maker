const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkData() {
  try {
    // Profiles 테이블에서 데이터 조회
    const profileResult = await docClient.send(new GetCommand({
      TableName: 'Profiles',
      Key: { user_id: 'test-user-1' }
    }));

    console.log('Profiles 데이터:');
    console.log(JSON.stringify(profileResult.Item, null, 2));

    // Preferences 테이블에서 데이터 조회
    const preferenceResult = await docClient.send(new GetCommand({
      TableName: 'Preferences',
      Key: { user_id: 'test-user-1' }
    }));

    console.log('\nPreferences 데이터:');
    console.log(JSON.stringify(preferenceResult.Item, null, 2));

  } catch (error) {
    console.error('데이터 조회 실패:', error);
  }
}

checkData(); 