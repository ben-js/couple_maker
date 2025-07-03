// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  age: number;
  location: {
    city: string;
    district: string;
  };
  height: number;
  bodyType: 'slim' | 'normal' | 'athletic' | 'chubby' | 'curvy';
  job: string;
  education: 'high_school' | 'college' | 'bachelor' | 'master' | 'phd';
  religion: 'none' | 'christian' | 'buddhist' | 'catholic' | 'other';
  smoking: 'yes' | 'no' | 'sometimes';
  drinking: 'yes' | 'no' | 'sometimes';
  mbti: string;
  bio: string;
  photos: string[];
  interests: string[];
  maritalStatus: 'single' | 'divorced' | 'widowed';
  hasChildren: boolean;
  createdAt: string;
  updatedAt: string;
  isProfileComplete: boolean;
  isVerified: boolean;
  lastActive: string;
  token?: string;
  hasProfile?: boolean;
  hasPreferences?: boolean;
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

// 네비게이션 타입
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Signup: undefined;
  Main: undefined;
  ProfileSetup: undefined;
  ProfileEdit: undefined;
  UserDetail: { userId: string };
  Chat: { chatId: string; otherUser: User };
  Filter: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Matches: undefined;
  Chat: undefined;
  Profile: undefined;
};

// 인증 관련 타입
export interface AuthState {
  user: User | null;
  token?: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

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

export type UserPreferences = {
  user_id: string;
  preferred_gender: string;
  age_range: { min: number; max: number };
  height_range: { min: number; max: number };
  locations: string[];
  job_types: string[];
  education_levels: string[];
  body_types: string[];
  mbti_types: string[];
  hobbies: string[];
  personality_tags: string[];
  values_in_life: string[];
  dating_style: string[];
  marriage_plan: string;
  children_desire: boolean;
  smoking: boolean;
  drinking: string;
  religion: string;
  preferred_meetup_types: string[];
  priority_fields: string[];
  priority_order: string[];
}; 