import { ScoreInput } from '../../types/score';
import { JOB_SCORE_MAP, SALARY_SCORE_RANGES, JOB_WEIGHT } from './constants';

function getScoreByRange(value: number, ranges: { min: number; score: number }[]): number {
  for (const r of ranges) {
    if (value >= r.min) return r.score;
  }
  return ranges[ranges.length - 1].score;
}

export function calculateJobScore(input: ScoreInput): number {
  const jobScore = JOB_SCORE_MAP[input.job] ?? 60;
  const salaryScore = getScoreByRange(input.salary, SALARY_SCORE_RANGES);
  // 직장(회사) 점수는 추후 Company DB 활용 예정이므로 현재는 미반영
  // 가중치 적용 (직업, 연봉)
  return jobScore * JOB_WEIGHT.job + salaryScore * JOB_WEIGHT.salary;
} 