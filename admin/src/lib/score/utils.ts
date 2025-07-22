/**
 * 값이 속하는 점수 구간을 찾아 점수를 반환
 * @param value number
 * @param ranges { min: number; max?: number; score: number }[]
 * @returns number
 */
export function getScoreByRange(value: number, ranges: { min: number; max?: number; score: number }[]): number {
  for (const r of ranges) {
    if (r.max !== undefined) {
      if (value >= r.min && value <= r.max) return r.score;
    } else {
      if (value >= r.min) return r.score;
    }
  }
  return ranges[ranges.length - 1].score;
} 