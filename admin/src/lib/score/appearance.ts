import { ScoreInput, BodyType } from '../../types/score';
import { MALE_HEIGHT_SCORE_RANGES, FEMALE_HEIGHT_SCORE_RANGES, BODY_TYPE_SCORE_MAP, MALE_AGE_SCORE_RANGES, FEMALE_AGE_SCORE_RANGES, APPEARANCE_WEIGHT } from './constants';
import { getScoreByRange } from './utils';

function getHeightScore(gender: string, height: number): number {
  const ranges = gender === 'male' ? MALE_HEIGHT_SCORE_RANGES : FEMALE_HEIGHT_SCORE_RANGES;
  return getScoreByRange(height, ranges);
}

function getBodyTypeScore(bodyType: BodyType): number {
  return BODY_TYPE_SCORE_MAP[bodyType] ?? 60;
}

function getAgeScore(gender: string, age: number): number {
  const ranges = gender === 'male' ? MALE_AGE_SCORE_RANGES : FEMALE_AGE_SCORE_RANGES;
  return getScoreByRange(age, ranges);
}

export function calculateAppearanceScore(input: ScoreInput): number {
  const face = input.faceScore; // 0~100, 매니저 평가
  const height = getHeightScore(input.gender, input.height);
  const body = getBodyTypeScore(input.bodyType);
  const age = getAgeScore(input.gender, input.age);
  // 가중치 적용
  return (
    face * APPEARANCE_WEIGHT.face +
    height * APPEARANCE_WEIGHT.height +
    body * APPEARANCE_WEIGHT.body +
    age * APPEARANCE_WEIGHT.age
  );
} 