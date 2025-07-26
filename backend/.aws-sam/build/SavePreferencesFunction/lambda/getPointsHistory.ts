import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 포인트 히스토리 조회
    const historyResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'PointsHistory',
        FilterExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );

    const history = historyResult.Items || [];
    console.log('포인트 히스토리 조회 성공:', { userId, count: history.length, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        history: history
      })
    };
  } catch (error: any) {
    console.error('포인트 히스토리 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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