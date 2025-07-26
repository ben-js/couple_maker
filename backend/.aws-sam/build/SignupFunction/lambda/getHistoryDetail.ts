import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const { type, id } = event.pathParameters || {};
  
  try {
    let detail;
    
    switch (type) {
      case 'match':
        const matchResult = await ddbDocClient.send(
          new GetCommand({
            TableName: 'MatchPairs',
            Key: { 
              user_id: id.split('_')[0],
              target_user_id: id.split('_')[1]
            }
          })
        );
        detail = matchResult.Item;
        break;
        
      case 'review':
        const reviewResult = await ddbDocClient.send(
          new GetCommand({
            TableName: 'Reviews',
            Key: { review_id: id }
          })
        );
        detail = reviewResult.Item;
        break;
        
      case 'points':
        const pointsResult = await ddbDocClient.send(
          new GetCommand({
            TableName: 'PointsHistory',
            Key: { 
              user_id: id.split('_')[0],
              timestamp: id.split('_')[1]
            }
          })
        );
        detail = pointsResult.Item;
        break;
        
      default:
        console.log('알 수 없는 히스토리 타입:', { type, id });
        return {
          statusCode: 400,
          headers: commonHeaders,
          body: JSON.stringify({
            success: false,
            message: '알 수 없는 히스토리 타입입니다.'
          })
        };
    }

    if (!detail) {
      console.log('히스토리 상세 정보를 찾을 수 없음:', { type, id });
      return {
        statusCode: 404,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '히스토리 상세 정보를 찾을 수 없습니다.'
        })
      };
    }

    console.log('히스토리 상세 조회 성공:', { type, id, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        detail: detail
      })
    };
  } catch (error: any) {
    console.error('히스토리 상세 조회 오류:', { type, id, error: error.message, stack: error.stack });
    
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