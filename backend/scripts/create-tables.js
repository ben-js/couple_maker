const { DynamoDBClient, CreateTableCommand, DeleteTableCommand } = require('@aws-sdk/client-dynamodb');

const ddbClient = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});

// 테이블 정의
const tables = [
  {
    TableName: 'Users',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
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
  },
  {
    TableName: 'Profiles',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'Preferences',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'MatchingRequests',
    KeySchema: [
      { AttributeName: 'request_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'request_id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user-index',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
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
  },
  {
    TableName: 'MatchPairs',
    KeySchema: [
      { AttributeName: 'match_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'match_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'Proposals',
    KeySchema: [
      { AttributeName: 'proposal_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'proposal_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'Reviews',
    KeySchema: [
      { AttributeName: 'review_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'review_id', AttributeType: 'S' },
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'user-index',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
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
  },
  {
    TableName: 'ReviewStats',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'UserStatusHistory',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'PointHistory',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'MatchingHistory',
    KeySchema: [
      { AttributeName: 'match_pair_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'match_pair_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'NotificationSettings',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'PushTokens',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'device_id', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'device_id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'Scores',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'created_at', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'created_at', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST' // 온디맨드
  },
  {
    TableName: 'ScoreHistory',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'created_at', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'user_id', AttributeType: 'S' },
      { AttributeName: 'created_at', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST' // 온디맨드
  }
];

async function deleteTable(tableName) {
  try {
    console.log(`🗑️  ${tableName} 테이블 삭제 중...`);
    await ddbClient.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`✅ ${tableName} 테이블 삭제 완료`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`ℹ️  ${tableName} 테이블이 이미 존재하지 않습니다.`);
    } else {
      console.error(`❌ ${tableName} 테이블 삭제 실패:`, error.message);
    }
  }
}

async function createTable(tableDefinition) {
  try {
    console.log(`🏗️  ${tableDefinition.TableName} 테이블 생성 중...`);
    await ddbClient.send(new CreateTableCommand(tableDefinition));
    console.log(`✅ ${tableDefinition.TableName} 테이블 생성 완료`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️  ${tableDefinition.TableName} 테이블이 이미 존재합니다.`);
    } else {
      console.error(`❌ ${tableDefinition.TableName} 테이블 생성 실패:`, error.message);
    }
  }
}

async function recreateAllTables() {
  console.log('🚀 테이블 재생성 시작...\n');
  
  // 1. 기존 테이블 삭제
  console.log('=== 기존 테이블 삭제 ===');
  for (const table of tables) {
    await deleteTable(table.TableName);
  }
  
  // 2. 삭제 완료 대기 (DynamoDB 테이블 삭제는 시간이 걸림)
  console.log('\n⏳ 테이블 삭제 완료 대기 중... (30초)');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log('\n=== 새 테이블 생성 ===');
  // 3. 새 테이블 생성
  for (const table of tables) {
    await createTable(table);
  }
  
  console.log('\n🎉 모든 테이블 재생성 완료!');
}

recreateAllTables(); 