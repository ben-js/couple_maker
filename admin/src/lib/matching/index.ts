import { UserProfile, MatchingRequest, Recommendation } from '../../types/matching';
import { filterCandidates } from './filters';
import { selectCandidatesByGrade } from './grade';
import { rankRecommendations } from './rank';

// 메인 추천 함수 (내부 알고리즘만 사용)
export async function getMatchingRecommendations(
  candidates: UserProfile[],
  request: MatchingRequest
): Promise<Recommendation[]> {
  const filtered = filterCandidates(candidates, request);
  const selected = selectCandidatesByGrade(filtered, request.userId);
  return rankRecommendations(selected, request);
} 