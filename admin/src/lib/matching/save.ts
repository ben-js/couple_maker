// 추천 결과 저장 함수 (정책 기반)
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from '../dataService';

export async function saveRecommendations(requestId: string, recommendations: any[], append: boolean = false): Promise<void> {
  const now = new Date().toISOString();
  if (!recommendations.length) return;

  // 기존 추천 조회 (직접 DynamoDB 접근)
  let existingRecommendations = new Map<string, any>();
  if (append) {
    try {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: 'MatchingRecommendations',
          KeyConditionExpression: 'request_id = :rid',
          ExpressionAttributeValues: { ':rid': requestId },
        })
      );
      existingRecommendations = new Map(
        (result.Items || []).map((item: any) => [item.recommended_user_id, item])
      );
    } catch (error) {
      console.error('Error getting existing recommendations:', error);
    }
  }

  // 기존 추천 중 가장 큰 recommendation_count와 rank 구하기
  let maxRecommendationCount = 0;
  let maxRank = 0;
  existingRecommendations.forEach((rec) => {
    if (rec.recommendation_count > maxRecommendationCount) {
      maxRecommendationCount = rec.recommendation_count;
    }
    if (rec.rank > maxRank) {
      maxRank = rec.rank;
    }
  });
  const nextBatchCount = maxRecommendationCount + 1;
  const nextRankStart = maxRank + 1;

  // 새로운 추천 처리
  const newRecommendations = recommendations
    .filter((rec: any) => !existingRecommendations.has(rec.user_id))
    .map((rec: any, idx: number) => {
      const recommendationCount = nextBatchCount;
      const compatibilityScore = rec.compatibility_score;
      if (compatibilityScore === undefined || compatibilityScore === null) {
        console.warn(`⚠️ compatibility_score가 없는 추천 데이터:`, {
          user_id: rec.user_id,
          request_id: requestId,
          has_score_average: rec.score_average !== undefined,
          rec_keys: Object.keys(rec)
        });
      }
      // 순서를 반영한 timestamp 생성 (인덱스를 더해서 순서 보장)
      const orderTimestamp = new Date(now);
      orderTimestamp.setMilliseconds(orderTimestamp.getMilliseconds() + idx);
      const microSeconds = idx * 1000;
      orderTimestamp.setTime(orderTimestamp.getTime() + microSeconds);
      return {
        request_id: requestId,
        recommended_user_id: rec.user_id,
        recommendation_count: recommendationCount,
        personal_score: rec.score_average,
        compatibility_score: compatibilityScore ?? null,
        rank: nextRankStart + idx,
        grade: rec.grade,
        created_at: orderTimestamp.toISOString(),
        updated_at: orderTimestamp.toISOString(),
      };
    });

  if (!newRecommendations.length) {
    console.log(`⚠️ 저장할 추천이 없습니다.`);
    return;
  }

  // 추천 저장 (직접 DynamoDB 접근)
  for (const rec of newRecommendations) {
    try {
      await dynamodb.send(
        new PutCommand({
          TableName: 'MatchingRecommendations',
          Item: rec
        })
      );
    } catch (error) {
      console.error('Error saving recommendation:', error, rec);
    }
  }
} 