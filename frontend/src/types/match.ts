// 매칭 도메인 타입 (공식)
export interface MatchPair {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  finalDate?: string;
  location?: string;
  photoVisibleAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchDetailData {
  profile?: any;      // 실제 구조에 맞게 추후 상세 타입 지정
  preference?: any;
  status?: string;
  [key: string]: any;
} 