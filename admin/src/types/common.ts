// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  grade: 'general' | 'silver' | 'gold' | 'premium' | 'excellent' | 'vip' | 'vvip';
  points: number;
  createdAt: string;
  lastLoginAt?: string;
}

// 매니저 관련 타입
export interface Manager {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'support';
  permissions: Record<string, Record<string, boolean>>;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

// 매칭 관련 타입
export interface Match {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 리뷰 관련 타입
export interface Review {
  id: string;
  userId: string;
  targetUserId: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// 포인트 내역 타입
export interface PointHistory {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

// 관리자 로그 타입
export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'match' | 'review' | 'manager';
  targetId: string;
  details: string;
  createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 필터 타입
export interface Filter {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} 