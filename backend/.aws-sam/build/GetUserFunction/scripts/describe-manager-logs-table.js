const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });

async function describeManagerLogsTable() {
  try {
    console.log('🔍 ManagerLogs 테이블 스키마 확인 중...');
    
    const result = await client.send(new DescribeTableCommand({
      TableName: 'ManagerLogs'
    }));
    
    console.log('📊 테이블 정보:');
    console.log('  TableName:', result.Table.TableName);
    console.log('  TableStatus:', result.Table.TableStatus);
    console.log('  ItemCount:', result.Table.ItemCount);
    
    console.log('\n🔑 키 스키마:');
    result.Table.KeySchema.forEach(key => {
      console.log(`  ${key.AttributeName} (${key.KeyType})`);
    });
    
    console.log('\n📝 속성 정의:');
    result.Table.AttributeDefinitions.forEach(attr => {
      console.log(`  ${attr.AttributeName}: ${attr.AttributeType}`);
    });
    
    if (result.Table.GlobalSecondaryIndexes) {
      console.log('\n🌐 글로벌 보조 인덱스:');
      result.Table.GlobalSecondaryIndexes.forEach((gsi, index) => {
        console.log(`  ${index + 1}. ${gsi.IndexName}`);
        console.log(`     키 스키마:`);
        gsi.KeySchema.forEach(key => {
          console.log(`       ${key.AttributeName} (${key.KeyType})`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

describeManagerLogsTable(); 