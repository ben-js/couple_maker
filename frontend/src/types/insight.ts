export interface InsightCard {
  id: string;
  title: string;
  description: string;
  isLocked: boolean;
  sample?: string;
  data?: InsightData;
}

export interface InsightData {
  totalMatches?: number;
  successRate?: number;
  averageRating?: number;
  favoriteRegion?: string;
  dominantStyle?: string;
  feedback?: string;
  totalReviews?: number;
  successfulMatches?: number;
}

export interface InsightResponse {
  userId: string;
  totalMatches: number;
  successfulMatches: number;
  successRate: number;
  averageRating: number;
  favoriteRegion: string;
  dominantStyle: string;
  insightCards: InsightCard[];
} 