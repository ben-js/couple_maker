const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const USERS_TABLE = 'Users';
const PROFILES_TABLE = 'Profiles';
const PREFERENCES_TABLE = 'Preferences';
const SCORES_TABLE = 'Scores';

async function deleteAllBulkUsers() {
  const client = new DynamoDBClient({ region: REGION });
  const tables = [USERS_TABLE, PROFILES_TABLE, PREFERENCES_TABLE, SCORES_TABLE];
  for (const table of tables) {
    const scanRes = await client.send(new ScanCommand({ TableName: table }));
    const items = scanRes.Items || [];
    for (const item of items) {
      const userId = item.user_id?.S || item.user_id?.N;
      if (userId && userId.startsWith('user_')) {
        let key = { user_id: { S: userId } };
        if (table === SCORES_TABLE && item.created_at) key.created_at = item.created_at;
        await client.send(new DeleteItemCommand({ TableName: table, Key: key }));
        console.log(`🗑️ Deleted from ${table}: ${userId}`);
      }
    }
  }
  console.log('✅ user_로 시작하는 모든 유저 데이터 삭제 완료!');
}

deleteAllBulkUsers().catch(console.error); 