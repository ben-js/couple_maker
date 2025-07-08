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
} 