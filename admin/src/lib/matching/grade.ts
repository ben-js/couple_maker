import { UserProfile } from '../../types/matching';
import { GRADE_ORDER, GRADE_RECOMMEND_COUNT } from './scoreMappings';

/**
 * 등급별 후보 분류 및 추천 인원수만큼 추출
 * - 상위/동일/하위 등급별로 분류 후 점수순 정렬, 인원수 제한
 */
export function selectCandidatesByGrade(
  candidates: UserProfile[],
  userGrade: string
): UserProfile[] {
  const userGradeIdx = GRADE_ORDER.indexOf(userGrade);

  // 상위/동일/하위 등급별 분류
  const upper = candidates.filter((c) => GRADE_ORDER.indexOf(c.score.averageGrade) < userGradeIdx);
  const same = candidates.filter((c) => GRADE_ORDER.indexOf(c.score.averageGrade) === userGradeIdx);
  const lower = candidates.filter((c) => GRADE_ORDER.indexOf(c.score.averageGrade) > userGradeIdx);

  // 점수순 정렬 및 인원수 제한
  const upperSorted = upper.sort((a, b) => b.score.average - a.score.average).slice(0, GRADE_RECOMMEND_COUNT.upper);
  const sameSorted = same.sort((a, b) => b.score.average - a.score.average).slice(0, GRADE_RECOMMEND_COUNT.same);
  const lowerSorted = lower.sort((a, b) => b.score.average - a.score.average).slice(0, GRADE_RECOMMEND_COUNT.lower);

  // 합치기
  return [...upperSorted, ...sameSorted, ...lowerSorted];
} 