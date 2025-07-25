// user1@test.com, user2@test.com을 제외하고 모든 테스트 유저들을 삭제하는 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

// 보존할 유저 ID들
const PRESERVE_USER_IDS = [
  '1bc37de4-ead1-4881-b8d3-2f6ac9637d63', // user1@test.com
  'c92c0d21-3176-4203-b0ff-77bcc453bb34'  // user2@test.com
];

async function deleteTestUsersExceptMain() {
  try {
    console.log('🗑️ user1@test.com, user2@test.com을 제외한 모든 테스트 유저 삭제 시작...');
    
    // 1. Users 테이블에서 테스트 유저들 삭제 (보존 유저 제외)
    console.log('🔍 Users 테이블에서 삭제할 유저들 검색 중...');
    const usersResult = await dynamodb.send(new ScanCommand({
      TableName: 'Users'
    }));

    const usersToDelete = usersResult.Items.filter(user => 
      !PRESERVE_USER_IDS.includes(user.user_id) && 
      (user.email.includes('test.com') || user.user_id.startsWith('test_user_'))
    );

    console.log(`📧 삭제할 테스트 유저 ${usersToDelete.length}명 발견`);
    
    for (const user of usersToDelete) {
      console.log(`🗑️ Users 테이블에서 삭제: ${user.email} (${user.user_id})`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Users',
        Key: { user_id: user.user_id }
      }));
    }

    // 2. Profiles 테이블에서 테스트 유저들 삭제
    console.log('🔍 Profiles 테이블에서 삭제할 유저들 검색 중...');
    const profilesResult = await dynamodb.send(new ScanCommand({
      TableName: 'Profiles'
    }));

    const profilesToDelete = profilesResult.Items.filter(profile => 
      profile && profile.user_id && !PRESERVE_USER_IDS.includes(profile.user_id) && 
      (profile.email && profile.email.includes('test.com') || profile.user_id.startsWith('test_user_'))
    );

    console.log(`📧 삭제할 테스트 프로필 ${profilesToDelete.length}명 발견`);
    
    for (const profile of profilesToDelete) {
      console.log(`🗑️ Profiles 테이블에서 삭제: ${profile.email} (${profile.user_id})`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Profiles',
        Key: { user_id: profile.user_id }
      }));
    }

    // 3. Preferences 테이블에서 테스트 유저들 삭제
    console.log('🔍 Preferences 테이블에서 삭제할 유저들 검색 중...');
    const preferencesResult = await dynamodb.send(new ScanCommand({
      TableName: 'Preferences'
    }));

    const preferencesToDelete = preferencesResult.Items.filter(preference => 
      preference && preference.user_id && !PRESERVE_USER_IDS.includes(preference.user_id) && 
      (preference.email && preference.email.includes('test.com') || preference.user_id.startsWith('test_user_'))
    );

    console.log(`📧 삭제할 테스트 선호도 ${preferencesToDelete.length}명 발견`);
    
    for (const preference of preferencesToDelete) {
      console.log(`🗑️ Preferences 테이블에서 삭제: ${preference.email} (${preference.user_id})`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Preferences',
        Key: { user_id: preference.user_id }
      }));
    }

    // 4. Scores 테이블에서 테스트 유저들 삭제
    console.log('🔍 Scores 테이블에서 삭제할 유저들 검색 중...');
    const scoresResult = await dynamodb.send(new ScanCommand({
      TableName: 'Scores'
    }));

    const scoresToDelete = scoresResult.Items.filter(score => 
      score && score.user_id && !PRESERVE_USER_IDS.includes(score.user_id) && 
      score.user_id.startsWith('test_user_')
    );

    console.log(`📊 삭제할 테스트 점수 ${scoresToDelete.length}명 발견`);
    
    for (const score of scoresToDelete) {
      console.log(`🗑️ Scores 테이블에서 삭제: ${score.user_id}`);
      await dynamodb.send(new DeleteCommand({
        TableName: 'Scores',
        Key: { 
          user_id: score.user_id,
          created_at: score.created_at
        }
      }));
    }

    console.log('✅ 테스트 유저들 삭제 완료!');
    console.log(`📊 삭제된 유저 수: ${usersToDelete.length}명`);
    console.log(`🔒 보존된 유저: user1@test.com, user2@test.com`);
    
  } catch (error) {
    console.error('❌ 삭제 중 에러 발생:', error);
  }
}

deleteTestUsersExceptMain().catch(console.error); 