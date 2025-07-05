// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name?: string;
  gender?: '남' | '여';
  birthDate?: string;
  age?: number;
  location?: {
    city: string;
    district: string;
  };
  height?: number;
  bodyType?: '슬림' | '평균' | '근육질' | '통통';
  job?: string;
  education?: '고등학교' | '전문대' | '대학교' | '대학원' | '박사';
  religion?: '무교' | '불교' | '천주교' | '기독교' | '기타';
  smoking?: '흡연' | '비흡연';
  drinking?: '음주' | '비음주';
  mbti?: string;
  bio?: string;
  photos?: string[];
  interests?: string[];
  maritalStatus?: '미혼' | '이혼' | '사별';
  hasChildren?: '없음' | '있음';
  createdAt?: string;
  updatedAt?: string;
  isProfileComplete?: boolean;
  isVerified?: boolean;
  lastActive?: string;
  token?: string;
  hasProfile?: boolean;
  hasPreferences?: boolean;
  grade?: 'general' | 'excellent' | 'gold' | 'vip' | 'vvip';
  status?: 'green' | 'yellow' | 'red' | 'black';
  points?: number;
}

// 사용자 프로필 타입
export interface UserProfile {
  userId: string;
  name: string;
  birthDate: {
    year: number;
    month: number;
    day: number;
  };
  gender: '남' | '여';
  height: number;
  bodyType: '슬림' | '평균' | '근육질' | '통통';
  job: string;
  education: '고등학교' | '전문대' | '대학교' | '대학원' | '박사';
  region: {
    region: string;
    district: string;
  };
  mbti: string;
  interests: string[];
  favoriteFoods: string[];
  smoking: '흡연' | '비흡연';
  drinking: '음주' | '비음주';
  religion: '무교' | '불교' | '천주교' | '기독교' | '기타';
  maritalStatus: '미혼' | '이혼' | '사별';
  hasChildren: '없음' | '있음';
  marriagePlans: string;
  introduction: string;
  photos: string[];
}

// 사용자 이상형 타입
export interface UserPreferences {
  userId: string;
  preferredGender: string;
  ageRange: {
    min: number;
    max: number;
  };
  heightRange: {
    min: number;
    max: number;
  };
  regions: Array<{
    region: string;
    district: string;
  }>;
  locations: string[];
  jobTypes: string[];
  educationLevels: string[];
  bodyTypes: string[];
  mbtiTypes: string[];
  hobbies: string[];
  personalityTags: string[];
  valuesInLife: string[];
  datingStyle: string[];
  marriagePlan: string;
  childrenDesire: string;
  smoking: string;
  drinking: string;
  religion: string;
  preferredMeetupTypes: string[];
  priorityFields: string[];
  priorityOrder: string[];
}

// 매칭 요청 타입
export interface MatchingRequest {
  id: string;
  userId: string;
  status: 'waiting' | 'matching' | 'confirmed' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// 매칭 페어 타입
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

// 후기 타입
export interface Review {
  id: string;
  reviewerId: string;
  reviewedId: string;
  matchId: string;
  appearance: number;
  conversation: number;
  manner: number;
  sincerity: number;
  wantToMeetAgain: boolean;
  positiveTags: string[];
  negativeTags: string[];
  comment: string;
  createdAt: string;
}

// 후기 통계 타입
export interface ReviewStats {
  userId: string;
  averageRating: number;
  totalReviews: number;
  mannerLevel: '상' | '중' | '하';
  aiFeedback: string;
  conversationSkill: string;
  updatedAt: string;
}

// 포인트 히스토리 타입
export interface PointsHistory {
  id: string;
  userId: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  description: string;
  createdAt: string;
}

// 사용자 상태 히스토리 타입
export interface UserStatusHistory {
  id: string;
  userId: string;
  status: 'green' | 'yellow' | 'red' | 'black';
  reason: string;
  adminNote?: string;
  createdAt: string;
  expiresAt?: string;
}

// 인증 상태 타입
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 네비게이션 타입
export interface RootStackParamList {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Main: { screen?: string } | undefined;
  ProfileEdit: { isEditMode?: boolean } | undefined;
  PreferenceEdit: { isEditMode?: boolean } | undefined;
  UserDetail: { userId: string } | undefined;
  Chat: { matchId: string } | undefined;
  Filter: undefined;
  Settings: undefined;
}

// 매칭 관련 타입
export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user: User;
  matchedUser: User;
}

// 좋아요 관련 타입
export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'like' | 'super_like';
  createdAt: string;
  fromUser: User;
  toUser: User;
}

// 채팅 관련 타입
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'sticker';
  isRead: boolean;
  createdAt: string;
  sender: User;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  participantsData: User[];
}

// 필터 관련 타입
export interface FilterOptions {
  ageRange: [number, number];
  heightRange: [number, number];
  location: string[];
  bodyType: string[];
  job: string[];
  education: string[];
  religion: string[];
  smoking: string[];
  drinking: string[];
  mbti: string[];
  interests: string[];
  hasChildren?: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type MainTabParamList = {
  Home: undefined;
  Tips: undefined;
  Cards: undefined;
  Reviews: undefined;
  Menu: undefined;
};

// 앱 설정 타입
export interface AppSettings {
  notifications: {
    newMatches: boolean;
    messages: boolean;
    likes: boolean;
    superLikes: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastActive: boolean;
    showDistance: boolean;
  };
  preferences: {
    maxDistance: number;
    ageRange: [number, number];
    showMen: boolean;
    showWomen: boolean;
  };
} 