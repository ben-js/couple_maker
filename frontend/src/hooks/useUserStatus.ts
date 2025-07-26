import { useQuery } from '@tanstack/react-query';
import { apiGet, apiGetWithAuth } from '@/utils/apiUtils';

export function useUserStatus(userId?: string) {
  return useQuery({
    queryKey: ['userStatus', userId],
    queryFn: () => {
      console.log('useUserStatus 호출:', { userId });
      return apiGet('/matching-status', { userId });
    },
    enabled: !!userId, // userId가 있을 때만 활성화
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 fresh로 간주
    gcTime: 15 * 60 * 1000, // 15분간 캐시 유지
    refetchInterval: false, // 자동 refetch 비활성화
    // 초기 데이터 제공 (pending proposal 정보 포함)
    initialData: {
      status: 'none',
      requestId: null,
      matchId: null,
      hasPendingProposal: false,
      proposalMatchId: null,
      matchedUser: null,
      otherUserChoices: null,
      finalDate: null,
      finalLocation: null,
      dateAddress: null,
      review: null,
      contactReady: false,
      bothReviewed: false
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
    enabled: !!userId, // userId가 있을 때만 활성화
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
    staleTime: 10 * 60 * 1000, // 10분 동안 데이터를 fresh로 간주
    gcTime: 30 * 60 * 1000, // 30분간 캐시 유지
    refetchInterval: false, // 자동 refetch 비활성화
    // 초기 데이터 제공
    initialData: null
  });
} 