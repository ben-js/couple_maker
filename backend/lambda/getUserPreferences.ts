import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const getPreferences = async (event: any) => {
  return await handler(event);
};

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.pathParameters?.userId;
  
  try {
    const preferencesResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Preferences',
        Key: { user_id: userId }
      })
    );

    if (!preferencesResult.Item) {
      console.log('사용자 선호도를 찾을 수 없음:', { userId });
      return {
        statusCode: 404,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '사용자 선호도를 찾을 수 없습니다.'
        })
      };
    }

    const preferences = preferencesResult.Item;
    console.log('사용자 선호도 조회 성공:', { userId, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        preferences: preferences
      })
    };
  } catch (error: any) {
    console.error('사용자 선호도 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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