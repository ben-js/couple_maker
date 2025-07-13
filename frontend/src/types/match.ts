// 매칭 도메인 타입 (공식)
export interface MatchPair {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'exchanged' | 'cancelled';
  finalDate?: string;
  location?: string;
  photoVisibleAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 매칭 히스토리 타입
export interface MatchingHistory {
  matchPairId: string;
  matchAId: string;
  matchBId: string;
  contactA: string | null;
  contactB: string | null;
  contactExchangedAt: string | null;
  finalStatus: 'finished' | 'exchanged';
  finishedAt: string;
  reviewA: any | null;
  reviewB: any | null;
  requestA: any | null;
  requestB: any | null;
  createdAt: string;
}

export interface MatchDetailData {
  profile?: any;      // 실제 구조에 맞게 추후 상세 타입 지정
  preference?: any;
  status?: string;
  [key: string]: any;
} 