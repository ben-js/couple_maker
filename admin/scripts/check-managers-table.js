const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// AWS 설정
const client = new DynamoDBClient({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: 'AKIAU2GJ5ZJPVVVU5C4W',
    secretAccessKey: '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'
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function checkManagersTable() {
  try {
    console.log('🔍 Managers 테이블 조회 중...');
    
    const command = new ScanCommand({
      TableName: 'Managers'
    });
    
    const response = await docClient.send(command);
    
    console.log('✅ Managers 테이블 조회 성공!');
    console.log(`📊 총 ${response.Items.length}개의 매니저가 있습니다.`);
    
    if (response.Items.length > 0) {
      console.log('\n📋 매니저 목록:');
      response.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. 매니저 정보:`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Email: ${item.email}`);
        console.log(`   Name: ${item.name}`);
        console.log(`   Role: ${item.role}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Created: ${item.created_at}`);
        console.log(`   Password: ${item.password ? '설정됨' : '설정되지 않음'}`);
      });
    } else {
      console.log('❌ 매니저가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ Managers 테이블 조회 실패:', error.message);
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 Managers 테이블이 존재하지 않습니다. 테이블을 먼저 생성해주세요.');
    }
  }
}

checkManagersTable(); 