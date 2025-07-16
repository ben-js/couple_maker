const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2'
  // 실제 AWS DynamoDB 사용 (DynamoDB Local 제거)
});

const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);

// priority 필드를 배열로 업데이트하는 함수
async function updatePriorityField() {
  try {
    console.log('=== DynamoDB priority 필드 업데이트 시작 ===');
    
    // 1. Preferences 테이블에서 모든 데이터 스캔
    const scanResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Preferences',
        ProjectionExpression: 'user_id, priority'
      })
    );
    
    console.log(`총 ${scanResult.Items?.length || 0}개의 레코드를 찾았습니다.`);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('업데이트할 데이터가 없습니다.');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // 2. 각 레코드의 priority 필드 업데이트
    for (const item of scanResult.Items) {
      try {
        // priority 필드가 이미 배열이면 스킵
        if (Array.isArray(item.priority)) {
          console.log(`사용자 ${item.user_id}: priority가 이미 배열입니다. 스킵.`);
          skippedCount++;
          continue;
        }
        
        // priority 필드가 문자열이면 배열로 변환
        let newPriority = [];
        if (item.priority && typeof item.priority === 'string') {
          // 쉼표로 구분된 문자열을 배열로 변환
          newPriority = item.priority.split(',').map(p => p.trim()).filter(p => p);
        } else if (item.priority) {
          // 기타 타입이면 기본값 설정
          newPriority = ['외모', '성격', '직업'];
        } else {
          // priority 필드가 없으면 기본값 설정
          newPriority = ['외모', '성격', '직업'];
        }
        
        // DynamoDB 업데이트
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: 'Preferences',
            Key: { user_id: item.user_id },
            UpdateExpression: 'SET priority = :priority, updated_at = :updated_at',
            ExpressionAttributeValues: {
              ':priority': newPriority,
              ':updated_at': new Date().toISOString()
            }
          })
        );
        
        console.log(`사용자 ${item.user_id}: priority 업데이트 완료 - ${JSON.stringify(newPriority)}`);
        updatedCount++;
        
        // API 제한을 피하기 위한 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`사용자 ${item.user_id} 업데이트 실패:`, error);
      }
    }
    
    console.log('=== DynamoDB priority 필드 업데이트 완료 ===');
    console.log(`업데이트 결과:`);
    console.log(`- 업데이트된 레코드: ${updatedCount}`);
    console.log(`- 스킵된 레코드: ${skippedCount}`);
    console.log(`- 총 처리된 레코드: ${updatedCount + skippedCount}`);
    
  } catch (error) {
    console.error('DynamoDB 업데이트 에러:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  updatePriorityField()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { updatePriorityField }; 