import { BodyType } from '../../types/score';

export const BODY_TYPE_SCORE_MAP: Record<BodyType, number> = {
  '모델핏': 100,
  '운동하는체형': 90,
  '보통/마른': 85,
  '귀엽고통통한': 70,
  '통통한편': 60,
  '포근한체형': 50,
};

export const PERSONALITY_WEIGHT = {
  ideal: 0.1,
  smoking: 0.2,
  hobby: 0.35,
  child: 0.15,
  mbti: 0.2,
};

export const PERSONALITY_PRIORITY_WEIGHT = {
  personality: 0.7,
  value: 0.3,
};

export const EDUCATION_SCORE_MAP: Record<string, number> = {
  '박사': 100,
  '대학원': 90,
  '대학교': 80,
  '전문대': 70,
  '고등학교': 50,
};

export const APPEARANCE_WEIGHT = {
  face: 0.5,
  height: 0.2,
  body: 0.15,
  age: 0.15,
};

export const JOB_WEIGHT = {
  job: 0.5,
  salary: 0.3,
  // company: 0.2, // 추후 확장
};

export const TOTAL_SCORE_WEIGHT = {
  appearance: 0.25,
  personality: 0.25,
  job: 0.2,
  education: 0.15,
  economics: 0.15,
};

export const ECONOMICS_WEIGHT = {
  asset: 0.7,
  job: 0.2,
  salary: 0.1,
};

export const MALE_HEIGHT_SCORE_RANGES = [
  { min: 183, max: 192, score: 100 },
  { min: 178, max: 182, score: 90 },
  { min: 193, max: 200, score: 90 },
  { min: 173, max: 177, score: 80 },
  { min: 165, max: 172, score: 70 },
  { min: 155, max: 164, score: 60 },
  { min: 0, max: 154, score: 55 },
];

export const FEMALE_HEIGHT_SCORE_RANGES = [
  { min: 165, max: 168, score: 100 },
  { min: 162, max: 164, score: 90 },
  { min: 169, max: 172, score: 90 },
  { min: 158, max: 161, score: 80 },
  { min: 173, max: 175, score: 80 },
  { min: 155, max: 157, score: 70 },
  { min: 176, max: 300, score: 70 },
  { min: 0, max: 154, score: 55 },
];

export const MALE_AGE_SCORE_RANGES = [
  { min: 28, max: 31, score: 100 },
  { min: 25, max: 27, score: 90 },
  { min: 32, max: 35, score: 90 },
  { min: 36, max: 38, score: 80 },
  { min: 0, max: 24, score: 70 },
  { min: 39, max: 42, score: 70 },
  { min: 43, max: 150, score: 60 },
];

export const FEMALE_AGE_SCORE_RANGES = [
  { min: 23, max: 26, score: 100 },
  { min: 0, max: 21, score: 90 },
  { min: 27, max: 29, score: 90 },
  { min: 30, max: 32, score: 80 },
  { min: 33, max: 35, score: 70 },
  { min: 36, max: 39, score: 60 },
  { min: 40, max: 150, score: 20 },
];

export const MBTI_SCORE_MAP: Record<string, number> = {
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

export const JOB_SCORE_MAP: Record<string, number> = {
  '판사/검사': 100,
  '변호사/의사/교수': 95,
  '공기업/교사/연예인': 90,
  '회사원/간호사/운동선수/예술가/작가/미용사': 80,
  '학생/자영업/요리사': 70,
  '기타': 60,
};

export const ASSET_SCORE_RANGES = [
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

export const SALARY_SCORE_RANGES = [
  { min: 20000, score: 100 },
  { min: 15000, score: 90 },
  { min: 7000, score: 85 },
  { min: 5000, score: 80 },
  { min: 4000, score: 70 },
  { min: 0, score: 60 },
];

export const ECONOMICS_JOB_SCORE_MAP: Record<string, number> = {
  '판사/검사': 100,
  '변호사/의사/교수': 100,
  '공기업/교사/교수': 90,
  '학생': 60,
  '기타': 80,
}; 