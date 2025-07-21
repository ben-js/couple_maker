// 점수 및 등급 산정 알고리즘
// 정책 출처: docs/score-policy.md
import { ScoreInput, ScoreResult, BodyType } from '../types/score';

function getHeightScore(gender: string, height: number): number {
  if (gender === 'male') {
    if (height >= 183 && height <= 192) return 100;
    if ((height >= 178 && height <= 182) || (height >= 193 && height <= 200)) return 90;
    if (height >= 173 && height <= 177) return 80;
    if (height >= 165 && height <= 172) return 70;
    if (height >= 155 && height <= 164) return 60;
    if (height < 155) return 55;
  } else {
    if (height >= 165 && height <= 168) return 100;
    if ((height >= 162 && height <= 164) || (height >= 169 && height <= 172)) return 90;
    if ((height >= 158 && height <= 161) || (height >= 173 && height <= 175)) return 80;
    if ((height >= 155 && height <= 157) || height >= 176) return 70;
    if (height < 154) return 55;
  }
  return 60; // 기본값(정책상 해당 없음)
}

const JOB_SCORE_MAP: Record<string, number> = {
  '판사/검사': 100,
  '변호사/의사/교수': 95,
  '공기업/교사/연예인': 90,
  '회사원/간호사/운동선수/예술가/작가/미용사': 80,
  '학생/자영업/요리사': 70,
  '기타': 60,
};

const BODY_TYPE_SCORE_MAP: Record<BodyType, number> = {
  '모델핏': 100,
  '운동하는체형': 90,
  '보통/마른': 85,
  '귀엽고통통한': 70,
  '통통한편': 60,
  '포근한체형': 50,
};

const MBTI_SCORE_MAP: Record<string, number> = {
  'ENFJ': 100,
  'INFJ': 95,
  'ESFJ': 90,
  'ENTP': 70,
  'ENTJ': 70,
  'INTJ': 70,
  'ISTP': 60,
  'ESTP': 60,
  '기타': 80,
};

function getBodyTypeScore(bodyType: BodyType): number {
  return BODY_TYPE_SCORE_MAP[bodyType] ?? 60;
}

function getAgeScore(gender: string, age: number): number {
  if (gender === 'male') {
    if (age >= 28 && age <= 31) return 100;
    if ((age >= 25 && age <= 27) || (age >= 32 && age <= 35)) return 90;
    if (age >= 36 && age <= 38) return 80;
    if (age < 25 || (age >= 39 && age <= 42)) return 70;
    if (age >= 43) return 60;
  } else {
    if (age >= 23 && age <= 26) return 100;
    if (age < 22 || (age >= 27 && age <= 29)) return 90;
    if (age >= 30 && age <= 32) return 80;
    if (age >= 33 && age <= 35) return 70;
    if (age >= 36 && age <= 39) return 60;
    if (age >= 40) return 20;
  }
  return 60; // 기본값(정책상 해당 없음)
}

const EDUCATION_SCORE_MAP: Record<string, number> = {
  '박사': 100,
  '대학원': 90,
  '대학교': 80,
  '전문대': 70,
  '고등학교': 50,
};

export function calculateEducationScore(input: ScoreInput): number {
  return EDUCATION_SCORE_MAP[input.education] ?? 50;
}

const SALARY_SCORE_RANGES = [
  { min: 20000, score: 100 },
  { min: 15000, score: 90 },
  { min: 7000, score: 85 },
  { min: 5000, score: 80 },
  { min: 4000, score: 70 },
  { min: 0, score: 60 },
];

const ASSET_SCORE_RANGES = [
  { min: 200000, score: 100 },
  { min: 150000, score: 95 },
  { min: 100000, score: 90 },
  { min: 50000, score: 85 },
  { min: 30000, score: 80 },
  { min: 20000, score: 75 },
  { min: 10000, score: 75 },
  { min: 5000, score: 60 },
  { min: 0, score: 20 },
];

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
  // 가중치 적용 (직업 50%, 연봉 30%, 직장 20% → 현재 직장 0%)
  return jobScore * 0.5 + salaryScore * 0.3;
}

const ECONOMICS_JOB_SCORE_MAP: Record<string, number> = {
  '판사/검사': 100,
  '변호사/의사/교수': 100,
  '공기업/교사/교수': 90,
  '학생': 60,
  '기타': 80,
};

export function calculateEconomicsScore(input: ScoreInput): number {
  // 자산 점수
  const assetScore = getScoreByRange(input.asset, ASSET_SCORE_RANGES);
  // 직업 점수(경제력용)
  const jobScore = ECONOMICS_JOB_SCORE_MAP[input.job] ?? 80;
  // 연봉 점수(경제력용)
  const salaryScore = getScoreByRange(input.salary, SALARY_SCORE_RANGES);
  // 가중치 적용 (자산 70%, 직업 20%, 연봉 10%)
  return assetScore * 0.7 + jobScore * 0.2 + salaryScore * 0.1;
}

export function calculateAppearanceScore(input: ScoreInput): number {
  const face = input.faceScore; // 0~100, 매니저 평가
  const height = getHeightScore(input.gender, input.height);
  const body = getBodyTypeScore(input.bodyType);
  const age = getAgeScore(input.gender, input.age);
  // 가중치 적용
  return (
    face * 0.5 +
    height * 0.2 +
    body * 0.15 +
    age * 0.15
  );
}

export function calculatePersonalityScore(input: ScoreInput): number {
  // 이상형 우선순위 점수 (성격/가치관)
  // 기본 가중치: 성격 70%, 가치관 30%
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
  const idealScore = priorityScore(input.personalityPriority) * 0.7 + priorityScore(input.valuePriority) * 0.3;

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
  const mbtiScore = MBTI_SCORE_MAP[input.mbti] ?? 80;

  // 가중치 적용 (이상형 10%, 흡연 20%, 취미 35%, 자녀희망 15%, MBTI 20%)
  return (
    idealScore * 0.1 +
    smokingScore * 0.2 +
    hobbyScore * 0.35 +
    childScore * 0.15 +
    mbtiScore * 0.2
  );
}

// 등급 산정 함수
export function getGrade(score: number): string {
  if (score >= 95) return 'S';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  if (score >= 45) return 'E';
  return 'F';
}

// 전체 점수 및 등급 산정
export function calculateTotalScore(input: ScoreInput): ScoreResult {
  const appearance = calculateAppearanceScore(input);
  const personality = calculatePersonalityScore(input);
  const job = calculateJobScore(input);
  const education = calculateEducationScore(input);
  const economics = calculateEconomicsScore(input);
  const average =
    appearance * 0.25 +
    personality * 0.25 +
    job * 0.2 +
    education * 0.15 +
    economics * 0.15;
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