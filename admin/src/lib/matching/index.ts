import { UserProfile, MatchingRequest, Recommendation } from '../../types/matching';
import { filterCandidates } from './filters';
import { selectCandidatesByGrade } from './grade';
import { rankRecommendations } from './rank';

/**
 * 전체 매칭 추천 flow
 * 1. 후보군 필터링
 * 2. 등급별 분류 및 인원 제한
 * 3. 최종 랭킹 산출
 */
export async function getMatchingRecommendations(
  candidates: UserProfile[],
  request: MatchingRequest
): Promise<Recommendation[]> {
  const filtered = filterCandidates(candidates, request);
  const selected = selectCandidatesByGrade(filtered, request.userId);
  return rankRecommendations(selected, request);
} 