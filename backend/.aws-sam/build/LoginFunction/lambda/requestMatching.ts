import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, camelToSnakeCase } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { userId, targetUserId, message } = req;
  
  try {
    const requestId = `${userId}_${targetUserId}_${Date.now()}`;
    
    const requestData = {
      request_id: requestId,
      user_id: userId,
      target_user_id: targetUserId,
      message: message || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: 'MatchingRequests',
        Item: requestData
      })
    );

    console.log('매칭 요청 성공:', { requestId, userId, targetUserId, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        message: '매칭 요청이 성공적으로 전송되었습니다.',
        requestId: requestId
      })
    };
  } catch (error: any) {
    console.error('매칭 요청 오류:', { userId, targetUserId, error: error.message, stack: error.stack });
    
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