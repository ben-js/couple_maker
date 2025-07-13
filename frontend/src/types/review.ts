// 후기 도메인 타입 (공식)
export interface ReviewRating {
  appearance: number;
  conversation: number;
  manners: number;
  honesty: number;
}

export interface Review {
  reviewId: string;
  reviewerId: string;
  date?: string;
  createdAt?: string;
  rating: ReviewRating;
  tags?: string[];
  comment: string;
  wantToMeetAgain: boolean;
  // AI 인사이트를 위한 추가 필드들
  overallSatisfaction?: number; // 전체 만족도 (1-5점)
  dateDuration?: string; // 소개팅 지속 시간 (30분 미만, 30분-1시간, 1시간-2시간, 2시간 이상)
  locationSatisfaction?: number; // 장소 만족도 (1-5점)
  conversationInitiative?: string; // 대화 주도성 (나, 상대방, 비슷함)
  firstImpressionVsReality?: string; // 첫인상 vs 실제인상 (더 좋아짐, 비슷함, 실망)
  successFactor?: string; // 소개팅 성공 요인 (대화, 외모, 매너, 장소, 기타)
} 