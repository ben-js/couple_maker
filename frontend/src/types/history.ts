// 히스토리 관련 타입 정의

export interface HistoryItem {
  id: string;
  userId: string;
  partnerId: string;
  status: 'completed' | 'exchanged' | 'finished';
  createdAt: string;
  updatedAt: string;
  userRequest?: any;
  partnerRequest?: any;
  review?: any; // 내가 남긴 후기/평점 정보 추가
  matchPairId?: string;
  match_pair_id?: string;
}

export interface HistoryResponse {
  history: HistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface HistoryFilter {
  status?: 'completed' | 'exchanged' | 'finished';
  dateRange?: {
    start: string;
    end: string;
  };
  contactShared?: boolean;
} 