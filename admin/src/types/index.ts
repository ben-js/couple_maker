// DataService 관련 타입들
export * from './dataService';

// 공통 타입들
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 사용자 상태 타입
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'black' | 'green' | 'yellow' | 'red';

// 사용자 등급 타입
export type UserGrade = 'general' | 'silver' | 'gold' | 'premium' | 'excellent' | 'vip' | 'vvip';

// 매칭 상태 타입
export type MatchingStatus = 'pending' | 'accepted' | 'refused' | 'completed' | 'cancelled';

// 포인트 거래 타입
export type PointTransactionType = 'charge' | 'use' | 'refund' | 'bonus' | 'penalty';

// 리뷰 관련 타입
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

// 매니저 액션 타입
export type ManagerActionType = 
  | 'status_change'
  | 'grade_change'
  | 'matching_approve'
  | 'matching_refused'
  | 'review_delete'
  | 'point_adjust'
  | 'user_delete'
  | 'password_change'
  | 'manager_delete'
  | 'permission_change';

// 토스트 메시지 타입
export type ToastType = 'success' | 'error' | 'warning' | 'info'; 

export interface User {
  user_id: string;
  email: string;
  name?: string;
  status?: string;
  grade?: string;
  created_at?: string;
  updated_at?: string;
  points?: number;
  has_profile?: boolean;
  has_preferences?: boolean;
  is_verified?: boolean;
  is_deleted?: boolean;
  matching_history?: any[];
  reviews_history?: any[];
  point_history?: any[];
  has_score?: boolean; // 점수 작성 여부
  scores?: any[]; // 점수 이력 필드 추가
  // 기타 필요한 필드
} 