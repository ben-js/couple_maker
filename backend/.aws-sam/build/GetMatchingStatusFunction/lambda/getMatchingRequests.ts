import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    let scanParams: any = {
      TableName: 'MatchingRequests'
    };

    if (userId) {
      scanParams.FilterExpression = 'user_id = :userId OR target_user_id = :userId';
      scanParams.ExpressionAttributeValues = {
        ':userId': userId
      };
    }

    const result = await ddbDocClient.send(new ScanCommand(scanParams));
    
    console.log('매칭 요청 조회 성공:', { userId, count: result.Items?.length, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        requests: result.Items || []
      })
    };
  } catch (error: any) {
    console.error('매칭 요청 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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