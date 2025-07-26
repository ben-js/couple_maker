const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const ddbClient = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});

const managerLogsTable = {
  TableName: 'ManagerLogs',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'manager_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' },
    { AttributeName: 'action_type', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'ManagerIndex',
      KeySchema: [
        { AttributeName: 'manager_id', KeyType: 'HASH' },
        { AttributeName: 'created_at', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'TimeIndex',
      KeySchema: [
        { AttributeName: 'created_at', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'ActionIndex',
      KeySchema: [
        { AttributeName: 'action_type', KeyType: 'HASH' },
        { AttributeName: 'created_at', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

async function createManagerLogsTable() {
  try {
    console.log('🏗️  ManagerLogs 테이블 생성 중...');
    await ddbClient.send(new CreateTableCommand(managerLogsTable));
    console.log('✅ ManagerLogs 테이블 생성 완료');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  ManagerLogs 테이블이 이미 존재합니다.');
    } else {
      console.error('❌ ManagerLogs 테이블 생성 실패:', error.message);
    }
  }
}

createManagerLogsTable().catch(console.error); 