const { DynamoDBClient, UpdateTableCommand } = require('@aws-sdk/client-dynamodb');

const ddbClient = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});

async function createEmailIndex() {
  try {
    console.log('email-index GSI 생성 시작...');
    
    const command = new UpdateTableCommand({
      TableName: 'Users',
      AttributeDefinitions: [
        {
          AttributeName: 'email',
          AttributeType: 'S'
        }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'email-index',
            KeySchema: [
              {
                AttributeName: 'email',
                KeyType: 'HASH'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        }
      ]
    });
    
    const result = await ddbClient.send(command);
    console.log('✅ email-index GSI 생성 완료!');
    console.log('결과:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ GSI 생성 실패:', error.message);
    
    if (error.name === 'ResourceInUseException') {
      console.log('이미 GSI가 존재하거나 생성 중입니다.');
    } else if (error.name === 'ResourceNotFoundException') {
      console.log('Users 테이블을 찾을 수 없습니다.');
    }
  }
}

createEmailIndex(); 