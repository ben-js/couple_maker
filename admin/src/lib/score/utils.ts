import { BodyType } from '../../types/score';
import { BODY_TYPE_SCORE_MAP, MALE_HEIGHT_SCORE_RANGES, FEMALE_HEIGHT_SCORE_RANGES, MALE_AGE_SCORE_RANGES, FEMALE_AGE_SCORE_RANGES } from './constants';

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