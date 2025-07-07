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