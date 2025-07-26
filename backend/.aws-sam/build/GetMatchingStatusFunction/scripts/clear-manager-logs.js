const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const dynamodb = DynamoDBDocumentClient.from(client);

async function clearManagerLogs() {
  try {
    console.log('🧹 ManagerLogs 테이블 데이터 삭제 중...');
    
    // 모든 아이템 조회
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: 'ManagerLogs'
    }));
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('📭 삭제할 데이터가 없습니다.');
      return;
    }
    
    console.log(`🗑️  ${scanResult.Items.length}개의 로그를 삭제합니다...`);
    
    // 각 아이템 삭제
    for (const item of scanResult.Items) {
      await dynamodb.send(new DeleteCommand({
        TableName: 'ManagerLogs',
        Key: { id: item.id }
      }));
    }
    
    console.log('✅ 모든 로그 데이터 삭제 완료');
    
  } catch (error) {
    console.error('❌ 데이터 삭제 중 오류 발생:', error);
  }
}

clearManagerLogs(); 