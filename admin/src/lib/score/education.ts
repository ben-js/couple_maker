import { ScoreInput } from '../../types/score';
import { EDUCATION_SCORE_MAP } from './constants';

export function calculateEducationScore(input: ScoreInput): number {
  return EDUCATION_SCORE_MAP[input.education] ?? 50;
} 