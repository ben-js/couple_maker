import { ScoreInput, ScoreResult } from '../../types/score';
import { calculateAppearanceScore } from './appearance';
import { calculatePersonalityScore } from './personality';
import { calculateJobScore } from './job';
import { calculateEducationScore } from './education';
import { calculateEconomicsScore } from './economics';
import { TOTAL_SCORE_WEIGHT } from './constants';

export { calculateAppearanceScore, calculatePersonalityScore, calculateJobScore, calculateEducationScore, calculateEconomicsScore };

export function getGrade(score: number): string {
  if (score >= 95) return 'S';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  if (score >= 45) return 'E';
  return 'F';
}

export function calculateTotalScore(input: ScoreInput): ScoreResult {
  const appearance = calculateAppearanceScore(input);
  const personality = calculatePersonalityScore(input);
  const job = calculateJobScore(input);
  const education = calculateEducationScore(input);
  const economics = calculateEconomicsScore(input);
  const average =
    appearance * TOTAL_SCORE_WEIGHT.appearance +
    personality * TOTAL_SCORE_WEIGHT.personality +
    job * TOTAL_SCORE_WEIGHT.job +
    education * TOTAL_SCORE_WEIGHT.education +
    economics * TOTAL_SCORE_WEIGHT.economics;
  return {
    appearance,
    personality,
    job,
    education,
    economics,
    average,
    appearanceGrade: getGrade(appearance),
    personalityGrade: getGrade(personality),
    jobGrade: getGrade(job),
    educationGrade: getGrade(education),
    economicsGrade: getGrade(economics),
    averageGrade: getGrade(average),
  };
} 