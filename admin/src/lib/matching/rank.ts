import { UserProfile, MatchingRequest, Recommendation } from '../../types/matching';
import { GRADE_SCORE_MAP, PRIORITY_WEIGHT } from './scoreMappings';

/**
 * 최종 추천 랭킹 산출 함수
 * - 이상형 우선순위 기반 적합도 점수 계산
 * - 개인 점수(average)와 혼합하여 최종 점수 산출
 * - 최종 점수 기준 내림차순 정렬, 동점자 처리(최근 활동일, 가입일)
 */
export function rankRecommendations(
  candidates: UserProfile[],
  request: MatchingRequest
): Recommendation[] {
  // 이상형 우선순위 배열 (예: ['appearance', 'job', ...])
  const priorities: string[] = request.preferences?.priorityOrder || [];

  // 각 후보별 매칭 적합도 점수 계산
  const recommendations = candidates.map((c) => {
    let compatibilityScore = 0;
    priorities.forEach((key, idx) => {
      const grade = c.score[`${key}Grade`] || 'F';
      const gradeScore = GRADE_SCORE_MAP[grade] || 10;
      compatibilityScore += gradeScore * (PRIORITY_WEIGHT[idx] || 0);
    });
    // 개인 점수(average)
    const personalScore = c.score.average;
    // 최종 점수(적합도 70%, 개인 30%)
    const finalScore = compatibilityScore * 0.7 + personalScore * 0.3;
    return {
      userId: c.userId,
      compatibilityScore,
      personalScore,
      finalScore,
      rank: 0, // 임시, 정렬 후 부여
      lastActiveAt: c.lastActiveAt || '',
      createdAt: c.createdAt || '',
    };
  });

  // 최종 점수 기준 내림차순 정렬, 동점자 처리(최근 활동일, 가입일)
  recommendations.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.lastActiveAt !== a.lastActiveAt) return (b.lastActiveAt > a.lastActiveAt ? 1 : -1);
    if (a.createdAt !== b.createdAt) return (a.createdAt > b.createdAt ? 1 : -1);
    return 0;
  });
  recommendations.forEach((rec, idx) => (rec.rank = idx + 1));

  // lastActiveAt, createdAt은 반환에서 제외
  return recommendations.map(({ lastActiveAt, createdAt, ...rest }) => rest);
} 