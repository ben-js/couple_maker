import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 사용자 통계 데이터 조회
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

    const insights = {
      totalMatches: matchesResult.Items?.length || 0,
      totalReviews: reviewsResult.Items?.length || 0,
      totalPoints: pointsResult.Items?.reduce((sum: number, item: any) => sum + (item.points || 0), 0) || 0,
      monthlyStats: {
        matches: matchesResult.Items?.filter((item: any) => {
          const itemDate = new Date(item.created_at);
          const now = new Date();
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }).length || 0,
        reviews: reviewsResult.Items?.filter((item: any) => {
          const itemDate = new Date(item.created_at);
          const now = new Date();
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }).length || 0
      }
    };

    console.log('인사이트 조회 성공:', { userId, insights, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        insights: insights
      })
    };
  } catch (error: any) {
    console.error('인사이트 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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