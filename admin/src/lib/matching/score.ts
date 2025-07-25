// 우선순위 점수 계산 함수 (정책 기반)
// 정책 상수 포함, 실제 등급 점수/가중치 적용

const GRADE_SCORE_MAP: Record<string, number> = {
  S: 100, A: 90, B: 80, C: 60, D: 40, E: 20, F: 10
};
const PRIORITY_WEIGHT = [0.4, 0.3, 0.2, 0.1]; // 1~4순위

// 점수 → 등급 변환
function getGradeByScore(score: number): string {
  if (score >= 95) return 'S';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

export function scoreCandidates(applicant: any, candidates: any[]): any[] {
  const priorities = applicant.preferences.priority;
  // priorities가 문자열이면 배열로 변환
  const priorityArray = typeof priorities === 'string' ? priorities.split(',').map(p => p.trim()) : priorities;
  return candidates.map((c: any) => {
    let score = 0;
    priorityArray.forEach((key: string, idx: number) => {
      // 후보의 해당 항목 점수 → 등급 변환
      let value = 0;
      switch (key) {
        case '외모': value = c.score?.appearance; break;
        case '직업': value = c.score?.job; break;
        case '성격': value = c.score?.personality; break;
        case '학력': value = c.score?.education; break;
        case '경제력': value = c.score?.economics; break;
        default: value = 0;
      }
      const grade = getGradeByScore(value);
      const gradeScore = GRADE_SCORE_MAP[grade] ?? 0;
      score += gradeScore * (PRIORITY_WEIGHT[idx] || 0);
    });
    return { ...c, compatibility_score: score };
  });
} 