const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2'
});

// 테이블 목록 확인 함수
async function listTables() {
  try {
    console.log('=== DynamoDB 테이블 목록 확인 ===');
    
    const listResult = await dynamoClient.send(new ListTablesCommand({}));
    
    console.log('현재 존재하는 테이블들:');
    listResult.TableNames.forEach((tableName, index) => {
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log(`\n총 ${listResult.TableNames.length}개의 테이블이 존재합니다.`);
    
    // 소문자 preferences 테이블이 있는지 확인
    if (listResult.TableNames.includes('preferences')) {
      console.log('\n⚠️  소문자 preferences 테이블이 아직 존재합니다.');
    } else {
      console.log('\n✅ 소문자 preferences 테이블이 성공적으로 삭제되었습니다.');
    }
    
    // 대문자 Preferences 테이블이 있는지 확인
    if (listResult.TableNames.includes('Preferences')) {
      console.log('✅ 대문자 Preferences 테이블이 정상적으로 존재합니다.');
    } else {
      console.log('❌ 대문자 Preferences 테이블이 존재하지 않습니다.');
    }
    
  } catch (error) {
    console.error('테이블 목록 확인 에러:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  listTables()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { listTables }; 