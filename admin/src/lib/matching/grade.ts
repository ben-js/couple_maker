// 등급별 후보군 분류 함수 (정책 기반)
// 실제 등급 산출/상수 포함, 정책 흐름에 맞는 구조

const GRADE_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
const GRADE_RECOMMEND_COUNT = { upper: 3, same: 4, lower: 3 };

function getGradeByScore(score: number): string {
  if (score >= 95) return 'S';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

export function splitCandidatesByGrade(applicant: any, candidates: any[]): { upper: any[]; same: any[]; lower: any[] } {
  // 1. 신청자 평균점수 → 등급 산출
  const applicantGrade = getGradeByScore(applicant.score_average ?? applicant.score?.average);
  const applicantGradeIdx = GRADE_ORDER.indexOf(applicantGrade);

  // 2. 상위/동일/하위 등급별 분리
  const upper = candidates.filter((c: any) => GRADE_ORDER.indexOf(getGradeByScore(c.score?.average)) < applicantGradeIdx);
  const same = candidates.filter((c: any) => GRADE_ORDER.indexOf(getGradeByScore(c.score?.average)) === applicantGradeIdx);
  const lower = candidates.filter((c: any) => GRADE_ORDER.indexOf(getGradeByScore(c.score?.average)) > applicantGradeIdx);

  // 3. 인원수 제한
  return {
    upper: upper.slice(0, GRADE_RECOMMEND_COUNT.upper),
    same: same.slice(0, GRADE_RECOMMEND_COUNT.same),
    lower: lower.slice(0, GRADE_RECOMMEND_COUNT.lower),
  };
} 