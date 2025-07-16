const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

async function fixUserProfile() {
  try {
    const userId = 'test-user-2';
    
    // Users 테이블의 has_profile을 true로 업데이트
    await docClient.send(new UpdateCommand({
      TableName: 'Users',
      Key: { user_id: userId },
      UpdateExpression: 'set has_profile = :val',
      ExpressionAttributeValues: { ':val': true }
    }));

    console.log('Users 테이블 has_profile 업데이트 완료');

    // 결과 확인
    const userResult = await docClient.send(new GetCommand({
      TableName: 'Users',
      Key: { user_id: userId }
    }));

    console.log('\n=== 업데이트 후 Users 데이터 ===');
    console.log(JSON.stringify(userResult.Item, null, 2));

  } catch (error) {
    console.error('업데이트 실패:', error);
  }
}

fixUserProfile(); 