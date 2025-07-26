import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 매칭된 쌍 조회
    const matchesResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'MatchPairs',
        FilterExpression: 'user_id = :userId OR target_user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );

    const matches = matchesResult.Items || [];
    console.log('매칭 목록 조회 성공:', { userId, count: matches.length, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        matches: matches
      })
    };
  } catch (error: any) {
    console.error('매칭 목록 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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