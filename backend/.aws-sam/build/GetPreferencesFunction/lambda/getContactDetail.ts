import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const { userId, targetUserId } = event.pathParameters || {};
  
  try {
    // 매칭 쌍 조회
    const matchResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'MatchPairs',
        Key: { 
          user_id: userId,
          target_user_id: targetUserId
        }
      })
    );

    if (!matchResult.Item) {
      console.log('매칭 정보를 찾을 수 없음:', { userId, targetUserId });
      return {
        statusCode: 404,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '매칭 정보를 찾을 수 없습니다.'
        })
      };
    }

    // 상대방 프로필 조회
    const profileResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Profiles',
        Key: { user_id: targetUserId }
      })
    );

    const contactDetail = {
      match: matchResult.Item,
      profile: profileResult.Item || {}
    };

    console.log('연락처 상세 조회 성공:', { userId, targetUserId, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        contactDetail: contactDetail
      })
    };
  } catch (error: any) {
    console.error('연락처 상세 조회 오류:', { userId, targetUserId, error: error.message, stack: error.stack });
    
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    };
  }
}; 