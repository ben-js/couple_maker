const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const AWS_CONFIG = require('../config/aws');

const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function testManagerLog() {
  try {
    console.log('🧪 매니저 로그 테스트 시작...');
    
    const testLog = {
      TableName: 'ManagerLogs',
      Item: {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        managerId: 'test_manager_001',
        action: 'test_action',
        targetId: 'test_user_001',
        details: '테스트 로그입니다.'
      }
    };
    
    console.log('📝 저장할 로그 데이터:', JSON.stringify(testLog.Item, null, 2));
    
    const result = await dynamodb.send(new PutCommand(testLog));
    console.log('✅ 로그 저장 완료:', result);
    
    // 저장된 데이터 확인
    console.log('\n🔍 저장된 데이터 확인...');
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: 'ManagerLogs',
      FilterExpression: 'managerId = :managerId',
      ExpressionAttributeValues: {
        ':managerId': 'test_manager_001'
      }
    }));
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log('✅ 테스트 로그가 정상적으로 저장되었습니다:');
      scanResult.Items.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   매니저: ${item.managerId}`);
        console.log(`   액션: ${item.action}`);
        console.log(`   대상: ${item.targetId}`);
        console.log(`   상세: ${item.details}`);
        console.log(`   시간: ${item.timestamp}`);
        console.log('');
      });
    } else {
      console.log('❌ 테스트 로그를 찾을 수 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testManagerLog(); 