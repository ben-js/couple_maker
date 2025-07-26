// ScoreHistory 테이블 생성 스크립트
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });

async function createScoreHistoryTable() {
  const params = {
    TableName: 'ScoreHistory',
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'created_at', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'created_at', KeyType: 'RANGE' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  };
  try {
    await client.send(new CreateTableCommand(params));
    console.log('✅ ScoreHistory 테이블 생성 완료!');
  } catch (e) {
    if (e.name === 'ResourceInUseException') {
      console.log('이미 ScoreHistory 테이블이 존재합니다.');
    } else {
      console.error('테이블 생성 오류:', e);
    }
  }
}

createScoreHistoryTable(); 