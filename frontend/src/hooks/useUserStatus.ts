import { useQuery } from '@tanstack/react-query';
import { apiGet, apiGetWithAuth } from '@/utils/apiUtils';

export function useUserStatus(userId?: string) {
  return useQuery({
    queryKey: ['userStatus', userId],
    queryFn: () => {
      console.log('useUserStatus 호출:', { userId });
      return apiGet('/matching-status', { userId });
    },
    enabled: false, // 완전히 비활성화 (초기 로드 시 API 호출 방지)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 fresh로 간주 (매우 길게)
    gcTime: 15 * 60 * 1000, // 15분간 캐시 유지 (매우 길게)
    refetchInterval: false, // 자동 refetch 비활성화
    // 초기 로드 시에는 API 호출하지 않음 (로그인 시 이미 가져옴)
    initialData: {
      status: 'none',
      matchId: null,
      hasPendingProposal: false,
      proposalMatchId: null
    }
  });
}

export function useUserInfo(userId?: string) {
  return useQuery({
    queryKey: ['userInfo', userId],
    queryFn: () => {
      if (!userId) throw new Error('userId is required');
      console.log('useUserInfo 호출:', { userId });
      return apiGetWithAuth(`/user/${userId}`, userId);
    },
    enabled: false, // 완전히 비활성화 (초기 로드 시 API 호출 방지)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    staleTime: 10 * 60 * 1000, // 10분 동안 데이터를 fresh로 간주 (매우 길게)
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지 (매우 길게)
    refetchInterval: false, // 자동 refetch 비활성화
    // 초기 로드 시에는 API 호출하지 않음 (로그인 시 이미 가져옴)
    initialData: null
  });
} 