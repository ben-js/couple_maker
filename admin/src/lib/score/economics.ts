import { ScoreInput } from '../../types/score';
import { ASSET_SCORE_RANGES, SALARY_SCORE_RANGES, ECONOMICS_JOB_SCORE_MAP, ECONOMICS_WEIGHT } from './constants';

function getScoreByRange(value: number, ranges: { min: number; score: number }[]): number {
  for (const r of ranges) {
    if (value >= r.min) return r.score;
  }
  return ranges[ranges.length - 1].score;
}

export function calculateEconomicsScore(input: ScoreInput): number {
  // 자산 점수
  const assetScore = getScoreByRange(input.asset, ASSET_SCORE_RANGES);
  // 직업 점수(경제력용)
  const jobScore = ECONOMICS_JOB_SCORE_MAP[input.job] ?? 80;
  // 연봉 점수(경제력용)
  const salaryScore = getScoreByRange(input.salary, SALARY_SCORE_RANGES);
  // 가중치 적용 (자산, 직업, 연봉)
  return assetScore * ECONOMICS_WEIGHT.asset + jobScore * ECONOMICS_WEIGHT.job + salaryScore * ECONOMICS_WEIGHT.salary;
} 