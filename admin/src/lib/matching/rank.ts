import { UserProfile, MatchingRequest, Recommendation } from '../../types/matching';
import { GRADE_SCORE_MAP, PRIORITY_WEIGHT } from './constants';

// 최종 추천 순위 산정 함수
export function rankRecommendations(
  candidates: UserProfile[],
  request: MatchingRequest
): Recommendation[] {
  // 이상형 우선순위 배열 (예: ['appearance', 'job', 'personality', 'education'])
  const priorities: string[] = request.preferences?.priorityOrder || [];

  // 각 후보별 매칭 점수 계산
  const recommendations = candidates.map((c) => {
    let compatibilityScore = 0;
    priorities.forEach((key, idx) => {
      const grade = c.score[`${key}Grade`] || 'F';
      const gradeScore = GRADE_SCORE_MAP[grade] || 10;
      compatibilityScore += gradeScore * (PRIORITY_WEIGHT[idx] || 0);
    });
    // 개인 점수(average)
    const personalScore = c.score.average;
    // 최종 점수(호환성 70%, 개인 30%)
    const finalScore = compatibilityScore * 0.7 + personalScore * 0.3;
    return {
      userId: c.userId,
      compatibilityScore,
      personalScore,
      finalScore,
      rank: 0, // 임시, 정렬 후 부여
      lastActiveAt: c.lastActiveAt || '', // 동점자 처리용
      createdAt: c.createdAt || '', // 동점자 처리용
    };
  });

  // finalScore 기준 내림차순 정렬, 동점자 처리(최근 활동일, 가입일 순)
  recommendations.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    // 동점자: 최근 활동일 우선
    if (b.lastActiveAt !== a.lastActiveAt) return (b.lastActiveAt > a.lastActiveAt ? 1 : -1);
    // 그래도 동점: 가입일 빠른 순
    if (a.createdAt !== b.createdAt) return (a.createdAt > b.createdAt ? 1 : -1);
    return 0;
  });
  recommendations.forEach((rec, idx) => (rec.rank = idx + 1));

  // lastActiveAt, createdAt은 반환에서 제외(불필요시)
  return recommendations.map(({ lastActiveAt, createdAt, ...rest }) => rest);
} 