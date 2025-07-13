import { apiGet } from '@/utils/apiUtils';
import { HistoryResponse, HistoryFilter } from '@/types';

export const getHistory = async (
  userId: string, 
  page: number = 1, 
  pageSize: number = 10,
  filters?: HistoryFilter
): Promise<HistoryResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  // 필터 적용
  if (filters?.status) {
    queryParams.append('status', filters.status);
  }
  if (filters?.contactShared !== undefined) {
    queryParams.append('contactShared', filters.contactShared.toString());
  }
  if (filters?.dateRange) {
    queryParams.append('startDate', filters.dateRange.start);
    queryParams.append('endDate', filters.dateRange.end);
  }

  const response = await apiGet(`/history/${userId}?${queryParams.toString()}`, undefined, userId);
  return response;
}; 