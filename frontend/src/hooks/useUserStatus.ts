import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/apiUtils';

export function useUserStatus(userId?: string) {
  return useQuery({
    queryKey: ['userStatus', userId],
    queryFn: () => apiGet('/matching-status', { userId }),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
}

export function useUserInfo(userId?: string) {
  return useQuery({
    queryKey: ['userInfo', userId],
    queryFn: () => apiGet(`/user/${userId}`),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
} 