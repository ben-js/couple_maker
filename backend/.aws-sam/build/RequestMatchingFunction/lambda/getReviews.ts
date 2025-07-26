import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 리뷰 목록 조회
    const reviewsResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Reviews',
        FilterExpression: 'user_id = :userId OR target_user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );

    const reviews = reviewsResult.Items || [];
    console.log('리뷰 목록 조회 성공:', { userId, count: reviews.length, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        reviews: reviews
      })
    };
  } catch (error: any) {
    console.error('리뷰 목록 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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