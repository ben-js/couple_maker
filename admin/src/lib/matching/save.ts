// 추천 결과 저장 함수 (정책 기반)
// aws-sdk를 사용하여 MatchingRecommendations 테이블에 batchWrite
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'MatchingRecommendations';

export async function saveRecommendations(requestId: string, recommendations: any[]): Promise<void> {
  if (!recommendations.length) return;
  const now = new Date().toISOString();
  const putRequests = recommendations.map((rec: any, idx: number) => ({
    PutRequest: {
      Item: {
        request_id: requestId,
        recommended_user_id: rec.user_id,
        recommendation_count: 1, // 최초 추천 시 1, 재추천 시 증가
        compatibility_score: rec.compatibility_score,
        personal_score: rec.score_average, // 예시: 개인 점수
        final_score: rec.compatibility_score, // 정책에 따라 조정 가능
        rank: idx + 1,
        created_at: now,
        updated_at: now,
      },
    },
  }));

  const params = {
    RequestItems: {
      [TABLE_NAME]: putRequests,
    },
  };
  await dynamodb.batchWrite(params).promise();
} 