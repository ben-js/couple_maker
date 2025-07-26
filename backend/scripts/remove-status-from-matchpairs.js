const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('../config');

const ddbClient = new DynamoDBClient(config.aws);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

async function removeStatusFromMatchPairs() {
  try {
    console.log('🔍 MatchPairs 테이블에서 status 필드 제거 시작...');
    
    // 1. 모든 MatchPairs 항목 스캔
    const scanParams = {
      TableName: config.dynamodb.matchPairsTable || 'MatchPairs'
    };
    
    const scanResult = await ddbDocClient.send(new ScanCommand(scanParams));
    console.log(`📝 총 ${scanResult.Items?.length || 0}개의 MatchPairs 항목 발견`);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('✅ 제거할 항목이 없습니다.');
      return;
    }
    
    // 2. 각 항목에서 status 필드 제거
    let processedCount = 0;
    for (const item of scanResult.Items) {
      if (item.status !== undefined) {
        try {
          const updateParams = {
            TableName: config.dynamodb.matchPairsTable || 'MatchPairs',
            Key: { match_id: item.match_id },
            UpdateExpression: 'REMOVE #status',
            ExpressionAttributeNames: {
              '#status': 'status'
            }
          };
          
          await ddbDocClient.send(new UpdateCommand(updateParams));
          console.log(`✅ match_id ${item.match_id}에서 status 필드 제거 완료`);
          processedCount++;
        } catch (error) {
          console.error(`❌ match_id ${item.match_id}에서 status 필드 제거 실패:`, error);
        }
      }
    }
    
    console.log(`🎉 완료! 총 ${processedCount}개의 항목에서 status 필드 제거됨`);
    
  } catch (error) {
    console.error('❌ Error removing status from MatchPairs:', error);
  }
}

// 스크립트 실행
removeStatusFromMatchPairs(); 