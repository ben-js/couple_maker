// 점수(Score) 관련 도메인 타입 정의

export type Gender = 'male' | 'female';
export type BodyType = '모델핏' | '운동하는체형' | '보통/마른' | '귀엽고통통한' | '통통한편' | '포근한체형';
export type Job = '판사/검사' | '변호사/의사/교수' | '공기업/교사/연예인' | '회사원/간호사/운동선수/예술가/작가/미용사' | '학생/자영업/요리사' | '기타';
export type Education = '박사' | '대학원' | '대학교' | '전문대' | '고등학교';
export type MBTI = 'ENFJ' | 'INFJ' | 'ESFJ' | 'ENTP' | 'ENTJ' | 'INTJ' | 'ISTP' | 'ESTP' | '기타';

export interface ScoreInput {
  gender: Gender;
  faceScore: number; // 0~100, 매니저 평가
  height: number; // cm
  bodyType: BodyType;
  age: number; // 만나이
  personalityPriority: number; // 1~6
  valuePriority: number; // 1~6
  isSmoker: boolean;
  hobby: string;
  wantChild: boolean;
  mbti: MBTI;
  job: Job;
  salary: number; // 연봉(만원)
  education: Education;
  asset: number; // 자산(만원)
}

export interface ScoreResult {
  appearance: number;
  personality: number;
  job: number;
  education: number;
  economics: number;
  average: number;
  appearanceGrade: string;
  personalityGrade: string;
  jobGrade: string;
  educationGrade: string;
  economicsGrade: string;
  averageGrade: string;
  created_at?: string; // 점수 이력의 생성일
} 