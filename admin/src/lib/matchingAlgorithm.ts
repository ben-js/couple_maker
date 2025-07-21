// 매칭 추천 알고리즘
// 정책 출처: docs/score-policy.md
import { UserProfile, MatchingRequest, Recommendation } from '../types/matching';

// 후보군 필터링 함수 (정책 기반)
export function filterCandidates(
  candidates: UserProfile[],
  request: MatchingRequest
): UserProfile[] {
  // TODO: 정책에 따라 필터링 구현
  return candidates;
}

// 등급별 추천 인원 분배 함수
export function selectCandidatesByGrade(
  candidates: UserProfile[],
  userGrade: string
): UserProfile[] {
  // TODO: 상위/동일/하위 등급별 3/4/3명 추출 구현
  return candidates;
}

// 최종 추천 순위 산정 함수
export function rankRecommendations(
  candidates: UserProfile[],
  request: MatchingRequest
): Recommendation[] {
  // TODO: 이상형 우선순위별 가중치 적용, 점수 산정 및 정렬 구현
  return [];
}

// AWS Personalize 등 외부 추천 시스템 연동 예시
export async function getRecommendationsFromAWS(
  request: MatchingRequest
): Promise<Recommendation[]> {
  // TODO: AWS Personalize API 연동 구현
  return [];
}

// 메인 추천 함수 (내부/외부 알고리즘 선택)
export async function getMatchingRecommendations(
  candidates: UserProfile[],
  request: MatchingRequest,
  useAWS: boolean = false
): Promise<Recommendation[]> {
  if (useAWS) {
    return await getRecommendationsFromAWS(request);
  } else {
    const filtered = filterCandidates(candidates, request);
    const selected = selectCandidatesByGrade(filtered, request.userId);
    return rankRecommendations(selected, request);
  }
} 