import { MatchingRequest, Recommendation } from '../../types/matching';

/**
 * AWS Personalize 등 외부 추천 시스템 연동 예시
 * 실제 구현 필요 (현재는 빈 배열 반환)
 */
export async function getRecommendationsFromAWS(
  request: MatchingRequest
): Promise<Recommendation[]> {
  // TODO: AWS Personalize API 연동 구현
  return [];
} 