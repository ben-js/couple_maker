const { DynamoDBClient, ScanCommand, UpdateCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const AWS_CONFIG = require('../../backend/config/aws');

const dynamodb = new DynamoDBClient(AWS_CONFIG);

async function updateProposalStatus() {
  try {
    console.log('🔍 Proposals 테이블에서 기존 상태값 조회 중...');
    
    // 1. 모든 proposals 조회
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: 'Proposals'
    }));
    
    const proposals = scanResult.Items.map(item => unmarshall(item));
    console.log(`📊 총 ${proposals.length}개의 proposal 발견`);
    
    // 2. 상태값이 'accept' 또는 'refuse'인 항목들 찾기
    const needUpdate = proposals.filter(p => p.status === 'accept' || p.status === 'refuse');
    console.log(`🔄 업데이트 필요한 항목: ${needUpdate.length}개`);
    
    if (needUpdate.length === 0) {
      console.log('✅ 업데이트할 항목이 없습니다.');
      return;
    }
    
    // 3. 각 항목 업데이트
    for (const proposal of needUpdate) {
      const newStatus = proposal.status === 'accept' ? 'accepted' : 'refused';
      
      console.log(`🔄 ${proposal.proposal_id}: ${proposal.status} → ${newStatus}`);
      
      await dynamodb.send(new UpdateCommand({
        TableName: 'Proposals',
        Key: marshall({
          proposal_id: proposal.proposal_id
        }),
        UpdateExpression: 'SET #status = :newStatus',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':newStatus': newStatus
        })
      }));
    }
    
    console.log('✅ 모든 proposal 상태값 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 업데이트 중 오류 발생:', error);
  }
}

// 스크립트 실행
updateProposalStatus(); 