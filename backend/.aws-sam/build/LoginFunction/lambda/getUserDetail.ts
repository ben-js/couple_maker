import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const { userId } = event.pathParameters || {};
  
  try {
    // 사용자 기본 정보 조회
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Users',
        Key: { user_id: userId }
      })
    );

    if (!userResult.Item) {
      console.log('사용자를 찾을 수 없음:', { userId });
      return {
        statusCode: 404,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        })
      };
    }

    // 사용자 프로필 조회
    const profileResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Profiles',
        Key: { user_id: userId }
      })
    );

    const userDetail = {
      user: userResult.Item,
      profile: profileResult.Item || {}
    };

    console.log('사용자 상세 조회 성공:', { userId, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        userDetail: userDetail
      })
    };
  } catch (error: any) {
    console.error('사용자 상세 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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