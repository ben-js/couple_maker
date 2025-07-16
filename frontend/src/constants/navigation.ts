// 네비게이션 라우트 상수
export const NAVIGATION_ROUTES = {
  // 메인 네비게이션
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  EMAIL_VERIFICATION: 'EmailVerification',
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
  REVIEW_WRITE: 'ReviewWrite',
  CONTACT_DETAIL: 'ContactDetail',
} as const;

// 탭 네비게이션 상수
export const TAB_ROUTES = {
  MAIN: 'Main',
  PROFILE: 'Profile',
} as const;
