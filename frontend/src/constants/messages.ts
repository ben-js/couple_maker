// 토스트 메시지 상수
export const TOAST_MESSAGES = {
  // 프로필 관련
  PROFILE_SAVED: '프로필을 저장합니다.',
  PROFILE_SAVE_FAILED: '프로필 저장 실패: ',
  PROFILE_PHOTO_REQUIRED: '사진을 최소 1장 등록해 주세요.',
  
  // 이상형 관련
  PREFERENCES_SAVED: '이상형을 저장합니다.',
  PREFERENCES_SAVE_FAILED: '이상형 저장 실패: ',
  
  // 인증 관련
  LOGIN_SUCCESS: '로그인 성공',
  LOGIN_FAILED: '로그인 실패',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  
  // 일반
  LOADING: '로딩 중...',
  ERROR_OCCURRED: '오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
} as const;

// 화면 제목 상수
export const SCREEN_TITLES = {
  PROFILE_EDIT: '프로필 수정',
  PREFERENCE_EDIT: '이상형 수정',
  USER_DETAIL: '프로필',
  CHAT: '채팅',
  FILTER: '필터',
  SETTINGS: '설정',
  MAIN: '메인',
  PROFILE: '마이페이지',
} as const;

// 버튼 텍스트 상수
export const BUTTON_TEXTS = {
  START: '시작하기',
  SAVE: '저장',
  CANCEL: '취소',
  CONFIRM: '확인',
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  EDIT_PROFILE: '프로필 수정',
  GO_MAIN: '메인으로',
} as const; 