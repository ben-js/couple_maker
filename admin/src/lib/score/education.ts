import { ScoreInput } from '../../types/score';
import { getEducationScore } from './scoreMappings';

/**
 * 학력 점수 계산
 * @param input ScoreInput
 * @returns number (0~100)
 */
export function calculateEducationScore(input: ScoreInput): number {
  return getEducationScore(input.education);
} 