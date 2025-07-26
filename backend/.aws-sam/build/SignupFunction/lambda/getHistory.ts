import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 사용자 활동 히스토리 조회
    const [matchesResult, reviewsResult, pointsResult] = await Promise.all([
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'MatchPairs',
          FilterExpression: 'user_id = :userId OR target_user_id = :userId',
          ExpressionAttributeValues: { ':userId': userId }
        })
      ),
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'Reviews',
          FilterExpression: 'user_id = :userId OR target_user_id = :userId',
          ExpressionAttributeValues: { ':userId': userId }
        })
      ),
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'PointsHistory',
          FilterExpression: 'user_id = :userId',
          ExpressionAttributeValues: { ':userId': userId }
        })
      )
    ]);

    // 히스토리 데이터 통합 및 정렬
    const history = [
      ...(matchesResult.Items || []).map((item: any) => ({
        ...item,
        type: 'match',
        date: item.created_at
      })),
      ...(reviewsResult.Items || []).map((item: any) => ({
        ...item,
        type: 'review',
        date: item.created_at
      })),
      ...(pointsResult.Items || []).map((item: any) => ({
        ...item,
        type: 'points',
        date: item.timestamp
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('히스토리 조회 성공:', { userId, count: history.length, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        history: history
      })
    };
  } catch (error: any) {
    console.error('히스토리 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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