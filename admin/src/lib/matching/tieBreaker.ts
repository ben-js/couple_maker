// 동점자 처리 및 정렬 함수 (정책 기반)
// compatibility_score 내림차순, 동점자는 가입일 오름차순
export function rankAndSelect(candidates: any[], count: number): any[] {
  return candidates
    .sort((a, b) => {
      if (b.compatibility_score !== a.compatibility_score) {
        return b.compatibility_score - a.compatibility_score;
      }
      // 동점자 tie-breaker: 가입일 오름차순
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .slice(0, count);
} 