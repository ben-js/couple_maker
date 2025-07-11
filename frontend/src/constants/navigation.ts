// 네비게이션 라우트 상수
export const NAVIGATION_ROUTES = {
  // 메인 네비게이션
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  MAIN: 'Main',
  POINT_CHARGE: 'PointCharge',
  
  // 프로필 관련
  PROFILE_EDIT: 'ProfileEdit',
  PREFERENCE_EDIT: 'PreferenceEdit',
  
  // 기타 화면
  USER_DETAIL: 'UserDetail',
  CHAT: 'Chat',
  FILTER: 'Filter',
  SETTINGS: 'Settings',
  MENU: 'Menu',
} as const;

// 탭 네비게이션 상수
export const TAB_ROUTES = {
  MAIN: 'Main',
  PROFILE: 'Profile',
} as const;

// 네비게이션 옵션 상수
export const NAVIGATION_OPTIONS = {
  PROFILE_EDIT: { headerShown: true, title: '프로필 수정' },
  PREFERENCE_EDIT: { headerShown: true, title: '이상형 수정' },
  USER_DETAIL: { headerShown: false },
  CHAT: { headerShown: true, title: '채팅' },
  FILTER: { headerShown: true, title: '필터' },
  SETTINGS: { headerShown: true, title: '설정' },
} as const; 