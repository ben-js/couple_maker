const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');
const config = require('./aws');
const ddbClient = new DynamoDBClient(config);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

async function main() {
  // 1. users 테이블에서 모든 유저 조회
  const usersRes = await ddbDocClient.send(new ScanCommand({
    TableName: 'Users',
    FilterExpression: 'has_profile = :hp AND is_deleted = :del',
    ExpressionAttributeValues: {
      ':hp': true,
      ':del': false
    }
  }));

  const users = usersRes.Items || [];
  const results = [];

  for (const user of users) {
    // 2. profile 조인
    const profileRes = await ddbDocClient.send(new GetCommand({
      TableName: 'Profiles',
      Key: { user_id: user.user_id }
    }));
    const profile = profileRes.Item;
    if (!profile) continue;

    // 3. 남자 제외 (여성만)
    if (profile.gender !== '여') continue;

    // 4. preference 조인
    const prefRes = await ddbDocClient.send(new GetCommand({
      TableName: 'Preferences',
      Key: { user_id: user.user_id }
    }));
    const preference = prefRes.Item;

    // 5. 결과 저장
    results.push({
      user_id: user.user_id,
      email: user.email,
      profile,
      preference
    });
  }

  // 6. 파일로 저장
  const outputPath = path.join(__dirname, 'result_female_users.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`여성 유저 결과가 ${outputPath}에 저장되었습니다. 총 ${results.length}명.`);
}

main(); 