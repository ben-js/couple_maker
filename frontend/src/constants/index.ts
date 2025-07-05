// 모든 상수를 한 곳에서 export
export * from './colors';
export * from './typography';
export * from './navigation';
export * from './messages';

// 앱 전체 설정
export const APP_CONFIG = {
  NAME: 'Couple Maker',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  SUPPORT_EMAIL: 'support@couplemaker.com',
  PRIVACY_POLICY_URL: 'https://couplemaker.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://couplemaker.com/terms',
} as const;

// 포인트 정책
export const POINTS_POLICY = {
  SIGNUP_BONUS: 100,
  MATCHING_COST: 100,
  REVIEW_REWARD: 50,
  DAILY_CHECKIN: 10,
  AD_WATCH: 5,
} as const;

// 매칭 상태
export const MATCHING_STATUS = {
  WAITING: 'waiting',
  MATCHING: 'matching',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// 사용자 등급
export const USER_GRADES = {
  GENERAL: 'general',
  EXCELLENT: 'excellent',
  GOLD: 'gold',
  VIP: 'vip',
  VVIP: 'vvip',
} as const;

// 사용자 상태
export const USER_STATUS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  BLACK: 'black',
} as const;

// 성별
export const GENDERS = {
  MALE: '남',
  FEMALE: '여',
} as const;

// 교육 수준
export const EDUCATION_LEVELS = {
  HIGH_SCHOOL: '고등학교',
  COLLEGE: '전문대',
  UNIVERSITY: '대학교',
  GRADUATE: '대학원',
  PHD: '박사',
} as const;

// 체형
export const BODY_TYPES = {
  SLIM: '슬림',
  AVERAGE: '평균',
  MUSCULAR: '근육질',
  CHUBBY: '통통',
} as const;

// 종교
export const RELIGIONS = {
  NONE: '무교',
  BUDDHISM: '불교',
  CATHOLIC: '천주교',
  PROTESTANT: '기독교',
  OTHER: '기타',
} as const;

// 흡연/음주
export const HABITS = {
  YES: '함',
  NO: '안 함',
} as const;

// 혼인 상태
export const MARITAL_STATUS = {
  SINGLE: '미혼',
  DIVORCED: '이혼',
  WIDOWED: '사별',
} as const;

// 자녀 여부
export const CHILDREN_STATUS = {
  NONE: '없음',
  HAS: '있음',
} as const;

// API 엔드포인트
export const API_ENDPOINTS = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  USER_PREFERENCES: '/user-preferences',
  MATCHING_REQUESTS: '/matching-requests',
  MATCH_PAIRS: '/match-pairs',
  REVIEWS: '/reviews',
  REVIEW_STATS: '/review-stats',
  POINTS_HISTORY: '/points-history',
  USER_STATUS: '/user-status',
  CHARGE_POINTS: '/charge-points',
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  ONBOARDING_SHOWN: 'onboarding_shown',
  NOTIFICATION_SETTINGS: 'notification_settings',
  THEME_SETTINGS: 'theme_settings',
} as const;

// 애니메이션 설정
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// 이미지 설정
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  QUALITY: 0.8,
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// 유효성 검사 규칙
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 20,
  BIO_MAX_LENGTH: 500,
} as const; 