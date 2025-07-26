const { DynamoDBClient, DeleteTableCommand } = require('@aws-sdk/client-dynamodb');

const ddbClient = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});

async function deleteManagerLogsTable() {
  try {
    console.log('🗑️  ManagerLogs 테이블 삭제 중...');
    await ddbClient.send(new DeleteTableCommand({ TableName: 'ManagerLogs' }));
    console.log('✅ ManagerLogs 테이블 삭제 완료');
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('⚠️  ManagerLogs 테이블이 존재하지 않습니다.');
    } else {
      console.error('❌ ManagerLogs 테이블 삭제 실패:', error.message);
    }
  }
}

deleteManagerLogsTable().catch(console.error); 