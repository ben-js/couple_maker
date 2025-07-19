import axios from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그인 페이지로 리다이렉트
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 대시보드 통계
export const getDashboardStats = async (): Promise<any> => {
  const response = await api.get<ApiResponse<any>>('/api/dashboard/stats');
  return response.data.data!;
};

// 사용자 목록
export const getUsers = async (page = 1, limit = 10): Promise<PaginatedResponse<any>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<any>>>(`/api/users?page=${page}&limit=${limit}`);
  return response.data.data!;
};

// 사용자 상세
export const getUser = async (id: string): Promise<any> => {
  const response = await api.get<ApiResponse<any>>(`/api/users/${id}`);
  return response.data.data!;
};

// 매칭 목록
export const getMatches = async (page = 1, limit = 10): Promise<PaginatedResponse<any>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<any>>>(`/api/matches?page=${page}&limit=${limit}`);
  return response.data.data!;
};

// 리뷰 목록
export const getReviews = async (page = 1, limit = 10): Promise<PaginatedResponse<any>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<any>>>(`/api/reviews?page=${page}&limit=${limit}`);
  return response.data.data!;
};

// 사용자 비활성화/활성화
export const toggleUserStatus = async (id: string, isActive: boolean): Promise<void> => {
  await api.patch(`/api/users/${id}/status`, { isActive });
};

// 매칭 상태 변경
export const updateMatchStatus = async (id: string, status: string): Promise<void> => {
  await api.patch(`/api/matches/${id}/status`, { status });
};

export default api; 