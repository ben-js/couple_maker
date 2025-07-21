// 매칭/추천 관련 도메인 타입 정의
import { ScoreResult } from './score';

export interface UserProfile {
  userId: string;
  gender: 'male' | 'female';
  age: number;
  region: string;
  height: number;
  status: string;
  isDeleted: boolean;
  hasScore: boolean;
  score: ScoreResult;
  lastActiveAt?: string; // 동점자 처리용
  createdAt?: string;    // 동점자 처리용
  // ... 기타 필드
}

export interface MatchingRequest {
  requestId: string;
  userId: string;
  preferences: any; // 이상형 조건 등
  // ... 기타 필드
}

export interface Recommendation {
  userId: string;
  compatibilityScore: number;
  personalScore: number;
  finalScore: number;
  rank: number;
} 