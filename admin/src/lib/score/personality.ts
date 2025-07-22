import { ScoreInput } from '../../types/score';
import { getMbtiScore, PERSONALITY_WEIGHT, PERSONALITY_PRIORITY_WEIGHT } from './scoreMappings';

export function calculatePersonalityScore(input: ScoreInput): number {
  // 이상형 우선순위 점수 (성격/가치관)
  // 1순위: 100, 2순위: 90, 3순위: 80, 4순위: 70, 5순위: 60, 6순위: 50
  const priorityScore = (rank: number) => {
    switch (rank) {
      case 1: return 100;
      case 2: return 90;
      case 3: return 80;
      case 4: return 70;
      case 5: return 60;
      case 6: return 50;
      default: return 50;
    }
  };
  const idealScore =
    priorityScore(input.personalityPriority) * PERSONALITY_PRIORITY_WEIGHT.personality +
    priorityScore(input.valuePriority) * PERSONALITY_PRIORITY_WEIGHT.value;

  // 흡연 점수
  const smokingScore = input.isSmoker ? 50 : 100;

  // 취미 점수 (가장 높은 점수 1개만 적용)
  // 봉사활동: 100, 자기계발/독서/산책: 90, 게임: 50, 기타: 80
  let hobbyScore = 80;
  if (input.hobby === '봉사활동') hobbyScore = 100;
  else if (['자기계발', '독서', '산책'].includes(input.hobby)) hobbyScore = 90;
  else if (input.hobby === '게임') hobbyScore = 50;

  // 자녀희망 점수
  const childScore = input.wantChild ? 100 : 70;

  // MBTI 점수
  const mbtiScore = getMbtiScore(input.mbti);

  // 가중치 적용 (이상형, 흡연, 취미, 자녀희망, MBTI)
  return (
    idealScore * PERSONALITY_WEIGHT.ideal +
    smokingScore * PERSONALITY_WEIGHT.smoking +
    hobbyScore * PERSONALITY_WEIGHT.hobby +
    childScore * PERSONALITY_WEIGHT.child +
    mbtiScore * PERSONALITY_WEIGHT.mbti
  );
} 