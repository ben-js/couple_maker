// 히스토리 관련 타입 정의

export interface HistoryItem {
  userId: string;
  timestamp: string;
  matchPairId: string;
  partnerId: string;
  status: 'completed' | 'exchanged' | 'finished';
  scheduleDate: string;
  dateLocation: string;
  contactShared: boolean;
  bothInterested: boolean;
  reviewSubmitted: boolean;
  pointsUsed: number;
  pointsRefunded: number;
  partner?: {
    name: string;
    age: number;
    location: {
      city: string;
      district: string;
    };
    photos: string[];
  };
  // 추가 상세 정보
  matchAId?: string;
  matchBId?: string;
  isProposed?: boolean;
  confirmProposed?: boolean;
  attemptCount?: number;
  createdAt?: string;
  updatedAt?: string;
  userRequest?: any;
  partnerRequest?: any;
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