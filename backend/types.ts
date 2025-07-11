// Couple Maker Backend 공통 타입 정의 (SOLID 원칙 기반)
// 모든 도메인 타입은 snake_case로 통일, 목적별로 분리/주석 추가

// 사용자(회원) 타입
export interface User {
  user_id: string;
  email: string;
  password: string;
  is_verified: boolean;
  has_profile: boolean;
  has_preferences: boolean;
  grade: 'general' | 'excellent' | 'gold' | 'vip' | 'vvip';
  status: 'green' | 'yellow' | 'red' | 'black';
  points: number;
  created_at: string;
}

// 프로필 타입
export interface UserProfile {
  user_id: string;
  name: string;
  birth_date: { year: number; month: number; day: number };
  gender: '남' | '여';
  height: number;
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
  marital_status: '미혼' | '이혼' | '사별';
  has_children: '없음' | '있음';
  marriage_plans: string;
  introduction: string;
  photos: string[];
}

// 이상형(선호) 타입
export interface UserPreferences {
  user_id: string;
  preferred_gender: string;
  age_range: { min: number; max: number };
  height_range: { min: number; max: number };
  regions: Array<{ region: string; district: string }>;
  locations: string[];
  job_types: string[];
  education_levels: string[];
  body_types: string[];
  mbti_types: string[];
  hobbies: string[];
  personality_tags: string[];
  values_in_life: string[];
  dating_style: string[];
  marriage_plan: string;
  children_desire: string;
  smoking: string;
  drinking: string;
  religion: string;
  preferred_meetup_types: string[];
  priority_fields: string[];
  priority_order: string[];
}

// 매칭 요청 타입
export interface MatchingRequest {
  match_id: string;
  requester_id: string;
  status: 'waiting' | 'propose' | 'matched' | 'confirmed' | 'scheduled' | 'failed';
  created_at: string;
  updated_at: string;
  photo_visible_at?: string | null;
  is_manual?: boolean;
  date_choices?: { dates: string[]; locations: string[] };
}

// 매칭 페어 타입
export interface MatchPair {
  match_pair_id: string;
  match_a_id: string;
  match_b_id: string;
  status: 'waiting' | 'propose' | 'matched' | 'confirmed' | 'scheduled' | 'failed';
  is_manual?: boolean;
  is_proposed?: boolean;
  confirm_proposed?: boolean;
  user_a_choices: { dates: string[]; locations: string[] };
  user_b_choices: { dates: string[]; locations: string[] };
  schedule_date: string | null;
  date_location: string | null;
  created_at: string;
  updated_at: string;
}

// 후기 타입
export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  match_id: string;
  appearance: number;
  conversation: number;
  manner: number;
  sincerity: number;
  want_to_meet_again: boolean;
  positive_tags: string[];
  negative_tags: string[];
  comment: string;
  created_at: string;
}

// 후기 통계 타입
export interface ReviewStats {
  user_id: string;
  average_rating: number;
  total_reviews: number;
  manner_level: '상' | '중' | '하';
  ai_feedback: string;
  conversation_skill: string;
  updated_at: string;
}

// 포인트 히스토리 타입
export interface PointsHistory {
  id: string;
  user_id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  description: string;
  created_at: string;
}

// 사용자 상태 히스토리 타입
export interface UserStatusHistory {
  id: string;
  user_id: string;
  status: 'green' | 'yellow' | 'red' | 'black';
  reason: string;
  admin_note?: string;
  created_at: string;
  expires_at?: string;
}

// API 응답 타입 (제네릭)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 사용자 상태 기록 타입 (handler.ts에서 이동)
export interface UserStatus {
  user_id: string;
  status: string;
  date: string;
} 