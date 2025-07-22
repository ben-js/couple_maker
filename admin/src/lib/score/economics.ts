import { getEconomicsJobScore, ASSET_SCORE_RANGES, SALARY_SCORE_RANGES, ECONOMICS_WEIGHT } from './scoreMappings';
import { getScoreByRange } from './utils';

/**
 * 경제력 점수 계산 (자산, 직업, 연봉)
 * @param input { job: string; asset: number; salary: number }
 * @returns number (0~100)
 */
export function calculateEconomicsScore(input: { job: string; asset: number; salary: number }): number {
  const assetScore = getScoreByRange(input.asset, ASSET_SCORE_RANGES);
  const jobScore = getEconomicsJobScore(input.job);
  const salaryScore = getScoreByRange(input.salary, SALARY_SCORE_RANGES);
  return assetScore * ECONOMICS_WEIGHT.asset + jobScore * ECONOMICS_WEIGHT.job + salaryScore * ECONOMICS_WEIGHT.salary;
} 