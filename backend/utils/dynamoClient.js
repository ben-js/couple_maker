const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// AWS DynamoDB 사용 (로컬 환경에서도)
const client = new DynamoDBClient({ 
  region: 'ap-northeast-2'
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

module.exports = ddbDocClient; 