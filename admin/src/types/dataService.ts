// 매니저 관련 인터페이스
export interface Manager {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
  permissions?: {
    [key: string]: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

// 사용자 관련 인터페이스
export interface User {
  user_id: string;
  email: string;
  status: string;
  grade: string;
  points: number;
  created_at: string;
  updated_at: string;
  has_profile: boolean;
  has_preferences: boolean;
  is_verified: boolean;
  is_deleted: boolean;
  scores?: any; // Scores 테이블의 최신 점수
}

// 매칭 관련 인터페이스
export interface MatchingRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MatchPair {
  match_id: string;
  match_a_id: string;
  match_a_user_id: string;
  match_b_id: string | null;
  match_b_user_id: string;
  is_proposed: boolean;
  confirm_proposed: boolean;
  attempt_count: number;
  both_interested: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MatchingHistory {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 포인트 관련 인터페이스
export interface PointHistory {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

// 사용자 상태 이력 인터페이스
export interface UserStatusHistory {
  id: string;
  user_id: string;
  status: string;
  reason: string;
  created_at: string;
}

// 리뷰 관련 인터페이스
export interface Review {
  id: string;
  user_id: string;
  target_user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// 리뷰 통계 인터페이스
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

// 매니저 로그 인터페이스
export interface ManagerLog {
  id: string;
  manager_id: string;
  action_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

// 대시보드 통계 인터페이스
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalPoints: number;
  totalRevenue: number;
} 