// 등급별 후보군 분류 함수 (정책 기반)
// 실제 등급 산출/상수 포함, 정책 흐름에 맞는 구조

const GRADE_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
const GRADE_RECOMMEND_COUNT = { upper: 3, same: 4, lower: 3 };

export function getGradeByScore(score: number): string {
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

  // 3. 인원수 제한 및 부족한 인원 보충
  const targetTotal = GRADE_RECOMMEND_COUNT.upper + GRADE_RECOMMEND_COUNT.same + GRADE_RECOMMEND_COUNT.lower; // 10명
  
  let resultUpper = upper.slice(0, GRADE_RECOMMEND_COUNT.upper);
  let resultSame = same.slice(0, GRADE_RECOMMEND_COUNT.same);
  let resultLower = lower.slice(0, GRADE_RECOMMEND_COUNT.lower);
  
  // 4. 부족한 인원을 다른 등급에서 보충
  const currentTotal = resultUpper.length + resultSame.length + resultLower.length;
  const remaining = targetTotal - currentTotal;
  
  console.log(`📊 등급별 분류 상세:`, {
    applicantGrade,
    applicantGradeIdx,
    upper: { total: upper.length, selected: resultUpper.length, target: GRADE_RECOMMEND_COUNT.upper },
    same: { total: same.length, selected: resultSame.length, target: GRADE_RECOMMEND_COUNT.same },
    lower: { total: lower.length, selected: resultLower.length, target: GRADE_RECOMMEND_COUNT.lower },
    currentTotal,
    targetTotal,
    remaining
  });
  
  if (remaining > 0) {
    // 남은 후보들을 점수 순으로 정렬
    const remainingCandidates = [
      ...upper.slice(GRADE_RECOMMEND_COUNT.upper),
      ...same.slice(GRADE_RECOMMEND_COUNT.same),
      ...lower.slice(GRADE_RECOMMEND_COUNT.lower)
    ].sort((a, b) => (b.score?.average || 0) - (a.score?.average || 0));
    
    console.log(`🔄 보충 후보: ${remainingCandidates.length}명 (${remaining}명 필요)`);
    
    // 부족한 만큼 추가
    const additional = remainingCandidates.slice(0, remaining);
    
    // 추가된 후보들을 적절한 그룹에 분배
    additional.forEach(candidate => {
      const candidateGrade = getGradeByScore(candidate.score?.average);
      const candidateGradeIdx = GRADE_ORDER.indexOf(candidateGrade);
      
      if (candidateGradeIdx < applicantGradeIdx && resultUpper.length < GRADE_RECOMMEND_COUNT.upper) {
        resultUpper.push(candidate);
        console.log(`➕ ${candidate.user_id} → upper 그룹 추가 (${candidateGrade})`);
      } else if (candidateGradeIdx === applicantGradeIdx && resultSame.length < GRADE_RECOMMEND_COUNT.same) {
        resultSame.push(candidate);
        console.log(`➕ ${candidate.user_id} → same 그룹 추가 (${candidateGrade})`);
      } else if (candidateGradeIdx > applicantGradeIdx && resultLower.length < GRADE_RECOMMEND_COUNT.lower) {
        resultLower.push(candidate);
        console.log(`➕ ${candidate.user_id} → lower 그룹 추가 (${candidateGrade})`);
      } else {
        // 어느 그룹에도 들어갈 수 없으면 same 그룹에 추가
        if (resultSame.length < GRADE_RECOMMEND_COUNT.same) {
          resultSame.push(candidate);
          console.log(`➕ ${candidate.user_id} → same 그룹 추가 (fallback, ${candidateGrade})`);
        } else {
          console.log(`❌ ${candidate.user_id} → 모든 그룹이 가득 참 (${candidateGrade})`);
        }
      }
    });
  }

  console.log(`📊 등급별 분류 결과:`, {
    applicantGrade,
    upper: resultUpper.length,
    same: resultSame.length,
    lower: resultLower.length,
    total: resultUpper.length + resultSame.length + resultLower.length
  });

  return {
    upper: resultUpper,
    same: resultSame,
    lower: resultLower,
  };
} 