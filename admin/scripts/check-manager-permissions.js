const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function checkManagerPermissions() {
  try {
    console.log('🔍 매니저 권한 구조 확인 중...\n');

    // 모든 매니저 조회
    const scanCommand = new ScanCommand({
      TableName: 'Managers'
    });

    const response = await docClient.send(scanCommand);
    
    if (response.Items && response.Items.length > 0) {
      console.log(`📊 총 ${response.Items.length}명의 매니저 발견:\n`);
      
      response.Items.forEach((manager, index) => {
        console.log(`👤 매니저 ${index + 1}: ${manager.name} (${manager.email})`);
        console.log(`   역할: ${manager.role}`);
        console.log(`   상태: ${manager.status}`);
        
        if (manager.permissions) {
          console.log('   📋 권한 구조:');
          Object.entries(manager.permissions).forEach(([permission, actions]) => {
            console.log(`      ${permission}:`, actions);
          });
        } else {
          console.log('   ❌ 권한 정보 없음');
        }
        console.log('');
      });
    } else {
      console.log('❌ 매니저가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 환경 변수 설정 (필요한 경우)
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.log('⚠️  AWS 환경 변수가 설정되지 않았습니다.');
  console.log('   .env 파일을 확인하거나 환경 변수를 설정해주세요.');
}

checkManagerPermissions(); 