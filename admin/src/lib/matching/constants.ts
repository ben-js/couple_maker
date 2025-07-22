// 매칭 정책 관련 상수 모음

/** 등급별 점수 매핑 (S~F) */
export const GRADE_SCORE_MAP: Record<string, number> = {
  S: 100,
  A: 90,
  B: 80,
  C: 60,
  D: 40,
  E: 20,
  F: 10,
};

/** 이상형 우선순위별 가중치 (1~4순위) */
export const PRIORITY_WEIGHT = [0.4, 0.3, 0.2, 0.1];

/** 등급 순서 (상위~하위) */
export const GRADE_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

/** 등급별 추천 인원수 */
export const GRADE_RECOMMEND_COUNT = {
  upper: 3, // 상위 등급 추천 인원
  same: 4,  // 동일 등급 추천 인원
  lower: 3, // 하위 등급 추천 인원
}; 