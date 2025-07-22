import { JOB_SCORE_PAIRS, getJobScore, SALARY_SCORE_RANGES, JOB_WEIGHT } from './scoreMappings';
import { getScoreByRange } from './utils';

/**
 * 직업 점수 계산 (직업, 연봉)
 * @param input { job: string; salary: number }
 * @returns number (0~100)
 */
export function calculateJobScore(input: { job: string; salary: number }): number {
  const jobScore = getJobScore(input.job);
  const salaryScore = getScoreByRange(input.salary, SALARY_SCORE_RANGES);
  return jobScore * JOB_WEIGHT.job + salaryScore * JOB_WEIGHT.salary;
} 