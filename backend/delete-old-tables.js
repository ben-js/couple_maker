const { DynamoDBClient, DeleteTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// DynamoDB 클라이언트 설정
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-2'
});

// 테이블 삭제 함수
async function deleteOldTables() {
  try {
    console.log('=== 기존 테이블 삭제 시작 ===');
    
    // 1. 현재 존재하는 테이블 목록 확인
    const listResult = await dynamoClient.send(new ListTablesCommand({}));
    console.log('현재 존재하는 테이블들:', listResult.TableNames);
    
    // 2. 소문자 preferences 테이블 삭제
    if (listResult.TableNames.includes('preferences')) {
      try {
        await dynamoClient.send(new DeleteTableCommand({
          TableName: 'preferences'
        }));
        console.log('✅ preferences 테이블 삭제 완료');
      } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('preferences 테이블이 이미 존재하지 않습니다');
        } else {
          console.error('preferences 테이블 삭제 실패:', error);
        }
      }
    } else {
      console.log('preferences 테이블이 존재하지 않습니다');
    }
    
    // 3. 삭제 후 테이블 목록 재확인
    const finalListResult = await dynamoClient.send(new ListTablesCommand({}));
    console.log('\n삭제 후 존재하는 테이블들:', finalListResult.TableNames);
    
    console.log('=== 기존 테이블 삭제 완료 ===');
    
  } catch (error) {
    console.error('테이블 삭제 에러:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  deleteOldTables()
    .then(() => {
      console.log('스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { deleteOldTables }; 