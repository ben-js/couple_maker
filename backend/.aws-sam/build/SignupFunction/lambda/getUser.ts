import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, camelToSnakeCase } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.pathParameters?.userId || event.headers?.userid;
  
  console.log('getUser Lambda 호출됨:', { userId, event });
  
  try {
    if (!userId) {
      console.log('userId가 없음');
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '사용자 ID가 필요합니다.'
        })
      };
    }

    console.log('DynamoDB 조회 시작:', { userId });
    
    // 사용자 정보와 프로필 정보를 동시에 조회
    const [userResult, profileResult] = await Promise.all([
      ddbDocClient.send(
        new GetCommand({
          TableName: 'Users',
          Key: { user_id: userId }
        })
      ),
      ddbDocClient.send(
        new GetCommand({
          TableName: 'Profiles',
          Key: { user_id: userId }
        })
      )
    ]);

    console.log('DynamoDB 조회 결과:', { userResult, profileResult });

    const user = userResult.Item;
    const profile = profileResult.Item;
    
    if (!user) {
      console.log('사용자를 찾을 수 없음:', { userId });
      return {
        statusCode: 404,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '사용자 정보를 찾을 수 없습니다.'
        })
      };
    }

    // 실제 프로필 데이터가 있는지 확인하여 hasProfile 상태 결정
    const hasProfile = !!profile;
    const hasPreferences = user.has_preferences; // 프로필과 독립적으로 선호도 확인

    console.log('사용자 정보 조회 성공:', { 
      user, 
      hasProfile, 
      hasPreferences,
      profileExists: !!profile 
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        user: {
          userId: user.user_id,
          email: user.email,
          isVerified: user.is_verified,
          hasProfile: hasProfile,
          hasPreferences: hasPreferences,
          grade: user.grade,
          status: user.status,
          points: user.points
        }
      })
    };
  } catch (error: any) {
    console.error('사용자 정보 조회 오류:', error);
    
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({
        success: false,
        message: `서버 오류가 발생했습니다: ${error.message}`
      })
    };
  }
}; 