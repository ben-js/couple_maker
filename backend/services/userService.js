const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const ddbDocClient = require('../utils/dynamoClient');

async function getUser(user_id) {
  const result = await ddbDocClient.send(
    new GetCommand({
      TableName: 'users',
      Key: { user_id }
    })
  );
  return result.Item;
}

module.exports = { getUser }; 