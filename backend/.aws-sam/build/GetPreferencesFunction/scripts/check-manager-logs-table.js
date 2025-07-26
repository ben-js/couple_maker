const { DynamoDBClient, DescribeTableCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const AWS_CONFIG = require('../config/aws');

const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

async function checkManagerLogsTable() {
  try {
    console.log('🔍 ManagerLogs 테이블 확인 중...');
    
    // 테이블 존재 여부 확인
    const describeParams = {
      TableName: 'ManagerLogs'
    };
    
    try {
      const describeResult = await client.send(new DescribeTableCommand(describeParams));
      console.log('✅ ManagerLogs 테이블이 존재합니다.');
      console.log('📊 테이블 정보:', {
        TableName: describeResult.Table.TableName,
        ItemCount: describeResult.Table.ItemCount,
        TableStatus: describeResult.Table.TableStatus
      });
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log('❌ ManagerLogs 테이블이 존재하지 않습니다.');
        console.log('📝 테이블을 생성해야 합니다.');
        return;
      } else {
        throw error;
      }
    }
    
    // 테이블 데이터 조회
    console.log('\n📋 ManagerLogs 테이블 데이터 조회 중...');
    const scanParams = {
      TableName: 'ManagerLogs',
      Limit: 10
    };
    
    const scanResult = await dynamodb.send(new ScanCommand(scanParams));
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log(`✅ ${scanResult.Items.length}개의 로그가 있습니다.`);
      console.log('\n📝 최근 로그들:');
      scanResult.Items.forEach((item, index) => {
        console.log(`${index + 1}. [${item.created_at}] ${item.manager_id} - ${item.action_type} - ${item.target_id}`);
        console.log(`   상세: ${item.details}`);
      });
    } else {
      console.log('📭 로그가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkManagerLogsTable(); 