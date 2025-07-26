// 실제 회사들의 공통 서비스 분리 패턴

// 1. Netflix 스타일 - 마이크로서비스
const netflixServices = {
  auth: {
    login: async (credentials) => { /* 공통 인증 로직 */ },
    verifyToken: async (token) => { /* 토큰 검증 */ },
    refreshToken: async (refreshToken) => { /* 토큰 갱신 */ }
  },
  
  notification: {
    sendEmail: async (to, subject, content) => { /* 이메일 발송 */ },
    sendSMS: async (to, message) => { /* SMS 발송 */ },
    sendPush: async (userId, notification) => { /* 푸시 알림 */ }
  },
  
  logging: {
    info: (message, metadata) => { /* 정보 로그 */ },
    error: (error, context) => { /* 에러 로그 */ },
    audit: (action, userId, details) => { /* 감사 로그 */ }
  }
};

// 2. Airbnb 스타일 - 서버리스 함수
const airbnbServices = {
  auth: {
    login: async (email, password) => { /* Lambda 함수 호출 */ },
    register: async (userData) => { /* 회원가입 */ },
    forgotPassword: async (email) => { /* 비밀번호 재설정 */ }
  },
  
  user: {
    getProfile: async (userId) => { /* 프로필 조회 */ },
    updateProfile: async (userId, data) => { /* 프로필 업데이트 */ },
    deleteAccount: async (userId) => { /* 계정 삭제 */ }
  }
};

// 3. 우리 프로젝트 스타일 - 하이브리드
const dateSenseServices = {
  auth: require('./authService'),
  user: require('./userService'),
  profile: require('./profileService'),
  preference: require('./preferenceService'),
  matching: require('./matchingService'),
  s3: require('./s3Service')
};

module.exports = {
  netflixServices,
  airbnbServices,
  dateSenseServices
}; 