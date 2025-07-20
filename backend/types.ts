// User 테이블 타입
export type User = {
  user_id: string;
  email: string;
  password: string;
  is_verified: boolean;
  has_profile: boolean;
  has_preferences: boolean;
  has_score: boolean;
  grade: 'general' | 'excellent' | 'gold' | 'vip' | 'vvip';
  status: 'green' | 'yellow' | 'red' | 'black';
  is_deleted: boolean;
  deleted_at?: string;
  delete_reason?: string | null;
  points: number;
  created_at: string;
};

// Profile 테이블 타입
export type Profile = {
  user_id: string;
  name: string;
  birth_date: { year: number; month: number; day: number };
  gender: '남' | '여';
  height: string;
  body_type: '슬림' | '평균' | '근육질' | '통통';
  job: string;
  education: '고등학교' | '전문대' | '대학교' | '대학원' | '박사';
  region: { region: string; district: string };
  mbti: string;
  interests: string[];
  favorite_foods: string[];
  smoking: '흡연' | '비흡연';
  drinking: '음주' | '비음주';
  religion: '무교' | '불교' | '천주교' | '기독교' | '기타';
  children_desire: '딩크족 희망' | '자녀 희망' | '상관없음';
  marriage_plans: '1년 내' | '1-2년 내' | '2-3년 내' | '3년 후' | '미정';
  salary: '4천만원 미만' | '4천만원 ~ 5천만원' | '5천만원 ~ 7천만원' | '7천만원 ~ 9천만원' | '1억원 ~ 1억5천만원' | '1억5천만원 ~ 2억원' | '2억원 이상';
  asset: '5천만원 미만' | '5천만원 ~ 1억원' | '1억원 ~ 2억원' | '2억원 ~ 3억원' | '3억원 ~ 5억원' | '5억원 ~ 10억원' | '10억원 ~ 15억원' | '15억원 ~ 20억원' | '20억원 이상';
  introduction: string;
  photos: string[];
};

// Preferences 테이블 타입
export type Preferences = {
  user_id: string;
  age_range: [number, number];
  height_range: [number, number];
  regions: string[];
  job_types: string[];
  education_levels: string[];
  body_types: string[];
  mbti_types: string[];
  interests: string[];
  smoking: '흡연' | '비흡연' | '상관없음';
  drinking: '음주' | '비음주' | '상관없음';
  religion: '무교' | '불교' | '천주교' | '기독교' | '기타' | '상관없음';
  children_desire: '딩크족 희망' | '자녀 희망' | '상관없음';
  marriage_plan: '1년 내' | '1-2년 내' | '2-3년 내' | '3년 후' | '미정';
  salary: '2000만원 미만' | '2000-3000만원' | '3000-5000만원' | '5000-7000만원' | '7000만원 이상';
  asset: '5000만원 미만' | '5000만-1억' | '1억-3억' | '3억-5억' | '5억 이상';
  priority: string[];
};

// Scores 테이블 타입
export type Score = {
  user_id: string;
  scorer: string;
  summary: string;
  average: number;
  appearance: 'A' | 'B' | 'C' | 'D' | 'E';
  personality: 'A' | 'B' | 'C' | 'D' | 'E';
  job: 'A' | 'B' | 'C' | 'D' | 'E';
  education: 'A' | 'B' | 'C' | 'D' | 'E';
  economics: 'A' | 'B' | 'C' | 'D' | 'E';
  created_at: string;
  updated_at: string;
}; 