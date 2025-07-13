// 더미 데이터
// User 타입을 email 기반으로 통일
// 회원가입/로그인 모두 email, password만 사용

// 탈퇴 회원 관리 정책
// - status: "black"은 블랙리스트(제재)만 의미, 탈퇴는 is_deleted로 구분
// - is_deleted: true면 모든 서비스 이용 불가, 개인정보는 일정 기간 후 삭제/익명화
// - 탈퇴 이력은 UserStatusHistory에 기록
// - 탈퇴 시 포인트는 소멸, 연락처 공유 불가

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { camelToSnakeCase, snakeToCamelCase } from './utils/caseUtils';
import { User, UserProfile, UserPreferences, MatchingRequest, MatchPair, Review, ReviewStats, UserStatusHistory, PointsHistory, ApiResponse } from './types';
import { UserStatus } from './types';

const usersPath = path.join(__dirname, 'data/users.json');
const profilesPath = path.join(__dirname, 'data/profiles.json');
const preferencesPath = path.join(__dirname, 'data/preferences.json');
const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
const proposePath = path.join(__dirname, 'data/propose.json');
const reviewsPath = path.join(__dirname, 'data/reviews.json');
const reviewStatsPath = path.join(__dirname, 'data/review-stats.json');
const userStatusHistoryPath = path.join(__dirname, 'data/user-status-history.json');
const pointsHistoryPath = path.join(__dirname, 'data/points-history.json');
const logsPath = path.join(__dirname, 'data/logs.json');
const termsPath = path.join(__dirname, 'data/terms.json');
const privacyPath = path.join(__dirname, 'data/privacy.json');
const customerServicePath = path.join(__dirname, 'data/customer-service.json');

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 날짜별 로그 파일 생성 함수
function getLogFileName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.json`;
}

function getLogFilePath(date: Date = new Date()): string {
  const fileName = getLogFileName(date);
  return path.join(__dirname, 'logs', fileName);
}

// 로그 디렉토리 생성
function ensureLogDirectory() {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

async function appendLog({ 
  type, 
  userId = '', 
  email = '', 
  ip = '', 
  hasProfile = false, 
  hasPreferences = false, 
  result = '', 
  message = '', 
  detail = {},
  userAgent = '',
  requestMethod = '',
  requestPath = '',
  requestBody = '',
  responseStatus = 0,
  responseBody = '',
  errorStack = '',
  executionTime = 0,
  sessionId = '',
  action = '',
  screen = '',
  component = ''
}: {
  type: string;
  userId?: string;
  email?: string;
  ip?: string;
  hasProfile?: boolean;
  hasPreferences?: boolean;
  result?: string;
  message?: string;
  detail?: any;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  requestBody?: string;
  responseStatus?: number;
  responseBody?: string;
  errorStack?: string;
  executionTime?: number;
  sessionId?: string;
  action?: string;
  screen?: string;
  component?: string;
}) {  
  ensureLogDirectory();
  
  const timestamp = new Date();
  const logEntry = {
    // 기본 식별 정보
    logId: uuidv4(),
    timestamp: timestamp.toISOString(),
    date: timestamp.toISOString().split('T')[0],
    time: timestamp.toISOString().split('T')[1].split('.')[0],
    
    // 사용자 정보
    userId,
    email,
    sessionId,
    
    // 요청 정보
    requestMethod,
    requestPath,
    requestBody: requestBody.length > 1000 ? requestBody.substring(0, 1000) + '...' : requestBody,
    userAgent,
    ip,
    
    // 응답 정보
    responseStatus,
    responseBody: responseBody.length > 1000 ? responseBody.substring(0, 1000) + '...' : responseBody,
    
    // 앱 상태
    hasProfile,
    hasPreferences,
    
    // 액션 정보
    type,
    action,
    screen,
    component,
    
    // 결과 정보
    result,
    message,
    errorStack,
    executionTime,
    
    // 상세 데이터
    detail: typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail,
    
    // 분석용 태그
    tags: {
      isError: result === 'fail' || responseStatus >= 400,
      isSuccess: result === 'success' && responseStatus < 400,
      isUserAction: ['login', 'signup', 'profile_save', 'preferences_save'].includes(type),
      isSystemAction: ['api_call', 'error'].includes(type)
    }
  };

  const logFilePath = getLogFilePath();
  
  try {
    // 기존 로그 파일 읽기
    let logs = [];
    if (fs.existsSync(logFilePath)) {
      try {
        const fileContent = fs.readFileSync(logFilePath, 'utf-8');
        logs = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('Log file parse error, starting fresh:', parseError);
        logs = [];
      }
    }
    
    // 새 로그 추가
    logs.push(logEntry);
    
    // 파일에 저장
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    
    // 콘솔에도 출력 (개발용)
    const logLevel = logEntry.tags.isError ? 'ERROR' : logEntry.tags.isSuccess ? 'SUCCESS' : 'INFO';
    console.log(`${logLevel} [${logEntry.type}] ${logEntry.action || logEntry.message} - User: ${logEntry.userId} - Time: ${logEntry.executionTime}ms`);
    console.log('appendLog called:', logEntry); // 디버깅용
  } catch (error) {
    console.error('Log write error:', error);
  }
}

export const hello = async (event: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello from Serverless Framework!',
        input: event,
      },
      null,
      2
    ),
  };
};

// 회원가입
export const signup = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { email, password } = req;
  const users: User[] = readJson(usersPath);
  const user_id = `user-${users.length + 1}`;
  const newUser: User = {
    user_id,
    email,
    password, // 실제로는 해시화해야 함
    is_verified: false,
    has_profile: false,
    has_preferences: false,
    grade: 'general',
    status: 'green',
    points: 100, // 회원가입 시 기본 100 지급
    created_at: new Date().toISOString()
  };
  users.push(newUser);
  writeJson(usersPath, users);
  await appendLog({
    type: 'signup',
    userId: user_id,
    email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: {},
  });
  return { statusCode: 201, body: JSON.stringify(snakeToCamelCase(newUser)) };
};

// 로그인
export const login = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { email, password } = req;
  const startTime = Date.now();
  const sessionId = uuidv4();
  
  console.log('\n=== 🔐 로그인 API 호출됨 ===');
  console.log('시간:', new Date().toISOString());
  console.log('🌐 요청 경로:', event.requestContext?.http?.path || 'unknown');
  console.log('📋 요청 메서드:', event.requestContext?.http?.method || 'unknown');
  console.log('📦 원본 요청 바디:', event.body);
  console.log('🔧 파싱된 요청:', req);
  
  try {
    console.log('📧 로그인 시도:', { email, password: password ? '***' : 'empty' });
    
    const users: User[] = readJson(usersPath);
    console.log('👥 등록된 사용자 수:', users.length);
    console.log('👥 등록된 사용자들:', users.map(u => ({ email: u.email, has_profile: u.has_profile })));
    
    const user = users.find(u => u.email === email && u.password === password);
    const ip = event?.requestContext?.identity?.sourceIp || '';
    
    console.log('🔍 사용자 검색 결과:', user ? '찾음' : '찾지 못함');
    if (!user) {
      console.log('❌ 이메일 매칭 실패:', users.some(u => u.email === email));
      console.log('❌ 비밀번호 매칭 실패:', users.some(u => u.password === password));
      const executionTime = Date.now() - startTime;
      const errorMessage = '잘못된 이메일 또는 비밀번호';
      const responseBody = JSON.stringify({ 
        error: 'Invalid credentials', 
        input: { email, password: password ? '***' : 'empty' } 
      });

      console.log('❌ 로그인 실패: 사용자를 찾을 수 없음');
      
      await appendLog({
        type: 'login',
        userId: '',
        email,
        ip,
        result: 'fail',
        message: errorMessage,
        detail: {
          reason: 'invalid_credentials',
          attemptedEmail: email,
          userExists: users.some(u => u.email === email),
          totalUsers: users.length
        },
        requestMethod: event.requestContext?.http?.method || 'POST',
        requestPath: event.requestContext?.http?.path || '/login',
        requestBody: JSON.stringify({ email, password: '***' }),
        responseStatus: 401,
        responseBody,
        executionTime,
        sessionId,
        action: '로그인 시도',
        screen: 'AuthScreen',
        component: 'login'
      });
      
      return { statusCode: 401, body: responseBody };
    }
    
    const profiles: UserProfile[] = readJson(profilesPath);
    const preferences: UserPreferences[] = readJson(preferencesPath);
    const hasProfile = user.has_profile;
    const hasPreferences = user.has_preferences;
    
    // 프로필에서 사용자 이름 가져오기
    const userProfile = profiles.find(p => p.user_id === user.user_id);
    const userName = userProfile?.name || '사용자';
    
    console.log('✅ 로그인 성공:');
    console.log('   - User ID:', user.user_id);
    console.log('   - Email:', user.email);
    console.log('   - Name:', userName);
    console.log('   - Has Profile:', hasProfile);
    console.log('   - Has Preferences:', hasPreferences);
    console.log('   - Profile count:', profiles.length);
    console.log('   - Preferences count:', preferences.length);
    
    const executionTime = Date.now() - startTime;
    
    // 기본 사용자 정보
    const userResponse: any = {
      user_id: user.user_id,
      email: user.email,
      hasProfile,
      hasPreferences,
      isVerified: user.is_verified,
      grade: user.grade,
      status: user.status,
      points: user.points
    };
    
    // 프로필이 있으면 이름도 포함
    if (hasProfile && userProfile) {
      userResponse.name = userProfile.name;
    }
    
    const responseBody = JSON.stringify(snakeToCamelCase(userResponse));

    await appendLog({
      type: 'login',
      userId: user.user_id,
      email: user.email,
      ip,
      hasProfile,
      hasPreferences,
      result: 'success',
      message: '로그인 성공',
      detail: {
        userProfileCount: profiles.length,
        userPreferencesCount: preferences.length,
        userProfileExists: profiles.some(p => p.user_id === user.user_id),
        userPreferencesExists: preferences.some(p => p.user_id === user.user_id)
      },
      requestMethod: event.requestContext?.http?.method || 'POST',
      requestPath: event.requestContext?.http?.path || '/login',
      requestBody: JSON.stringify({ email, password: '***' }),
      responseStatus: 200,
      responseBody,
      executionTime,
      sessionId,
      action: '로그인 성공',
      screen: 'AuthScreen',
      component: 'login'
    });
    
    return {
      statusCode: 200,
      body: responseBody
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = `로그인 처리 중 오류: ${error.message}`;
    const responseBody = JSON.stringify({ 
      error: 'Login processing error', 
      message: error.message 
    });

    console.error('로그인 처리 중 에러 발생:', error);
    console.error('에러 스택:', error.stack);

    await appendLog({
      type: 'login',
      userId: '',
      email: '',
      ip: event?.requestContext?.identity?.sourceIp || '',
      result: 'fail',
      message: errorMessage,
      detail: {
        errorType: error.constructor.name,
        errorMessage: error.message
      },
      requestMethod: event.requestContext?.http?.method || 'POST',
      requestPath: event.requestContext?.http?.path || '/login',
      requestBody: event.body || '',
      responseStatus: 500,
      responseBody,
      errorStack: error.stack,
      executionTime,
      sessionId,
      action: '로그인 시도',
      screen: 'AuthScreen',
      component: 'login'
    });

    return { 
      statusCode: 500, 
      body: responseBody
    };
  }
};

// 프로필 저장
export const saveProfile = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { user_id, ...profile } = req;
  const profiles: UserProfile[] = readJson(profilesPath);
  const idx = profiles.findIndex(p => p.user_id === user_id);
  if (idx >= 0) profiles[idx] = { user_id, ...profile };
  else profiles.push({ user_id, ...profile });
  writeJson(profilesPath, profiles);

  // users.json의 has_profile true로 변경
  const users = readJson(usersPath);
  const userIdx = users.findIndex((u: any) => u.user_id === user_id);
  let email = '';
  if (userIdx >= 0) {
    users[userIdx].has_profile = true;
    email = users[userIdx].email;
    writeJson(usersPath, users);
  }

  await appendLog({
    type: 'profile_save',
    userId: user_id,
    email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: { profile, photosUpdated: profile.photos ? true : false },
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// 이상형 저장
export const saveUserPreferences = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { user_id, ...prefs } = req;
  const startTime = Date.now();
  const sessionId = uuidv4();
  
  console.log('\n=== 🎯 이상형 저장 API 호출됨 ===');
  console.log('시간:', new Date().toISOString());
  console.log('🌐 요청 경로:', event.requestContext?.http?.path || 'unknown');
  console.log('📋 요청 메서드:', event.requestContext?.http?.method || 'unknown');
  console.log('원본 Event body:');
  console.log('Event 전체:', JSON.stringify(event, null, 2));
  
  try {
    console.log('✅ 파싱된 데이터:');
    console.log('   - userId:', user_id);
    console.log('   - userId 타입:', typeof user_id);
    console.log('   - preferences:', JSON.stringify(prefs, null, 2));
    console.log('   - preferences 키들:', Object.keys(prefs));
    
    if (!user_id) {
      console.error('❌ userId가 없습니다');
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing userId' }) 
      };
    }
    
    const preferences: UserPreferences[] = readJson(preferencesPath);
    console.log('📁 기존 preferences.json 내용:', preferences);
    
    const idx = preferences.findIndex(p => p.user_id === user_id);
    if (idx >= 0) {
      preferences[idx] = { user_id, ...prefs };
      console.log('🔄 기존 사용자 데이터 업데이트 (인덱스:', idx, ')');
    } else {
      preferences.push({ user_id, ...prefs });
      console.log('➕ 새 사용자 데이터 추가');
    }
    
    writeJson(preferencesPath, preferences);
    console.log('💾 preferences.json 저장 완료');
    console.log('📁 저장된 preferences.json 내용:', preferences);

    // users.json의 has_preferences true로 변경
    const users = readJson(usersPath);
    console.log('👥 기존 users.json 내용:', users);
    
    const userIdx = users.findIndex((u: any) => u.user_id === user_id);
    let email = '';
    if (userIdx >= 0) {
      users[userIdx].has_preferences = true;
      email = users[userIdx].email;
      writeJson(usersPath, users);
      console.log('✅ users.json 업데이트 완료 - has_preferences: true');
      console.log('✅ 업데이트된 사용자:', users[userIdx]);
    } else {
      console.log('❌ 사용자를 찾을 수 없음:', user_id);
    }

    const executionTime = Date.now() - startTime;
    const responseBody = JSON.stringify({ ok: true });

    await appendLog({
      type: 'preferences_save',
      userId: user_id,
      email,
      ip: event?.requestContext?.identity?.sourceIp || '',
      result: 'success',
      message: '이상형 저장 성공',
      detail: { 
        preferencesCount: preferences.length,
        updatedUserIndex: userIdx,
        hasPreferencesUpdated: userIdx >= 0,
        preferencesData: prefs
      },
      requestMethod: event.requestContext?.http?.method || 'POST',
      requestPath: event.requestContext?.http?.path || '/user-preferences',
      requestBody: event.body || '',
      responseStatus: 200,
      responseBody,
      executionTime,
      sessionId,
      action: '이상형 저장',
      screen: 'PreferenceSetupScreen',
      component: 'saveUserPreferences'
    });

    console.log('🎉 === 이상형 저장 완료 ===\n');
    return { statusCode: 200, body: responseBody };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = `이상형 저장 실패: ${error.message}`;
    const responseBody = JSON.stringify({ 
      error: '이상형 저장 실패', 
      message: error.message 
    });

    console.error('이상형 저장 중 에러 발생:', error);
    console.error('에러 스택:', error.stack);

    await appendLog({
      type: 'preferences_save',
      userId: '',
      email: '',
      ip: event?.requestContext?.identity?.sourceIp || '',
      result: 'fail',
      message: errorMessage,
      detail: { 
        errorType: error.constructor.name,
        errorMessage: error.message
      },
      requestMethod: event.requestContext?.http?.method || 'POST',
      requestPath: event.requestContext?.http?.path || '/user-preferences',
      requestBody: event.body || '',
      responseStatus: 500,
      responseBody,
      errorStack: error.stack,
      executionTime,
      sessionId,
      action: '이상형 저장',
      screen: 'PreferenceSetupScreen',
      component: 'saveUserPreferences'
    });

    return { 
      statusCode: 500, 
      body: responseBody
    };
  }
};

// 프로필 조회
function getBaseUrl(event: any) {
  const host = event.headers?.['host'] || event.requestContext?.domainName || 'localhost:3000';
  const protocol = event.headers?.['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}`;
}

export const getProfile = async (event: any) => {
  const { userId } = event.pathParameters || {};
  console.log('프로필 조회 요청:', { userId, path: event.requestContext?.http?.path });
  const profiles: UserProfile[] = readJson(profilesPath);
  const users: User[] = readJson(usersPath);
  const profile = profiles.find(p => p.user_id === userId);
  const user = users.find(u => u.user_id === userId);
  if (profile) {
    const baseUrl = getBaseUrl(event);
    // matching-requests에서 일정/장소, 확정 일정 정보 가져오기
    const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
    const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
    const myRequest = matchingRequests.find((req: any) => req.requester_id === userId);
    const dateChoices = myRequest?.date_choices || null;
    const finalDate = myRequest?.final_date || null;
    const finalLocation = myRequest?.final_location || null;
    // photos의 각 경로 앞에 baseUrl 붙이기
    const transformedProfile = snakeToCamelCase({
      ...profile,
      points: user?.points ?? 0,
      photos: (profile.photos || []).map((url: string) =>
        url && url.startsWith('/files/') ? `${baseUrl}${url}` : url
      ),
      dateChoices,
      finalDate,
      finalLocation,
    });
    const responseBody = JSON.stringify(transformedProfile);
    await appendLog({
      type: 'profile_get',
      userId: userId,
      result: 'success',
      message: '프로필 조회 성공',
      detail: { userId, profile },
      requestMethod: event.requestContext?.http?.method || 'GET',
      requestPath: event.requestContext?.http?.path || `/profile/${userId}`,
      responseStatus: 200,
      responseBody,
      action: '프로필 조회',
      screen: 'ProfileScreen',
      component: 'getProfile'
    });
    return { statusCode: 200, body: responseBody };
  }
  await appendLog({
    type: 'profile_get',
    userId: userId,
    result: 'fail',
    message: '프로필 조회 실패',
    detail: { userId },
    requestMethod: event.requestContext?.http?.method || 'GET',
    requestPath: event.requestContext?.http?.path || `/profile/${userId}`,
    responseStatus: 404,
    responseBody: JSON.stringify({ error: 'Profile not found', userId }),
    action: '프로필 조회',
    screen: 'ProfileScreen',
    component: 'getProfile'
  });
  return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found', userId }) };
};

// 이상형 조회
export const getUserPreferences = async (event: any) => {
  const { userId } = event.pathParameters || {};
  const preferences: UserPreferences[] = readJson(preferencesPath);
  const pref = preferences.find(p => p.user_id === userId);
  if (pref) {
    return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(pref)) };
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'Preferences not found' }) };
};

// 소개팅 신청
export const requestMatching = async (event: any) => {
  const { userId } = JSON.parse(event.body || '{}');
  const users: User[] = readJson(usersPath);
  const user = users.find(u => u.user_id === userId);
  
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  }
  
  if (user.points < 100) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Insufficient points' }) };
  }
  
  // 포인트 차감
  user.points -= 100;
  writeJson(usersPath, users);
  
  // MatchingRequests 테이블에 기록 생성
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  
  const newRequest = {
    match_id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    requester_id: userId,
    status: 'waiting',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_manual: false,
    date_choices: { dates: [], locations: [] },
    choices_submitted_at: null,
    final_date: null,
    final_location: null,
    failure_reason: null,
    points_refunded: false,
    match_pair_id: null,
    partner_id: null
  };
  
  matchingRequests.push(newRequest);
  writeJson(matchingRequestsPath, matchingRequests);
  
  await appendLog({
    type: 'matching_request',
    userId,
    email: user.email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: { match_id: newRequest.match_id, points_deducted: 100 },
  });
  
  return { statusCode: 200, body: JSON.stringify({ match_id: newRequest.match_id }) };
};

// 매칭 요청 목록 조회 (관리자용)
export const getMatchingRequests = async (event: any) => {
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  
  const waitingRequests = matchingRequests.filter((req: any) => req.status === 'waiting');
  
  return { statusCode: 200, body: JSON.stringify({ requests: waitingRequests }) };
};

// 매칭 확정
export const confirmMatching = async (event: any) => {
  const { match_id, user_a_id, user_b_id } = JSON.parse(event.body || '{}');
  
  // MatchingRequests 상태 업데이트
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  const requestIndex = matchingRequests.findIndex((req: any) => req.match_id === match_id);
  
  if (requestIndex >= 0) {
    matchingRequests[requestIndex].status = 'confirmed';
    writeJson(matchingRequestsPath, matchingRequests);
  }
  
  // MatchPairs 테이블에 기록 생성
  const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
  const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
  
  const newMatch = {
    match_id,
    user_a_id,
    user_b_id,
    user_a_choices: { dates: [], locations: [] },
    user_b_choices: { dates: [], locations: [] },
    final_date: null,
    final_location: null
  };
  
  matchPairs.push(newMatch);
  writeJson(matchPairsPath, matchPairs);
  
  await appendLog({
    type: 'matching_confirmed',
    userId: user_a_id,
    result: 'success',
    detail: { match_id, user_a_id, user_b_id },
  });
  
  
};

// 관리자 매칭 최종 확정 (confirmed → scheduled)
export const finalizeMatching = async (event: any) => {
  const { match_pair_id, final_date, final_location, photo_visible_at } = JSON.parse(event.body || '{}');

  const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
  const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
  const matchIndex = matchPairs.findIndex((match: any) => match.match_pair_id === match_pair_id);

  if (matchIndex >= 0) {
    const match = matchPairs[matchIndex];
    const now = new Date().toISOString();
    
    // MatchPairs는 updated_at만 업데이트 (상태는 MatchingRequests에서 관리)
      match.updated_at = now;
    writeJson(matchPairsPath, matchPairs);

    // matching-requests 상태 변경 (중심 테이블)
    const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
    const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
    
    [match.match_a_id, match.match_b_id].forEach((mid: string) => {
      const reqIdx = matchingRequests.findIndex((req: any) => req.match_id === mid);
      if (reqIdx >= 0) {
          matchingRequests[reqIdx].status = 'scheduled';
        matchingRequests[reqIdx].final_date = final_date;
        matchingRequests[reqIdx].final_location = final_location;
        matchingRequests[reqIdx].photo_visible_at = photo_visible_at;
        matchingRequests[reqIdx].updated_at = now;
      }
    });
    writeJson(matchingRequestsPath, matchingRequests);
    
    await appendLog({
      type: 'matching_finalized',
      result: 'success',
      detail: { match_pair_id, final_date, final_location, photo_visible_at },
      action: '매칭 최종 확정',
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: '매칭이 최종 확정되었습니다.' })
    };
  }
  
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Match pair not found' })
  };
};

export const submitChoices = async (event: any) => {
  const { match_id, user_id, dates, locations, final_date, final_location } = JSON.parse(event.body || '{}');

  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  const currentRequest = matchingRequests.find((req: any) => req.match_id === match_id);

  const now = new Date().toISOString();

  if (currentRequest) {
    currentRequest.date_choices = { dates, locations };
    currentRequest.choices_submitted_at = now;
    currentRequest.updated_at = now;
    
    // 매칭 페어 찾기
    const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
    const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
    const matchPair = matchPairs.find((pair: any) => 
      pair.match_a_id === match_id || pair.match_b_id === match_id
    );
    
    if (matchPair) {
      // 상대방의 매칭 요청 찾기
      const otherMatchId = matchPair.match_a_id === match_id ? matchPair.match_b_id : matchPair.match_a_id;
      const otherRequest = matchingRequests.find((req: any) => req.match_id === otherMatchId);
      
      if (otherRequest && otherRequest.date_choices && otherRequest.date_choices.dates.length > 0) {
        // 상대방이 이미 일정을 제출한 경우, 일정이 겹치는지 확인
        const commonDates = dates.filter((date: string) => 
          otherRequest.date_choices.dates.includes(date)
        );
        
        // 정확한 장소 매칭
        const commonLocations = locations.filter((location: string) => 
          otherRequest.date_choices.locations.includes(location)
        );
        
        // 지역 매칭 (같은 지역이면 매칭 성공)
        const getRegionFromLocation = (location: string) => {
          if (location.includes('서울')) return '서울';
          if (location.includes('경기')) return '경기';
          if (location.includes('인천')) return '인천';
          if (location.includes('부산')) return '부산';
          if (location.includes('대구')) return '대구';
          if (location.includes('광주')) return '광주';
          if (location.includes('대전')) return '대전';
          if (location.includes('울산')) return '울산';
          if (location.includes('세종')) return '세종';
          return location.split(' ')[0]; // 첫 번째 단어를 지역으로 간주
        };
        
        // "어디든 괜찮음" 패턴 체크 (예: "서울 서울", "경기 경기")
        const isFlexibleLocation = (location: string) => {
          const parts = location.split(' ');
          return parts.length >= 2 && parts[0] === parts[1];
        };
        
        const myRegions = locations.map(getRegionFromLocation);
        const otherRegions = otherRequest.date_choices.locations.map(getRegionFromLocation);
        const commonRegions = myRegions.filter((region: string) => otherRegions.includes(region));
        
        // 유연한 매칭 체크
        let flexibleMatch = false;
        
        // 내가 구체적인 장소를 선택하고 상대방이 "어디든 괜찮음"을 선택한 경우
        for (const myLocation of locations) {
          for (const otherLocation of otherRequest.date_choices.locations) {
            if (isFlexibleLocation(otherLocation)) {
              const myRegion = getRegionFromLocation(myLocation);
              const otherRegion = getRegionFromLocation(otherLocation);
              if (myRegion === otherRegion) {
                flexibleMatch = true;
                break;
              }
            }
          }
          if (flexibleMatch) break;
        }
        
        // 상대방이 구체적인 장소를 선택하고 내가 "어디든 괜찮음"을 선택한 경우
        if (!flexibleMatch) {
          for (const otherLocation of otherRequest.date_choices.locations) {
            for (const myLocation of locations) {
              if (isFlexibleLocation(myLocation)) {
                const myRegion = getRegionFromLocation(myLocation);
                const otherRegion = getRegionFromLocation(otherLocation);
                if (myRegion === otherRegion) {
                  flexibleMatch = true;
                  break;
                }
              }
            }
            if (flexibleMatch) break;
          }
        }
        
        // 날짜가 겹치고 (장소가 정확히 겹치거나 같은 지역이거나 유연한 매칭이면) 매칭 성공
        if (commonDates.length > 0 && (commonLocations.length > 0 || commonRegions.length > 0 || flexibleMatch)) {
          // 일정이 겹치면 양쪽 모두 confirmed 상태로 설정
          currentRequest.status = 'confirmed';
          currentRequest.final_date = commonDates[0]; // 첫 번째 겹치는 날짜 선택
          currentRequest.final_location = commonLocations[0]; // 첫 번째 겹치는 장소 선택
          
          // final_date의 30분 전으로 photo_visible_at 설정
          const finalDate = new Date(currentRequest.final_date);
          const photoVisibleAt = new Date(finalDate.getTime() - 30 * 60 * 1000);
          currentRequest.photo_visible_at = photoVisibleAt.toISOString();
          
          // 상대방도 confirmed 상태로 변경
          otherRequest.status = 'confirmed';
          otherRequest.final_date = commonDates[0];
          otherRequest.final_location = commonLocations[0];
          otherRequest.photo_visible_at = photoVisibleAt.toISOString();
          
          console.log('[submitChoices] 일정 매칭 성공 - 양쪽 모두 confirmed:', {
            commonDates,
            commonLocations,
            commonRegions,
            flexibleMatch,
            final_date: currentRequest.final_date,
            final_location: currentRequest.final_location,
            currentUserStatus: currentRequest.status,
            otherUserStatus: otherRequest.status
          });
        } else {
          // 일정이 겹치지 않으면 현재 사용자만 mismatched 상태로 설정
          currentRequest.status = 'mismatched';
          console.log('[submitChoices] 일정 매칭 실패 - 현재 사용자만 mismatched:', {
            myDates: dates,
            myLocations: locations,
            otherDates: otherRequest.date_choices.dates,
            otherLocations: otherRequest.date_choices.locations
          });
        }
      } else {
        // 상대방이 아직 일정을 제출하지 않은 경우
        // 현재 사용자가 mismatched 상태였다면 matched로 변경
        if (currentRequest.status === 'mismatched') {
          currentRequest.status = 'matched';
          console.log('[submitChoices] 상대방이 일정을 제출하지 않음 - 현재 사용자를 matched로 변경');
        } else {
          currentRequest.status = 'matched';
        }
      }
    } else {
      // 매칭 페어를 찾을 수 없는 경우
      currentRequest.status = 'confirmed';
    }
  }

  writeJson(matchingRequestsPath, matchingRequests);

  await appendLog({
    type: 'choices_submitted',
    userId: user_id,
    result: 'success',
    detail: { 
      match_id, 
      dates, 
      locations, 
      status: currentRequest?.status,
      final_date: currentRequest?.final_date,
      photo_visible_at: currentRequest?.photo_visible_at 
    },
  });

  return { 
    statusCode: 200, 
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      ok: true, 
      status: currentRequest?.status,
      message: currentRequest?.status === 'mismatched' ? '일정이 맞지 않습니다. 다시 일정을 선택해주세요.' : '일정이 제출되었습니다.'
    }) 
  };
};

// 리뷰 저장
export const saveReview = async (event: any) => {
  const { 
    match_id, 
    reviewer_id, 
    target_id, 
    rating, 
    want_to_meet_again, 
    tags, 
    comment,
    // AI 인사이트를 위한 추가 필드들
    overall_satisfaction,
    date_duration,
    location_satisfaction,
    conversation_initiative,
    first_impression_vs_reality,
    success_failure_factors
  } = JSON.parse(event.body || '{}');
  
  const reviewsPath = path.join(__dirname, 'data/reviews.json');
  const reviews = fs.existsSync(reviewsPath) ? readJson(reviewsPath) : [];
  
  const newReview = {
    review_id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    match_id,
    reviewer_id,
    target_id,
    rating,
    want_to_meet_again,
    tags,
    comment,
    // AI 인사이트를 위한 추가 필드들
    overall_satisfaction,
    date_duration,
    location_satisfaction,
    conversation_initiative,
    first_impression_vs_reality,
    success_failure_factors,
    created_at: new Date().toISOString()
  };
  
  reviews.push(newReview);
  writeJson(reviewsPath, reviews);
  
  // ReviewStats 업데이트
  const reviewStatsPath = path.join(__dirname, 'data/review-stats.json');
  const reviewStats = fs.existsSync(reviewStatsPath) ? readJson(reviewStatsPath) : [];
  
  let targetStats = reviewStats.find((stats: any) => stats.user_id === target_id);
  if (!targetStats) {
    targetStats = {
      user_id: target_id,
      avg_appearance: 0,
      avg_conversation: 0,
      avg_manners: 0,
      avg_honesty: 0,
      avg_overall_satisfaction: 0,
      avg_location_satisfaction: 0,
      total_reviews: 0,
      positive_tags: [],
      date_duration_stats: {
        "30분 미만": 0,
        "30분-1시간": 0,
        "1시간-2시간": 0,
        "2시간 이상": 0
      },
      conversation_initiative_stats: {
        "나": 0,
        "상대방": 0,
        "비슷함": 0
      },
      first_impression_stats: {
        "더 좋아짐": 0,
        "비슷함": 0,
        "실망": 0
      },
      success_factor_stats: {
        "대화": 0,
        "외모": 0,
        "매너": 0,
        "장소": 0,
        "기타": 0
      }
    };
    reviewStats.push(targetStats);
  }
  
  // 평균 계산
  targetStats.total_reviews += 1;
  targetStats.avg_appearance = (targetStats.avg_appearance * (targetStats.total_reviews - 1) + rating.appearance) / targetStats.total_reviews;
  targetStats.avg_conversation = (targetStats.avg_conversation * (targetStats.total_reviews - 1) + rating.conversation) / targetStats.total_reviews;
  targetStats.avg_manners = (targetStats.avg_manners * (targetStats.total_reviews - 1) + rating.manners) / targetStats.total_reviews;
  targetStats.avg_honesty = (targetStats.avg_honesty * (targetStats.total_reviews - 1) + rating.honesty) / targetStats.total_reviews;
  
  // AI 인사이트를 위한 추가 평균 계산
  if (overall_satisfaction) {
    targetStats.avg_overall_satisfaction = (targetStats.avg_overall_satisfaction * (targetStats.total_reviews - 1) + overall_satisfaction) / targetStats.total_reviews;
  }
  if (location_satisfaction) {
    targetStats.avg_location_satisfaction = (targetStats.avg_location_satisfaction * (targetStats.total_reviews - 1) + location_satisfaction) / targetStats.total_reviews;
  }
  
  // 긍정적 태그 추가
  if (tags && tags.length > 0) {
    targetStats.positive_tags = [...new Set([...targetStats.positive_tags, ...tags])];
  }
  
  // 소개팅 패턴 통계 업데이트
  if (date_duration && targetStats.date_duration_stats[date_duration] !== undefined) {
    targetStats.date_duration_stats[date_duration]++;
  }
  if (conversation_initiative && targetStats.conversation_initiative_stats[conversation_initiative] !== undefined) {
    targetStats.conversation_initiative_stats[conversation_initiative]++;
  }
  if (first_impression_vs_reality && targetStats.first_impression_stats[first_impression_vs_reality] !== undefined) {
    targetStats.first_impression_stats[first_impression_vs_reality]++;
  }
  if (success_failure_factors && Array.isArray(success_failure_factors)) {
    success_failure_factors.forEach((factor: string) => {
      if (targetStats.success_factor_stats[factor] !== undefined) {
        targetStats.success_factor_stats[factor]++;
      }
    });
  }
  
  writeJson(reviewStatsPath, reviewStats);
  
  await appendLog({
    type: 'review_saved',
    userId: reviewer_id,
    result: 'success',
    detail: { review_id: newReview.review_id, target_id, rating },
  });
  
  // 리뷰 저장 후 매칭 상태 확인 및 변경
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = readJson(matchingRequestsPath);
  const reqIdx = matchingRequests.findIndex((req: any) => req.match_id === match_id);
  if (reqIdx >= 0) {
    // 먼저 review 상태로 변경
    matchingRequests[reqIdx].status = 'review';
    matchingRequests[reqIdx].updated_at = new Date().toISOString();
    
    // 매칭 쌍 찾기
    const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
    const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
    const match = matchPairs.find((m: any) => m.match_a_id === match_id || m.match_b_id === match_id);
    
    if (match) {
      // 양쪽 모두 리뷰를 작성했는지 확인
      const allReviews = readJson(reviewsPath);
      const matchReviews = allReviews.filter((r: any) => 
        (r.match_id === match.match_a_id || r.match_id === match.match_b_id)
      );
      
      if (matchReviews.length >= 2) {
        // 양쪽 모두 리뷰 작성 완료 - want_to_meet_again 확인
        const bothWantToMeet = matchReviews.every((r: any) => r.want_to_meet_again === true);
        const finalStatus = bothWantToMeet ? 'completed' : 'failed';
        
        // 양쪽 모두 상태 변경
        [match.match_a_id, match.match_b_id].forEach((mid: string) => {
          const reqIdx = matchingRequests.findIndex((req: any) => req.match_id === mid);
          if (reqIdx >= 0) {
            matchingRequests[reqIdx].status = finalStatus;
            matchingRequests[reqIdx].updated_at = new Date().toISOString();
          }
        });
      }
    }
    
    writeJson(matchingRequestsPath, matchingRequests);
  }
  
  return { 
    statusCode: 200, 
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ review_id: newReview.review_id }) 
  };
};

// 포인트 충전
export const chargePoints = async (event: any) => {
  const { userId, amount, type } = JSON.parse(event.body || '{}');
  
  const users: User[] = readJson(usersPath);
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex >= 0) {
    users[userIndex].points += amount;
    writeJson(usersPath, users);
    
    // PointsHistory 기록
    const pointsHistoryPath = path.join(__dirname, 'data/points-history.json');
    const pointsHistory = fs.existsSync(pointsHistoryPath) ? readJson(pointsHistoryPath) : [];
    
    const newHistory = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      type,
      points: amount,
      description: `${type} 포인트 적립`
    };
    
    pointsHistory.push(newHistory);
    writeJson(pointsHistoryPath, pointsHistory);
    
    await appendLog({
      type: 'points_charged',
      userId,
      result: 'success',
      detail: { amount, type, new_balance: users[userIndex].points },
    });
    
    return { statusCode: 200, body: JSON.stringify({ points: users[userIndex].points }) };
  }
  
  return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
};

// 사용자 상태 변경 (관리자용)
export const updateUserStatus = async (event: any) => {
  const { userId, new_status, reason, updated_by } = JSON.parse(event.body || '{}');
  
  const users: User[] = readJson(usersPath);
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex >= 0) {
    const oldStatus = users[userIndex].status;
    users[userIndex].status = new_status;
    writeJson(usersPath, users);
    
    // UserStatusHistory 기록
    const statusHistoryPath = path.join(__dirname, 'data/user-status-history.json');
    const statusHistory = fs.existsSync(statusHistoryPath) ? readJson(statusHistoryPath) : [];
    
    const newHistory = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      from_status: oldStatus,
      to_status: new_status,
      reason,
      updated_by
    };
    
    statusHistory.push(newHistory);
    writeJson(statusHistoryPath, statusHistory);
    
    await appendLog({
      type: 'user_status_updated',
      userId,
      result: 'success',
      detail: { from_status: oldStatus, to_status: new_status, reason },
      action: '사용자 상태 변경',
      screen: 'AdminScreen',
      component: 'user_status'
    });
    
    return { statusCode: 200, body: JSON.stringify({ status: new_status }) };
  }
  
  return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
};

// 사용자 정보 조회
export const getUser = async (event: any) => {
  const { userId } = event.pathParameters || {};
  const users: User[] = readJson(usersPath);
  const user = users.find(u => u.user_id === userId);
  if (user) {
    return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(user)) };
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'User not found', userId }) };
};

// 카드(소개팅 상대) 목록 조회
export const getCards = async (event: any) => {
  const userId = event.queryStringParameters?.userId || event.headers?.userid;
  const search = event.queryStringParameters?.search || ''; // 검색어
  const status = event.queryStringParameters?.status || 'all'; // 상태 필터
  const page = parseInt(event.queryStringParameters?.page || '1', 10);
  const pageSize = parseInt(event.queryStringParameters?.pageSize || '10', 10);
  
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  const matchPairs = readJson(matchPairsPath);
  const profiles = readJson(profilesPath);
  const myMatches = matchPairs.filter((m: any) => m.user_a_id === userId || m.user_b_id === userId);
  
  function calcAge(birthDate: any): number | null {
    if (!birthDate) return null;
    let year;
    if (typeof birthDate === 'string') {
      year = parseInt(birthDate.split('-')[0], 10);
    } else if (typeof birthDate === 'object' && birthDate.year) {
      year = birthDate.year;
    }
    if (!year) return null;
    const now = new Date();
    return now.getFullYear() - year;
  }

  let cards = myMatches.map((m: any) => {
    const otherUserId = m.user_a_id === userId ? m.user_b_id : m.user_a_id;
    const profile = profiles.find((p: any) => p.user_id === otherUserId);
    if (!profile) {
      return null;
    }
    return {
      matchId: m.match_id,
      userId: otherUserId,
      isDeleted: false,
      name: profile.name || '',
      job: profile.job || '',
      region: profile.region?.region || '',
      district: profile.region?.district || '',
      photoUrl: profile.photos?.[0] || null,
      age: calcAge(profile.birth_date),
      date: m.final_date || null,
      status: m.final_date ? 'revealed' : 'pending',
    };
  }).filter(Boolean);

  // 검색어 필터링
  if (search.trim()) {
    cards = cards.filter((card: any) => 
      card.name?.toLowerCase().includes(search.toLowerCase()) ||
      card.job?.toLowerCase().includes(search.toLowerCase()) ||
      card.region?.toLowerCase().includes(search.toLowerCase()) ||
      card.district?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // 상태별 필터링
  if (status !== 'all') {
    cards = cards.filter((card: any) => card.status === status);
  }

  // 페이징 처리 (필터링 후)
  const total = cards.length;
  const start = (page - 1) * pageSize;
  const paged = cards.slice(start, start + pageSize);
  
  await appendLog({
    type: 'get_cards',
    userId,
    requestMethod: event.requestContext?.http?.method || 'GET',
    requestPath: event.requestContext?.http?.path || '/cards',
    result: 'success',
    detail: { 
      page, 
      pageSize, 
      total, 
      returned: paged.length,
      search: search || null,
      status: status !== 'all' ? status : null
    },
    action: '카드함 조회',
    screen: 'CardsScreen',
    component: 'cards_list'
  });
  
  return { 
    statusCode: 200, 
    body: JSON.stringify({
      cards: paged.map(snakeToCamelCase),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  };
};

// 리뷰 목록 조회
export const getReviews = async (event: any) => {
  const userId = event.queryStringParameters?.userId || event.headers?.userid;
  const page = parseInt(event.queryStringParameters?.page || '1', 10);
  const pageSize = parseInt(event.queryStringParameters?.pageSize || '10', 10);
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  const reviews = readJson(reviewsPath);
  const myReviews = reviews.filter((r: any) => r.target_id === userId);
  // 페이징 처리
  const start = (page - 1) * pageSize;
  const paged = myReviews.slice(start, start + pageSize);
  // 로그 기록
  await appendLog({
    type: 'get_reviews',
    userId,
    requestMethod: event.requestContext?.http?.method || 'GET',
    requestPath: event.requestContext?.http?.path || '/reviews',
    result: 'success',
    detail: { page, pageSize, total: myReviews.length, returned: paged.length },
    action: '후기 조회',
    screen: 'ReviewsScreen',
    component: 'reviews_list'
  });
  return { statusCode: 200, body: JSON.stringify(paged.map(snakeToCamelCase)) };
};

// 홈(메인) 프로필 카드 1건 조회
export const getMainCard = async (event: any) => {
  const userId = event.queryStringParameters?.userId || event.headers?.userid;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  // matching-requests에서 신청 기록 조회
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  const myRequest = matchingRequests.find((req: any) => req.requester_id === userId);
  let status = null;
  let matchId = null;
  let matchedUser = null;
  let hasPendingProposal = false;
  let proposalMatchId = null;

  if (myRequest) {
    // 유저에게 노출하지 않을 상태는 waiting으로 가공
    const hiddenStatuses = ['failed', 'refused', 'canceled'];
    status = hiddenStatuses.includes(myRequest.status) ? 'waiting' : myRequest.status;
    matchId = myRequest.match_id;
  }
  // mainCard 없이 status만 반환
  await appendLog({ 
    type: 'get_main_card', 
    userId, 
    result: 'success', 
    detail: { status },
    action: '메인카드 조회',
    screen: 'MainScreen',
    component: 'main_card'
  });
  return { statusCode: 200, body: JSON.stringify({ matchingStatus: status }) };
};

// 카드 상세 정보 조회
export const getCardDetail = async (event: any) => {
  const userId = event.pathParameters?.userId;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  const profiles = readJson(profilesPath);
  const profile = profiles.find((p: any) => p.user_id === userId);
  
  if (!profile) {
    await appendLog({
      type: 'get_card_detail',
      userId: '',
      result: 'fail',
      message: 'Profile not found',
      detail: { requestedUserId: userId },
      action: '카드 상세 조회',
      screen: 'UserDetailScreen',
      component: 'card_detail'
    });
    return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found' }) };
  }
  
  await appendLog({
    type: 'get_card_detail',
    userId: userId,
    result: 'success',
    detail: { profileFound: true },
    action: '카드 상세 조회',
    screen: 'UserDetailScreen',
    component: 'card_detail'
  });
  
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(profile)) };
};

// 이미지 업로드
export const uploadImage = async (event: any) => {
  const { userId, imageData, fileName } = JSON.parse(event.body || '{}');
  
  if (!userId || !imageData) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId and imageData required' }) };
  }

  try {
    // base64 데이터에서 실제 이미지 데이터 추출
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 파일 검증
    if (!validateFileSize(buffer)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'File size exceeds 10MB limit' }) };
    }

    if (!validateImageFormat(fileName || 'image.jpg')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid image format' }) };
    }

    // AWS S3 구조를 고려한 경로 생성
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // S3 구조: images/profile/{year}/{month}/{day}/{userId}/
    const s3Path = generateS3Path(userId, '', 'profile');
    const localPath = `${year}/${month}/${day}/${userId}`;
    const filesDir = path.join(__dirname, 'files', localPath);
    
    // 디렉토리 생성
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    // 파일명 생성 (타임스탬프 + 원본 확장자)
    const timestamp = Date.now();
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
    const savedFileName = `${timestamp}.${extension}`;
    const filePath = path.join(filesDir, savedFileName);

    // 파일 저장
    fs.writeFileSync(filePath, buffer);

    // URL 생성 (S3 구조를 고려한 경로)
    const imageUrl = `/files/${localPath}/${savedFileName}`;
    const s3FullPath = `${s3Path}/${savedFileName}`;
    const baseUrl = getBaseUrl(event);

    await appendLog({
      type: 'image_upload',
      userId,
      result: 'success',
      detail: { 
        fileName: savedFileName, 
        localPath,
        s3Path: s3FullPath,
        fileSize: buffer.length,
        fullPath: imageUrl
      },
      action: '이미지 업로드',
      screen: 'ProfileEditScreen',
      component: 'image_upload'
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        imageUrl: `${baseUrl}${imageUrl}`,
        fileName: savedFileName,
        localPath,
        s3Path: s3FullPath,
        fullPath: imageUrl
      }) 
    };
  } catch (error: any) {
    console.error('이미지 업로드 에러:', error);
    
    await appendLog({
      type: 'image_upload',
      userId,
      result: 'fail',
      message: error.message,
      detail: { error: error.message },
      action: '이미지 업로드',
      screen: 'ProfileEditScreen',
      component: 'image_upload'
    });

    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Image upload failed' }) 
    };
  }
};

// 정적 파일 서빙 (개발용)
export const serveFile = async (event: any) => {
  const { year, month, day, userId, fileName } = event.pathParameters || {};
  
  if (!year || !month || !day || !userId || !fileName) {
    return { statusCode: 404, body: 'File not found' };
  }

  try {
    // 구조화된 경로로 파일 찾기
    const filePath = path.join(__dirname, 'files', year, month, day, userId, fileName);
    
    if (!fs.existsSync(filePath)) {
      return { statusCode: 404, body: 'File not found' };
    }

    const fileContent = fs.readFileSync(filePath);
    const contentType = getContentType(fileName);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000'
      },
      body: fileContent.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('파일 서빙 에러:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

// 파일 확장자에 따른 Content-Type 반환
function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

// 기존 이미지 마이그레이션 (개발용)
export const migrateImages = async (event: any) => {
  try {
    const profiles = readJson(profilesPath);
    const migratedCount = { success: 0, failed: 0 };
    
    for (const profile of profiles) {
      if (profile.photos && Array.isArray(profile.photos)) {
        const newPhotos = [];
        
        for (const photoUrl of profile.photos) {
          // 기존 로컬 파일 경로인지 확인
          if (photoUrl && photoUrl.startsWith('file:///')) {
            try {
              // 실제 파일 경로 추출
              const localPath = photoUrl.replace('file://', '');
              if (!fs.existsSync(localPath)) {
                // 파일이 없으면 기존 경로 유지
                newPhotos.push(photoUrl);
                migratedCount.failed++;
                continue;
              }
              // 새 경로 생성
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const timestamp = Date.now();
              const ext = localPath.split('.').pop() || 'jpg';
              const newFileName = `${timestamp}.${ext}`;
              const newDir = path.join(__dirname, 'files', `${year}`, `${month}`, `${day}`, profile.user_id);
              if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true });
              }
              const newFilePath = path.join(newDir, newFileName);
              fs.copyFileSync(localPath, newFilePath);
              const newPhotoUrl = `/files/${year}/${month}/${day}/${profile.user_id}/${newFileName}`;
              newPhotos.push(newPhotoUrl);
              migratedCount.success++;
            } catch (error) {
              console.error(`이미지 마이그레이션 실패: ${photoUrl}`, error);
              migratedCount.failed++;
              // 실패 시 기존 URL 유지
              newPhotos.push(photoUrl);
            }
          } else {
            // 이미 올바른 형식이거나 외부 URL인 경우 그대로 유지
            newPhotos.push(photoUrl);
          }
        }
        // 프로필 업데이트
        profile.photos = newPhotos;
      }
    }
    // 업데이트된 프로필 저장
    writeJson(profilesPath, profiles);
    await appendLog({
      type: 'image_migration',
      userId: '',
      result: 'success',
      detail: { 
        migratedCount,
        totalProfiles: profiles.length
      },
      action: '이미지 마이그레이션',
      screen: 'AdminScreen',
      component: 'image_migration'
    });
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        message: 'Image migration completed',
        migratedCount,
        totalProfiles: profiles.length
      }) 
    };
  } catch (error: any) {
    console.error('이미지 마이그레이션 에러:', error);
    await appendLog({
      type: 'image_migration',
      userId: '',
      result: 'fail',
      message: error.message,
      detail: { error: error.message },
      action: '이미지 마이그레이션',
      screen: 'AdminScreen',
      component: 'image_migration'
    });
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Image migration failed' }) 
    };
  }
};

// AWS S3 구조를 고려한 파일 경로 생성 함수
function generateS3Path(userId: string, fileName: string, type: 'profile' | 'temp' = 'profile'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // S3 구조: {bucket}/images/{type}/{year}/{month}/{day}/{userId}/{fileName}
  return `images/${type}/${year}/${month}/${day}/${userId}/${fileName}`;
}

// 파일 크기 제한 체크 (10MB)
function validateFileSize(buffer: Buffer): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return buffer.length <= maxSize;
}

// 허용된 이미지 형식 체크
function validateImageFormat(fileName: string): boolean {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

// 파일 정리 함수 (오래된 임시 파일 삭제)
export const cleanupTempFiles = async (event: any) => {
  try {
    const tempDir = path.join(__dirname, 'files');
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    const now = Date.now();
    let deletedCount = 0;
    
    function cleanupDirectory(dirPath: string) {
      if (!fs.existsSync(dirPath)) return;
      
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          cleanupDirectory(itemPath);
          // 빈 디렉토리 삭제
          if (fs.readdirSync(itemPath).length === 0) {
            fs.rmdirSync(itemPath);
          }
        } else if (stats.isFile()) {
          // 임시 파일이고 24시간 이상 된 경우 삭제
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlinkSync(itemPath);
            deletedCount++;
          }
        }
      }
    }
    
    cleanupDirectory(tempDir);
    
    await appendLog({
      type: 'file_cleanup',
      userId: '',
      result: 'success',
      detail: { deletedCount },
      action: '파일 정리',
      screen: 'AdminScreen',
      component: 'file_cleanup'
    });
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        message: 'File cleanup completed',
        deletedCount 
      }) 
    };
  } catch (error: any) {
    console.error('파일 정리 에러:', error);
    
    await appendLog({
      type: 'file_cleanup',
      userId: '',
      result: 'fail',
      message: error.message,
      detail: { error: error.message },
      action: '파일 정리',
      screen: 'AdminScreen',
      component: 'file_cleanup'
    });
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'File cleanup failed' }) 
    };
  }
};

export const getTerms = async () => {
  const terms = readJson(termsPath);
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(terms)) };
};

export const getPrivacy = async () => {
  const privacy = readJson(privacyPath);
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(privacy)) };
};

export const getCustomerService = async () => {
  const cs = readJson(customerServicePath);
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(cs)) };
};



// 매칭 상세 정보 조회 (matchId 기반)
export const getMatchDetail = async (event: any) => {
  const matchId = event.pathParameters?.matchId;
  const requestUserId = event.queryStringParameters?.userId || event.headers?.userid;
  
  if (!matchId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'matchId required' }) };
  }
  
  if (!requestUserId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  const matchPairs = readJson(matchPairsPath);
  const profiles = readJson(profilesPath);
  const preferences = readJson(preferencesPath);
  
  // 기존: const match = matchPairs.find((m: any) => m.match_id === matchId);
  const match = matchPairs.find((m: any) => m.match_a_id === matchId || m.match_b_id === matchId);
  if (!match) {
    await appendLog({
      type: 'get_match_detail',
      userId: requestUserId,
      result: 'fail',
      message: 'Match not found',
      detail: { requestedMatchId: matchId },
      action: '매칭 상세 조회',
      screen: 'UserDetailScreen',
      component: 'match_detail'
    });
    return { statusCode: 404, body: JSON.stringify({ error: 'Match not found' }) };
  }
  
  // 요청한 사용자가 매칭에 포함되어 있는지 확인
  const matchingRequests = readJson(matchingRequestsPath);
  const matchA = matchingRequests.find((r: any) => r.match_id === match.match_a_id);
  const matchB = matchingRequests.find((r: any) => r.match_id === match.match_b_id);

  if (
    (matchA && matchA.requester_id === requestUserId) ||
    (matchB && matchB.requester_id === requestUserId)
  ) {
    // OK, 계속 진행
  } else {
    await appendLog({
      type: 'get_match_detail',
      userId: requestUserId,
      result: 'fail',
      message: 'User not in match',
      detail: { requestedMatchId: matchId, userA: matchA?.requester_id, userB: matchB?.requester_id },
      action: '매칭 상세 조회',
      screen: 'UserDetailScreen',
      component: 'match_detail'
    });
    return { statusCode: 403, body: JSON.stringify({ error: 'User not authorized for this match' }) };
  }
  
  // 매칭된 상대방의 userId 찾기
  let otherUserId = null;
  if (matchA && matchA.requester_id === requestUserId && matchB) {
    otherUserId = matchB.requester_id;
  } else if (matchB && matchB.requester_id === requestUserId && matchA) {
    otherUserId = matchA.requester_id;
  }
  
  const profile = profiles.find((p: any) => p.user_id === otherUserId);
  const preference = preferences.find((p: any) => p.user_id === otherUserId);
  
  // 요청한 사용자의 matching-requests에서 일정/장소, 확정일정 정보 가져오기
  const myMatchingRequest = matchingRequests.find((req: any) => req.match_id === matchId);
  const dateChoices = myMatchingRequest?.date_choices || null;
  const finalDate = myMatchingRequest?.final_date || null;
  const finalLocation = myMatchingRequest?.final_location || null;
  const dateAddress = myMatchingRequest?.date_address || null;
  const photoVisibleAt = myMatchingRequest?.photo_visible_at || null;
  
  // 사진 공개 여부 확인
  const now = new Date();
  const photoVisibleDate = photoVisibleAt ? new Date(photoVisibleAt) : null;
  const isPhotoVisible = photoVisibleAt && photoVisibleDate && photoVisibleDate <= now;
  
  // 사진이 공개되지 않은 경우 프로필에서 사진 제거
  let profileToReturn = profile;
  if (profile && !isPhotoVisible) {
    profileToReturn = {
      ...profile,
      photos: [] // 사진 배열을 비워서 잠금 상태로 표시
    };
  }
  
  console.log('[getMatchDetail] 사진 공개 로직:', {
    now: now.toISOString(),
    photoVisibleAt,
    photoVisibleDate: photoVisibleDate?.toISOString(),
    isPhotoVisible,
    profileHasPhotos: profile?.photos?.length > 0,
    profileToReturnHasPhotos: profileToReturn?.photos?.length > 0
  });
  
  // 디버깅용 로그
  console.log('[getMatchDetail] 디버깅:', {
    requestUserId,
    myMatchingRequest: myMatchingRequest ? {
      match_id: myMatchingRequest.match_id,
      status: myMatchingRequest.status,
      date_choices: myMatchingRequest.date_choices,
      final_date: myMatchingRequest.final_date,
      final_location: myMatchingRequest.final_location,
      date_address: myMatchingRequest.date_address,
      photo_visible_at: myMatchingRequest.photo_visible_at
    } : null,
    dateChoices,
    finalDate,
    finalLocation,
    dateAddress,
    photoVisibleAt,
    isPhotoVisible,
    now: now.toISOString()
  });
  
  const result = {
    matchId: match.match_id,
    userId: otherUserId,
    profile: profileToReturn || null,
    preference: preference || null,
    matchDate: match.final_date || null,
    status: match.final_date ? 'revealed' : 'pending',
    date_choices: dateChoices,
    final_date: finalDate,
    final_location: finalLocation,
    dateAddress: dateAddress,
    photoVisibleAt: photoVisibleAt,
    isPhotoVisible: isPhotoVisible
  };
  
  console.log('[getMatchDetail] 최종 응답:', JSON.stringify(result, null, 2));
  
  await appendLog({
    type: 'get_match_detail',
    userId: requestUserId,
    result: 'success',
    detail: { 
      matchId: match.match_id,
      otherUserId,
      profileFound: !!profile,
      preferenceFound: !!preference
    },
    action: '매칭 상세 조회',
    screen: 'UserDetailScreen',
    component: 'match_detail'
  });
  
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(result)) };
}; 

// 매칭 상태 조회: 항상 matchId, matchedUser를 응답에 포함 (없으면 null)
export const getMatchingStatus = async (event: any) => {
  const userId = event.queryStringParameters?.userId || event.headers?.userid;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  // matching-requests에서 신청 기록 조회 (사용자당 1개만)
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  const myRequest = matchingRequests.find((req: any) => req.requester_id === userId);
  
  // propose.json에서 pending 상태 제안 조회
  const proposePath = path.join(__dirname, 'data/propose.json');
  const proposes = fs.existsSync(proposePath) ? readJson(proposePath) : [];
  const pendingProposal = proposes.find((p: any) => 
    p.target_id === userId && p.status === 'propose'
  );
  

  
  let status = null;
  let matchId = null;
  let matchedUser = null;
  let hasPendingProposal = false;
  let proposalMatchId = null;
  
  if (myRequest) {
    // 유저에게 노출하지 않을 상태는 waiting으로 가공
    const hiddenStatuses = ['failed', 'refused', 'canceled'];
    status = hiddenStatuses.includes(myRequest.status) ? 'waiting' : myRequest.status;
    matchId = myRequest.match_id;
  }
  
  // propose.json에서 pending 상태 제안 조회 (우선 처리)
  if (pendingProposal) {
    hasPendingProposal = true;
    proposalMatchId = pendingProposal.propose_id;
    // myRequest가 없거나 status가 propose가 아닌 경우에도 status를 propose로 설정
    if (!status || status !== 'propose') {
      status = 'propose';
    }
  }
  
  // match-pairs에서 내 userId가 포함된 쌍 찾기 (신청자가 아니더라도)
  const matchPairs = readJson(path.join(__dirname, 'data/match-pairs.json'));
  const profiles = readJson(path.join(__dirname, 'data/profiles.json'));
  const myMatch = matchPairs.find((m: any) => {
    // matching-requests에서 내 userId가 포함된 match_id를 찾기 위해
    const matchA = matchingRequests.find((r: any) => r.match_id === m.match_a_id);
    const matchB = matchingRequests.find((r: any) => r.match_id === m.match_b_id);
    return (matchA && matchA.requester_id === userId) || (matchB && matchB.requester_id === userId);
  });
  
  if (myMatch) {
    const matchA = matchingRequests.find((r: any) => r.match_id === myMatch.match_a_id);
    const matchB = matchingRequests.find((r: any) => r.match_id === myMatch.match_b_id);
    let otherUserId = null;
    if (matchA && matchA.requester_id === userId && matchB) {
      otherUserId = matchB.requester_id;
    } else if (matchB && matchB.requester_id === userId && matchA) {
      otherUserId = matchA.requester_id;
    }
    if (otherUserId) {
      const profile = profiles.find((p: any) => p.user_id === otherUserId);
      if (profile) {
        matchedUser = {
          userId: profile.user_id,
          name: profile.name || '',
          job: profile.job || '',
          region: profile.region?.region || '',
          photoUrl: profile.photos?.[0] || null,
        };
      }
    }
  }
  // 항상 matchId, matchedUser 포함 (없으면 null)
  await appendLog({ 
    type: 'get_matching_status', 
    userId, 
    result: 'success', 
    detail: { 
      status, 
      matchedUserId: matchedUser?.userId,
      hasPendingProposal,
      proposalMatchId,
      pendingProposalFound: pendingProposal,
      myRequestStatus: myRequest?.status,
      myRequestId: myRequest?.match_id,
      myRequest: myRequest
    },
    action: '매칭상태 조회',
    screen: 'MainScreen',
    component: 'matching_status'
  });

  let otherUserChoices = null;
  if (myMatch && matchedUser) {
    // 상대방 matchingRequest 찾기
    const otherRequest = matchingRequests.find((r: any) => r.requester_id === matchedUser.userId);
    if (otherRequest && otherRequest.date_choices && otherRequest.date_choices.dates.length > 0) {
      otherUserChoices = otherRequest.date_choices;
    }
  }

  let bothReviewed = false;
  let myReview = null;
  if (myMatch) {
    // 양쪽 모두 리뷰를 작성했는지 확인
    const reviews = readJson(reviewsPath);
    const reviewA = reviews.find((r: any) => r.match_id === myMatch.match_a_id);
    const reviewB = reviews.find((r: any) => r.match_id === myMatch.match_b_id);
    
    if (reviewA && reviewB) {
      bothReviewed = true;
    }
    
    // 내가 작성한 리뷰 찾기 - 현재 매칭의 match_id로 찾기
    if (myMatch) {
      // match_a_id 또는 match_b_id와 일치하는 리뷰 중에서 현재 사용자가 작성한 리뷰 찾기
      myReview = reviews.find((r: any) => 
        r.reviewer_id === userId && 
        (r.match_id === myMatch.match_a_id || r.match_id === myMatch.match_b_id)
      );
    }
  }

  let contactReady = false;
  let otherUserContact = null;
  // completed 상태이고 양쪽 모두 want_to_meet_again이 true일 때만 연락처 교환 가능
  if ((status === 'completed' || status === 'exchanged') && myMatch) {
    const reviews = readJson(reviewsPath);
    const reviewA = reviews.find((r: any) => r.match_id === myMatch.match_a_id);
    const reviewB = reviews.find((r: any) => r.match_id === myMatch.match_b_id);
    if (
      reviewA && reviewB &&
      reviewA.want_to_meet_again === true &&
      reviewB.want_to_meet_again === true
    ) {
      contactReady = true;
      
      // 상대방의 연락처 정보 가져오기
      if (reviewA.reviewer_id === userId && reviewB.contact) {
        otherUserContact = reviewB.contact;
      } else if (reviewB.reviewer_id === userId && reviewA.contact) {
        otherUserContact = reviewA.contact;
      }
    }
  }

  return { 
    statusCode: 200, 
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      status, 
      matchId, 
      matchedUser,
      hasPendingProposal,
      proposalMatchId,
      otherUserChoices, // 추가
      finalDate: myRequest?.final_date || null,
      bothReviewed,
      contactReady,
      review: myReview, // 내가 작성한 리뷰 데이터 추가
      otherUserContact // 상대방 연락처 정보 추가
    }) 
  };
}; 

// [신규] 인사이트 API (더미)
export const getInsight = async (event: any) => {
  const { userId } = event.pathParameters || {};
  
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  try {
    console.log('인사이트 조회 시작:', userId);
    
    // 히스토리 데이터 조회
    const matchingHistoryPath = path.join(__dirname, 'data/matching-history.json');
    const matchingHistory = readJson(matchingHistoryPath);
    const reviews = readJson(reviewsPath);
    const profiles = readJson(profilesPath);
    const users = readJson(usersPath);
    
    console.log('데이터 로드 완료:', {
      historyCount: matchingHistory.length,
      reviewsCount: reviews.length,
      profilesCount: profiles.length
    });
    
    // 사용자의 히스토리 필터링
    const userHistory = matchingHistory.filter((history: any) => {
      return (history.request_a && history.request_a.requester_id === userId) || 
             (history.request_b && history.request_b.requester_id === userId);
    });
    
    console.log('사용자 히스토리:', userHistory.length, '개');
    
    // 사용자의 리뷰 데이터 조회 - 히스토리에서 직접 추출
    const userReviews: any[] = [];
    const receivedReviews: any[] = [];
    
    userHistory.forEach((history: any) => {
      const isUserA = history.request_a && history.request_a.requester_id === userId;
      const userReview = isUserA ? history.review_a : history.review_b;
      const partnerReview = isUserA ? history.review_b : history.review_a;
      
      if (userReview) {
        userReviews.push(userReview);
      }
      if (partnerReview) {
        receivedReviews.push(partnerReview);
      }
    });
    
    console.log('리뷰 데이터:', {
      written: userReviews.length,
      received: receivedReviews.length
    });
    
    // 기본 통계 계산 - exchanged, completed, finished 모두 성공으로 계산 (실제 앱 기준)
    const totalMatches = userHistory.length;
    const successfulMatches = userHistory.filter((h: any) => 
      h.final_status === 'exchanged' || h.final_status === 'completed' || h.final_status === 'finished'
    ).length;
    const successRate = totalMatches > 0 ? Math.round((successfulMatches / totalMatches) * 100) : 0;
    
    console.log('기본 통계:', { totalMatches, successfulMatches, successRate });
    
    // 평균 평점 계산 - 받은 리뷰만 계산
    const averageRating = receivedReviews.length > 0 
      ? receivedReviews.reduce((sum: number, review: any) => {
          const rating = review.rating;
          return sum + (rating.appearance + rating.conversation + rating.manners + rating.honesty) / 4;
        }, 0) / receivedReviews.length
      : 0;
    
    console.log('평균 평점:', averageRating);
    
    // 선호 지역 분석 - 성공/완료/종료된 매칭만 집계 (실제 앱 기준)
    const locationCounts: { [key: string]: number } = {};
    userHistory.forEach((history: any) => {
      // 성공/완료/종료된 매칭만 집계
      if (history.final_status === 'exchanged' || history.final_status === 'completed' || history.final_status === 'finished') {
        const isUserA = history.request_a && history.request_a.requester_id === userId;
        const userRequest = isUserA ? history.request_a : history.request_b;
        const location = userRequest?.date_address || userRequest?.final_location;
        if (location) {
          // region+district(예: '서울 강남구')까지 반영
          const parts = location.split(' ');
          const regionKey = parts.length >= 2 ? parts.slice(0, 2).join(' ') : location;
          locationCounts[regionKey] = (locationCounts[regionKey] || 0) + 1;
        }
      }
    });
    const favoriteRegion = Object.keys(locationCounts).length > 0 
      ? Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b)
      : '없음';
    
    console.log('선호 지역:', favoriteRegion, locationCounts);
    
    // 대화 스타일 분석 - 본인이 작성한 리뷰에서 추출
    const conversationStyles: { [key: string]: number } = {};
    userReviews.forEach((review: any) => {
      if (review.conversation_initiative) {
        conversationStyles[review.conversation_initiative] = 
          (conversationStyles[review.conversation_initiative] || 0) + 1;
      }
    });
    
    console.log('대화 스타일 분석:', conversationStyles);
    
    // 대화 스타일 분석 개선
    let dominantStyle = '없음';
    if (Object.keys(conversationStyles).length > 0) {
      const maxCount = Math.max(...Object.values(conversationStyles));
      const dominantStyles = Object.keys(conversationStyles).filter(style => conversationStyles[style] === maxCount);
      
      if (dominantStyles.length === 1) {
        dominantStyle = dominantStyles[0];
      } else if (dominantStyles.includes('나') && dominantStyles.includes('상대방')) {
        dominantStyle = '균형잡힌';
      } else {
        dominantStyle = dominantStyles[0];
      }
    }
    
    console.log('주요 대화 스타일:', dominantStyle);
    
    // 인사이트 카드 생성
    const insightCards = [];
    
    // 1. 성향 분석 카드 (1회 이상 소개팅 완료 시)
    if (totalMatches >= 1) {
      const styleDescription = dominantStyle === '나' ? '적극적인 대화 스타일' : 
                             dominantStyle === '상대방' ? '경청하는 대화 스타일' : 
                             dominantStyle === '균형잡힌' ? '균형잡힌 대화 스타일' : '분석 불가';
      
      const ratingDescription = averageRating >= 4.5 ? '매우 높은 평점' :
                               averageRating >= 4.0 ? '높은 평점' :
                               averageRating >= 3.5 ? '보통 평점' : '개선 필요';
      
      insightCards.push({
        id: 'personality',
        title: '성향 분석',
        description: `${styleDescription}을 보이며, ${ratingDescription}을 받고 있습니다.`,
        isLocked: false,
        data: {
          totalMatches,
          successRate,
          averageRating: Math.round(averageRating * 10) / 10,
          favoriteRegion,
          dominantStyle,
          styleDescription,
          ratingDescription
        }
      });
    } else {
      insightCards.push({
        id: 'personality',
        title: '성향 분석',
        description: '소개팅 1회 완료 시 해금됩니다.',
        isLocked: true
      });
    }
    
    // 2. 매칭 성공률 그래프 (3회 이상 시)
    if (totalMatches >= 3) {
      insightCards.push({
        id: 'success_rate',
        title: '매칭 성공률 추이',
        description: `현재 성공률 ${successRate}%로, 평균보다 ${successRate > 50 ? '높은' : '낮은'} 수준입니다.`,
        isLocked: false,
        data: {
          successRate,
          totalMatches,
          successfulMatches
        }
      });
    } else {
      insightCards.push({
        id: 'success_rate',
        title: '매칭 성공률 추이',
        description: '소개팅 3회 완료 시 해금됩니다.',
        isLocked: true
      });
    }
    
    // 3. 대화 스타일 요약 (1회 이상 시)
    if (totalMatches >= 1) {
      const styleDescription = dominantStyle === '나' ? '적극적인 대화 스타일' : 
                             dominantStyle === '상대방' ? '경청하는 대화 스타일' : 
                             dominantStyle === '균형잡힌' ? '균형잡힌 대화 스타일' : '분석 불가';
      insightCards.push({
        id: 'conversation_style',
        title: '대화 스타일 요약',
        description: styleDescription,
        isLocked: false,
        data: {
          dominantStyle,
          totalReviews: userReviews.length
        }
      });
    } else {
      insightCards.push({
        id: 'conversation_style',
        title: '대화 스타일 요약',
        description: '첫 소개팅 이후 분석이 시작됩니다.',
        isLocked: true
      });
    }
    
    // 4. 맞춤 피드백 (2회 이상 시)
    if (totalMatches >= 2) {
      const feedback = successRate >= 70 ? '매우 좋은 매칭 성과를 보이고 있습니다!' :
                      successRate >= 50 ? '평균적인 매칭 성과입니다. 조금만 더 노력해보세요.' :
                      '매칭 성공률을 높이기 위해 프로필을 개선해보는 것을 추천합니다.';
      insightCards.push({
        id: 'custom_feedback',
        title: '맞춤 피드백',
        description: feedback,
        isLocked: false,
        data: {
          feedback,
          successRate,
          totalMatches
        }
      });
    } else {
      insightCards.push({
        id: 'custom_feedback',
        title: '맞춤 피드백',
        description: '소개팅 2회 완료 시 해금됩니다.',
        isLocked: true
      });
    }
    
    console.log('생성된 인사이트 카드:', insightCards.length, '개');
    
    await appendLog({
      type: 'insight_get',
      userId,
      result: 'success',
      detail: { 
        totalMatches, 
        successRate, 
        cardsCount: insightCards.length 
      },
      action: '인사이트 조회',
      screen: 'InsightScreen',
      component: 'insight_list'
    });
    
    // 응답 데이터를 프론트엔드 타입에 맞게 구성
    const response = {
      userId,
      totalMatches,
      successfulMatches,
      successRate,
      averageRating: Math.round(averageRating * 10) / 10,
      favoriteRegion,
      dominantStyle,
      insightCards: insightCards.map(card => ({
        id: card.id,
        title: card.title,
        description: card.description,
        isLocked: card.isLocked,
        data: card.data
      }))
    };
    
    console.log('응답 데이터:', response);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('인사이트 조회 오류:', error);
    
    await appendLog({
      type: 'insight_get',
      userId,
      result: 'fail',
      message: '인사이트 조회 실패',
      errorStack: error instanceof Error ? error.stack : '',
      action: '인사이트 조회',
      screen: 'InsightScreen',
      component: 'insight_list'
    });
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: '인사이트 조회 중 오류가 발생했습니다.' }) 
    };
  }
}; 

// 히스토리 조회
export const getHistory = async (event: any) => {
  const { userId } = event.pathParameters || {};
  const page = parseInt(event.queryStringParameters?.page || '1', 10);
  const pageSize = parseInt(event.queryStringParameters?.pageSize || '10', 10);
  
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  console.log('히스토리 조회 요청:', { userId, page, pageSize });
  
  try {
    // matching-history.json에서 사용자의 히스토리 조회
    const matchingHistoryPath = path.join(__dirname, 'data/matching-history.json');
    const matchingHistory = readJson(matchingHistoryPath);
    const profiles = readJson(profilesPath);
    
    // 사용자가 참여한 히스토리 찾기 (request_a 또는 request_b에서 사용자 ID 확인)
    const userHistory = matchingHistory.filter((history: any) => {
      return (history.request_a && history.request_a.requester_id === userId) || 
             (history.request_b && history.request_b.requester_id === userId);
    });
    
    // 파트너 정보 추가
    const enrichedHistory = userHistory.map((history: any) => {
      // 현재 사용자의 요청과 상대방 요청 찾기
      const isUserA = history.request_a && history.request_a.requester_id === userId;
      const userRequest = isUserA ? history.request_a : history.request_b;
      const partnerRequest = isUserA ? history.request_b : history.request_a;
      const partnerId = userRequest?.partner_id;
      
      const partnerProfile = profiles.find((p: any) => p.user_id === partnerId);
      
      // 파트너 프로필 정보 (finished 상태일 때는 연락처 정보 제외)
      let partnerInfo = null;
      if (partnerProfile) {
        if (history.final_status === 'finished') {
          // finished 상태일 때는 기본 정보만 제공 (연락처 정보 제외)
          partnerInfo = {
            name: partnerProfile.name,
            age: partnerProfile.age,
            location: partnerProfile.location,
            photos: [] // 사진도 제외
          };
        } else {
          // 다른 상태일 때는 모든 정보 제공
          partnerInfo = {
            name: partnerProfile.name,
            age: partnerProfile.age,
            location: partnerProfile.location,
            photos: partnerProfile.photos || []
          };
        }
      }
      
      return {
        user_id: userId,
        timestamp: history.finished_at || history.created_at,
        match_pair_id: history.match_pair_id,
        partner_id: partnerId,
        status: history.final_status,
        schedule_date: userRequest?.final_date ? new Date(userRequest.final_date).toISOString().split('T')[0] : null,
        date_location: userRequest?.final_location || userRequest?.date_address,
        contact_shared: history.final_status === 'exchanged',
        both_interested: history.review_a?.want_to_meet_again && history.review_b?.want_to_meet_again,
        review_submitted: !!(history.review_a && history.review_b),
        points_used: 100,
        points_refunded: userRequest?.points_refunded ? 100 : 0,
        partner: partnerInfo,
        // 추가 상세 정보
        match_a_id: history.match_a_id,
        match_b_id: history.match_b_id,
        contact_exchanged_at: history.contact_exchanged_at,
        finished_at: history.finished_at,
        created_at: history.created_at,
        // 연락처 정보 제외 (개인정보 보호)
        user_request: userRequest ? {
          match_id: userRequest.match_id,
          requester_id: userRequest.requester_id,
          status: userRequest.status,
          created_at: userRequest.created_at,
          updated_at: userRequest.updated_at,
          final_date: userRequest.final_date,
          final_location: userRequest.final_location,
          date_address: userRequest.date_address,
          points_refunded: userRequest.points_refunded
        } : null,
        partner_request: partnerRequest ? {
          match_id: partnerRequest.match_id,
          requester_id: partnerRequest.requester_id,
          status: partnerRequest.status,
          created_at: partnerRequest.created_at,
          updated_at: partnerRequest.updated_at,
          final_date: partnerRequest.final_date,
          final_location: partnerRequest.final_location,
          date_address: partnerRequest.date_address,
          points_refunded: partnerRequest.points_refunded
        } : null
      };
    });
    
    // 날짜순 정렬 (최신순)
    enrichedHistory.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedHistory = enrichedHistory.slice(startIndex, endIndex);
    
    await appendLog({
      type: 'history_get',
      userId,
      result: 'success',
      detail: { 
        page, 
        pageSize, 
        total: enrichedHistory.length, 
        returned: pagedHistory.length 
      },
      action: '히스토리 조회',
      screen: 'HistoryScreen',
      component: 'history_list'
    });
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({
        history: pagedHistory.map(snakeToCamelCase),
        pagination: {
          page,
          pageSize,
          total: enrichedHistory.length,
          totalPages: Math.ceil(enrichedHistory.length / pageSize)
        }
      })
    };
  } catch (error) {
    console.error('히스토리 조회 오류:', error);
    
    await appendLog({
      type: 'history_get',
      userId,
      result: 'fail',
      message: '히스토리 조회 실패',
      errorStack: error instanceof Error ? error.stack : '',
      action: '히스토리 조회',
      screen: 'HistoryScreen',
      component: 'history_list'
    });
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: '히스토리 조회 중 오류가 발생했습니다.' }) 
    };
  }
}; 

// 리워드 조회
export const getReward = async (event: any) => {
  try {
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // 사용자 정보에서 현재 포인트 조회
    const users = readJson(usersPath);
    const user = users.find((u: any) => u.user_id === userId);
    
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // 포인트 히스토리 조회
    const pointsHistory = readJson(pointsHistoryPath);
    const userPointsHistory = pointsHistory.filter((history: any) => history.user_id === userId);

    // 리워드 정보 구성
    const reward = {
      currentPoints: user.points || 0,
      totalEarned: userPointsHistory
        .filter((h: any) => h.type === 'earn')
        .reduce((sum: number, h: any) => sum + (h.points || 0), 0),
      totalSpent: userPointsHistory
        .filter((h: any) => h.type === 'spend')
        .reduce((sum: number, h: any) => sum + (h.points || 0), 0),
      pointsHistory: userPointsHistory.slice(-10), // 최근 10개 기록
      availableRewards: [
        { id: 'reward-1', name: '프리미엄 매칭', points: 100, description: '더 정확한 매칭을 위한 프리미엄 서비스' },
        { id: 'reward-2', name: '프로필 부스터', points: 50, description: '프로필을 상단에 노출시키는 서비스' },
        { id: 'reward-3', name: '추가 소개팅', points: 200, description: '추가 소개팅 기회 제공' }
      ]
    };

    await appendLog({
      type: 'get_reward',
      userId: userId,
      result: 'success',
      message: '리워드 조회 성공',
      detail: { 
        currentPoints: reward.currentPoints,
        totalEarned: reward.totalEarned,
        totalSpent: reward.totalSpent,
        historyCount: userPointsHistory.length
      },
      action: '리워드 조회',
      screen: 'RewardScreen',
      component: 'reward'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(reward)
    };

  } catch (error: any) {
    console.error('getReward error:', error);
    
    await appendLog({
      type: 'get_reward',
      userId: event.pathParameters?.userId,
      result: 'fail',
      message: '리워드 조회 실패',
      detail: { error: error.message },
      action: '리워드 조회',
      screen: 'RewardScreen',
      component: 'reward'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 

// 매칭 제안 응답 API
export const respondToProposal = async (event: any) => {
  try {
    const startTime = Date.now();
    const matchId = event.pathParameters?.matchId;
    const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
    const { response } = req; // 'accept' 또는 'reject'

    if (!matchId || !response) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'matchId and response are required' })
      };
    }

    if (!['accept', 'reject'].includes(response)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'response must be either "accept" or "reject"' })
      };
    }

    // 매칭 요청 조회
    const matchingRequests = readJson(matchingRequestsPath);
    const matchingRequest = matchingRequests.find((req: any) => req.match_id === matchId);
    
    if (!matchingRequest) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Matching request not found' })
      };
    }

    // 매칭 페어 조회
    const matchPairs = readJson(matchPairsPath);
    const matchPair = matchPairs.find((pair: any) => pair.match_b_id === matchId);
    
    if (!matchPair) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Match pair not found' })
      };
    }

    // 제안 조회
    const proposes = readJson(proposePath);
    const propose = proposes.find((p: any) => p.match_pair_id === matchPair.match_pair_id);
    
    if (!propose) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Proposal not found' })
      };
    }

    const now = new Date().toISOString();

    if (response === 'accept') {
      // 수락 처리
      
      // 1. 제안 상태를 accept로 변경
      propose.status = 'accept';
      propose.updated_at = now;
      propose.responded_at = now;
      propose.response = response;
      writeJson(proposePath, proposes);

      // 2. user-1의 매칭 요청 상태를 matched로 변경
      const user1MatchRequest = matchingRequests.find((req: any) => req.match_id === matchPair.match_a_id);
      if (user1MatchRequest) {
        user1MatchRequest.status = 'matched';
        user1MatchRequest.updated_at = now;
        writeJson(matchingRequestsPath, matchingRequests);
      }

      // 3. user-2의 새로운 매칭 요청 생성 (matched 상태)
      const newRequest = {
        match_id: matchPair.match_b_id,
        requester_id: propose.target_id,
        status: 'matched',
        created_at: now,
        updated_at: now,
        photo_visible_at: null,
        is_manual: true,
        date_choices: { dates: [], locations: [] },
        choices_submitted_at: null,
        final_date: null,
        final_location: null,
        failure_reason: null,
        points_refunded: false,
        match_pair_id: null,
        partner_id: null
      };
      
      matchingRequests.push(newRequest);
      writeJson(matchingRequestsPath, matchingRequests);

      // 4. 매칭 페어 상태를 matched로 변경
      matchPair.status = 'matched';
      matchPair.confirm_proposed = true;
      matchPair.updated_at = now;
      writeJson(matchPairsPath, matchPairs);

      await appendLog({
        type: 'proposal_response',
        userId: matchingRequest.requester_id,
        result: 'success',
        message: '매칭 제안 수락 처리 완료',
        detail: { 
          matchId,
          response,
          matchPairId: matchPair.match_pair_id,
          proposeId: propose.propose_id
        },
        action: '제안 수락',
        screen: 'MainScreen',
        component: 'proposal_modal',
        executionTime: Date.now() - startTime
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: '매칭 제안이 수락되었습니다.',
          status: 'matched'
        })
      };

    } else {
      // 거절 처리
      
      // 1. 제안 상태를 refuse로 변경
      propose.status = 'refuse';
      propose.updated_at = now;
      propose.responded_at = now;
      propose.response = response;
      writeJson(proposePath, proposes);

      // 2. user-1의 매칭 요청 상태를 waiting으로 유지 (다른 매칭 시도 가능)
      const user1MatchRequest = matchingRequests.find((req: any) => req.match_id === matchPair.match_a_id);
      if (user1MatchRequest) {
        user1MatchRequest.status = 'waiting';
        user1MatchRequest.updated_at = now;
        writeJson(matchingRequestsPath, matchingRequests);
      }

      // 3. 매칭 페어 상태를 finished로 변경
      matchPair.status = 'finished';
      matchPair.confirm_proposed = false;
      matchPair.updated_at = now;
      writeJson(matchPairsPath, matchPairs);

      await appendLog({
        type: 'proposal_response',
        userId: matchingRequest.requester_id,
        result: 'success',
        message: '매칭 제안 거절 처리 완료',
        detail: { 
          matchId,
          response,
          matchPairId: matchPair.match_pair_id,
          proposeId: propose.propose_id
        },
        action: '제안 거절',
        screen: 'MainScreen',
        component: 'proposal_modal',
        executionTime: Date.now() - startTime
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: '매칭 제안이 거절되었습니다.',
          status: 'finished'
        })
      };
    }

  } catch (error: any) {
    console.error('respondToProposal error:', error);
    
    await appendLog({
      type: 'proposal_response',
      userId: event.pathParameters?.matchId,
      result: 'fail',
      message: '매칭 제안 응답 처리 실패',
      detail: { error: error.message },
      action: '제안 응답',
      screen: 'MainScreen',
      component: 'proposal_modal'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// 매칭 상태 자동 전환 및 실패 처리 API
export const processMatchingStatus = async (event: any) => {
  try {
    const startTime = Date.now();
    
    // 1. 일정 선택 완료 확인 및 confirmed 상태 전환
    const matchingRequests = readJson(matchingRequestsPath);
    const matchPairs = readJson(matchPairsPath);
    const users = readJson(usersPath);
    const pointsHistory = readJson(pointsHistoryPath);
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let updated = false;
    
    // 매칭 페어별로 상태 확인
    for (const pair of matchPairs) {
      const matchA = matchingRequests.find((req: any) => req.match_id === pair.match_a_id);
      const matchB = matchingRequests.find((req: any) => req.match_id === pair.match_b_id);
      
      if (!matchA || !matchB) continue;
      
      // 1. 양측 일정 선택 완료 시 confirmed 상태로 전환
      if (pair.status === 'matched' && 
          matchA.choices_submitted_at && 
          matchB.choices_submitted_at) {
        
        // 공통 날짜/장소 찾기
        const commonDates = matchA.date_choices.dates.filter((date: string) => 
          matchB.date_choices.dates.includes(date)
        );
        const commonLocations = matchA.date_choices.locations.filter((location: string) => 
          matchB.date_choices.locations.includes(location)
        );
        
        if (commonDates.length > 0 && commonLocations.length > 0) {
          // 자동으로 첫 번째 공통 날짜/장소 선택
          const suggestedDate = commonDates[0];
          const suggestedLocation = commonLocations[0];
          
          // 상태를 confirmed로 변경
          pair.status = 'confirmed';
          pair.confirmed_at = now.toISOString();
          pair.schedule_date = suggestedDate;
          pair.date_location = suggestedLocation;
          pair.updated_at = now.toISOString();
          
          // 매칭 요청 상태도 confirmed로 변경
          matchA.status = 'confirmed';
          matchA.updated_at = now.toISOString();
          matchB.status = 'confirmed';
          matchB.updated_at = now.toISOString();
          
          updated = true;
        }
      }
      
      // 2. 7일 초과 미응답 시 실패 처리
      if (pair.status === 'matched' && 
          pair.created_at && 
          new Date(pair.created_at) < sevenDaysAgo) {
        
        // 실패 처리
        pair.status = 'finished';
        pair.failed_at = now.toISOString();
        pair.failure_reason = 'timeout_no_response';
        pair.updated_at = now.toISOString();
        
        // 매칭 요청 상태를 failed로 변경
        if (matchA) {
          matchA.status = 'failed';
          matchA.failure_reason = 'timeout_no_response';
          matchA.updated_at = now.toISOString();
        }
        if (matchB) {
          matchB.status = 'failed';
          matchB.failure_reason = 'timeout_no_response';
          matchB.updated_at = now.toISOString();
        }
        
        // 포인트 반환
        if (matchA && !matchA.points_refunded) {
          const userA = users.find((u: any) => u.user_id === matchA.requester_id);
          if (userA) {
            userA.points = (userA.points || 0) + 100;
            pointsHistory.push({
              history_id: uuidv4(),
              user_id: matchA.requester_id,
              type: 'refund',
              points: 100,
              description: '매칭 실패로 인한 포인트 반환',
              created_at: now.toISOString()
            });
            matchA.points_refunded = true;
          }
        }
        if (matchB && !matchB.points_refunded) {
          const userB = users.find((u: any) => u.user_id === matchB.requester_id);
          if (userB) {
            userB.points = (userB.points || 0) + 100;
            pointsHistory.push({
              history_id: uuidv4(),
              user_id: matchB.requester_id,
              type: 'refund',
              points: 100,
              description: '매칭 실패로 인한 포인트 반환',
              created_at: now.toISOString()
            });
            matchB.points_refunded = true;
          }
        }
        
        updated = true;
      }
      
      // 3. 30일 초과 미진행 시 실패 처리
      if (pair.status === 'confirmed' && 
          pair.confirmed_at && 
          new Date(pair.confirmed_at) < thirtyDaysAgo) {
        
        // 실패 처리
        pair.status = 'finished';
        pair.failed_at = now.toISOString();
        pair.failure_reason = 'timeout_no_meeting';
        pair.updated_at = now.toISOString();
        
        // 매칭 요청 상태를 failed로 변경
        if (matchA) {
          matchA.status = 'failed';
          matchA.failure_reason = 'timeout_no_meeting';
          matchA.updated_at = now.toISOString();
        }
        if (matchB) {
          matchB.status = 'failed';
          matchB.failure_reason = 'timeout_no_meeting';
          matchB.updated_at = now.toISOString();
        }
        
        updated = true;
      }
    }
    
    // 변경사항이 있으면 파일 저장
    if (updated) {
      writeJson(matchingRequestsPath, matchingRequests);
      writeJson(matchPairsPath, matchPairs);
      writeJson(usersPath, users);
      writeJson(pointsHistoryPath, pointsHistory);
    }
    
    await appendLog({
      type: 'process_matching_status',
      result: 'success',
      message: '매칭 상태 자동 처리 완료',
      detail: { 
        processedPairs: matchPairs.length,
        updated: updated
      },
      action: '매칭 상태 처리',
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: '매칭 상태 처리 완료',
        updated: updated
      })
    };

  } catch (error: any) {
    console.error('processMatchingStatus error:', error);
    
    await appendLog({
      type: 'process_matching_status',
      result: 'fail',
      message: '매칭 상태 자동 처리 실패',
      detail: { error: error.message },
      action: '매칭 상태 처리'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// 연락처 공유 처리 (쌍방 YES 선택 시)
export const shareContact = async (event: any) => {
  const { match_pair_id, user_id, want_to_meet_again } = JSON.parse(event.body || '{}');
  
  const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
  const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
  const matchIndex = matchPairs.findIndex((match: any) => match.match_pair_id === match_pair_id);
  
  if (matchIndex >= 0) {
    const match = matchPairs[matchIndex];
    const now = new Date().toISOString();
    
    // 사용자의 재만남 의사 저장
    if (match.user_a_id === user_id) {
      match.user_a_want_to_meet_again = want_to_meet_again;
    } else if (match.user_b_id === user_id) {
      match.user_b_want_to_meet_again = want_to_meet_again;
    }
    
    // 양측 모두 YES인지 확인
    if (match.user_a_want_to_meet_again === true && match.user_b_want_to_meet_again === true) {
      // 연락처 공유 활성화
      match.contact_shared = true;
      match.both_interested = true;
      match.status = 'finished';
      match.finished_at = now;
      match.updated_at = now;
      
      // matching-requests 상태도 같이 변경
      const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
      const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
      
      [match.match_a_id, match.match_b_id].forEach((mid: string) => {
        const reqIdx = matchingRequests.findIndex((req: any) => req.match_id === mid);
        if (reqIdx >= 0) {
          matchingRequests[reqIdx].status = 'finished';
          matchingRequests[reqIdx].updated_at = now;
        }
      });
      writeJson(matchingRequestsPath, matchingRequests);
    }
    
    writeJson(matchPairsPath, matchPairs);
    
    await appendLog({
      type: 'contact_share_updated',
      userId: user_id,
      result: 'success',
      detail: { match_pair_id, want_to_meet_again, contact_shared: match.contact_shared },
      action: '연락처 공유 처리',
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        contact_shared: match.contact_shared,
        both_interested: match.both_interested
      })
    };
  }
  
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Match pair not found' })
  };
};

// 매칭 제안 응답 API (propose_id 기반)
export const respondToProposalByProposeId = async (event: any) => {
  try {
    const startTime = Date.now();
    const proposeId = event.pathParameters?.proposeId;
    const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
    const { response } = req; // 'accept' 또는 'reject'

    if (!proposeId || !response) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'proposeId and response are required' })
      };
    }

    if (!['accept', 'reject'].includes(response)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'response must be either "accept" or "reject"' })
      };
    }

    // 제안 조회
    const proposes = readJson(proposePath);
    const propose = proposes.find((p: any) => p.propose_id === proposeId);
    
    if (!propose) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Proposal not found' })
      };
    }

    if (propose.status !== 'propose') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Proposal is not in pending status' })
      };
    }

    const now = new Date().toISOString();

    if (response === 'accept') {
      // 수락 처리
      
      // 1. 제안 상태를 accept로 변경
      propose.status = 'accept';
      propose.updated_at = now;
      propose.responded_at = now;
      propose.response = response;
      writeJson(proposePath, proposes);

      // 2. user-1의 매칭 요청 상태를 matched로 변경
      const matchingRequests = readJson(matchingRequestsPath);
      const user1MatchRequest = matchingRequests.find((req: any) => req.requester_id === propose.propose_user_id);
      if (user1MatchRequest) {
        user1MatchRequest.status = 'matched';
        user1MatchRequest.updated_at = now;
        user1MatchRequest.partner_id = propose.target_id;
        writeJson(matchingRequestsPath, matchingRequests);
      }

      // 3. user-2의 매칭 요청 상태를 matched로 변경
      const user2MatchRequest = matchingRequests.find((req: any) => req.requester_id === propose.target_id);
      if (user2MatchRequest) {
        user2MatchRequest.status = 'matched';
        user2MatchRequest.updated_at = now;
        user2MatchRequest.partner_id = propose.propose_user_id;
        writeJson(matchingRequestsPath, matchingRequests);
      }

      // 4. 매칭 페어 생성
      const matchPairs = readJson(matchPairsPath);
      const newMatchPair = {
        match_pair_id: `pair-${Date.now()}`,
        match_a_id: user1MatchRequest?.match_id || 'unknown',
        match_b_id: user2MatchRequest?.match_id || 'unknown',
        is_proposed: true,
        confirm_proposed: true,
        attempt_count: 0,
        contact_shared: false,
        both_interested: false,
        created_at: now,
        updated_at: now
      };
      
      matchPairs.push(newMatchPair);
      writeJson(matchPairsPath, matchPairs);

      // 5. propose에 match_pair_id 연결
      propose.match_pair_id = newMatchPair.match_pair_id;
      writeJson(proposePath, proposes);

      await appendLog({
        type: 'proposal_response',
        userId: propose.target_id,
        result: 'success',
        message: '매칭 제안 수락 처리 완료',
        detail: { 
          proposeId,
          response,
          matchPairId: newMatchPair.match_pair_id,
          user1Id: propose.propose_user_id,
          user2Id: propose.target_id
        },
        action: '제안 수락',
        screen: 'MainScreen',
        component: 'proposal_modal',
        executionTime: Date.now() - startTime
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: '매칭 제안이 수락되었습니다.',
          status: 'matched'
        })
      };

    } else {
      // 거절 처리
      
      // 1. 제안 상태를 refuse로 변경
      propose.status = 'refuse';
      propose.updated_at = now;
      propose.responded_at = now;
      propose.response = response;
      writeJson(proposePath, proposes);

      await appendLog({
        type: 'proposal_response',
        userId: propose.target_id,
        result: 'success',
        message: '매칭 제안 거절 처리 완료',
        detail: { 
          proposeId,
          response,
          user1Id: propose.propose_user_id,
          user2Id: propose.target_id
        },
        action: '제안 거절',
        screen: 'MainScreen',
        component: 'proposal_modal',
        executionTime: Date.now() - startTime
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: '매칭 제안이 거절되었습니다.',
          status: 'refused'
        })
      };
    }

  } catch (error: any) {
    console.error('respondToProposalByProposeId error:', error);
    
    await appendLog({
      type: 'proposal_response',
      userId: event.pathParameters?.proposeId,
      result: 'fail',
      message: '매칭 제안 응답 처리 실패',
      detail: { error: error.message },
      action: '제안 응답',
      screen: 'MainScreen',
      component: 'proposal_modal'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 

export const saveReviewContact = async (event: any) => {
  const { match_id, reviewer_id, contact } = JSON.parse(event.body || '{}');
  if (!match_id || !reviewer_id || !contact) {
    return { statusCode: 400, body: JSON.stringify({ error: '필수 파라미터 누락' }) };
  }
  const reviewsPath = path.join(__dirname, 'data/reviews.json');
  const reviews = fs.existsSync(reviewsPath) ? readJson(reviewsPath) : [];
  const idx = reviews.findIndex((r: any) => r.match_id === match_id && r.reviewer_id === reviewer_id);
  if (idx === -1) {
    return { statusCode: 404, body: JSON.stringify({ error: '리뷰를 찾을 수 없습니다.' }) };
  }
  reviews[idx].contact = contact;
  reviews[idx].contact_shared_at = new Date().toISOString();
  writeJson(reviewsPath, reviews);

  // 연락처가 양쪽 모두 입력되면 MatchingRequests 상태 exchanged로 변경
  const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
  const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
  const matchPair = matchPairs.find((m: any) => m.match_a_id === match_id || m.match_b_id === match_id);
  if (matchPair) {
    const reviewsA = reviews.find((r: any) => r.match_id === matchPair.match_a_id);
    const reviewsB = reviews.find((r: any) => r.match_id === matchPair.match_b_id);
    if (reviewsA?.contact && reviewsB?.contact) {
      const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
      const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
      [matchPair.match_a_id, matchPair.match_b_id].forEach((mid: string) => {
        const reqIdx = matchingRequests.findIndex((req: any) => req.match_id === mid);
        if (reqIdx >= 0) {
          matchingRequests[reqIdx].status = 'exchanged';
          matchingRequests[reqIdx].updated_at = new Date().toISOString();
        }
      });
      writeJson(matchingRequestsPath, matchingRequests);
    }
  }

  await appendLog({
    type: 'review_contact_saved',
    userId: reviewer_id,
    result: 'success',
    detail: { match_id, reviewer_id, contact },
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// 연락처 상세 정보 조회
export const getContactDetail = async (event: any) => {
  const matchId = event.queryStringParameters?.matchId;
  const userId = event.headers?.userid;
  
  if (!matchId || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'matchId와 userId가 필요합니다.' }) };
  }

  try {
    const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
    const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
    const matchPair = matchPairs.find((m: any) => m.match_a_id === matchId || m.match_b_id === matchId);
    
    if (!matchPair) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 정보를 찾을 수 없습니다.' }) };
    }

    const reviewsPath = path.join(__dirname, 'data/reviews.json');
    const reviews = fs.existsSync(reviewsPath) ? readJson(reviewsPath) : [];
    const profilesPath = path.join(__dirname, 'data/profiles.json');
    const profiles = fs.existsSync(profilesPath) ? readJson(profilesPath) : [];
    const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
    const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];

    // 현재 사용자와 상대방의 매칭 요청 찾기
    const myRequest = matchingRequests.find((r: any) => r.match_id === matchId && r.requester_id === userId);
    const otherRequest = matchingRequests.find((r: any) => 
      (r.match_id === matchPair.match_a_id || r.match_id === matchPair.match_b_id) && r.requester_id !== userId
    );

    if (!myRequest || !otherRequest) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 요청 정보를 찾을 수 없습니다.' }) };
    }

    // 상대방 프로필 정보
    const otherProfile = profiles.find((p: any) => p.user_id === otherRequest.requester_id);
    
    // 디버깅 로그 추가
    console.log('=== getContactDetail Debug ===');
    console.log('otherRequest.requester_id:', otherRequest.requester_id);
    console.log('otherProfile:', otherProfile);
    console.log('otherProfile?.photos:', otherProfile?.photos);
    console.log('============================');
    
    // 상대방 연락처 정보
    const otherReview = reviews.find((r: any) => r.match_id === otherRequest.match_id);
    const contact = otherReview?.contact || null;

    await appendLog({
      type: 'contact_detail_viewed',
      userId: userId,
      result: 'success',
      detail: { matchId, otherUserId: otherRequest.requester_id },
      action: '연락처 상세 조회',
      screen: 'ContactDetailScreen',
      component: 'contact_detail'
    });

    // 실제 photos 배열 사용
    const photos = otherProfile?.photos || [];
    
    console.log('=== getContactDetail Response Debug ===');
    console.log('otherProfile.user_id:', otherProfile?.user_id);
    console.log('otherProfile.photos:', otherProfile?.photos);
    console.log('최종 photos:', photos);
    console.log('=====================================');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        contact,
        profile: otherProfile ? {
          userId: otherProfile.user_id,
          name: otherProfile.name || '',
          job: otherProfile.job || '',
          region: otherProfile.region?.region || '',
          photoUrl: otherProfile.photos?.[0] || null,
          photos: photos, // 실제 photos 배열 사용
        } : null
      })
    };

  } catch (error: any) {
    console.error('getContactDetail error:', error);
    
    await appendLog({
      type: 'contact_detail_viewed',
      userId: userId,
      result: 'fail',
      message: '연락처 상세 조회 실패',
      detail: { error: error.message, matchId },
      action: '연락처 상세 조회',
      screen: 'ContactDetailScreen',
      component: 'contact_detail'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

export const finishMeeting = async (event: any) => {
  const { match_id, user_id } = JSON.parse(event.body || '{}');
  if (!match_id || !user_id) {
    return { statusCode: 400, body: JSON.stringify({ error: '필수 파라미터 누락' }) };
  }

  try {
    const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
    const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
    const matchPair = matchPairs.find((m: any) => m.match_a_id === match_id || m.match_b_id === match_id);
    
    if (!matchPair) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 쌍을 찾을 수 없습니다.' }) };
    }

    const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
    const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
    
    // 현재 사용자의 매칭 요청 찾기
    const myRequest = matchingRequests.find((r: any) => r.match_id === match_id && r.requester_id === user_id);
    if (!myRequest) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 요청을 찾을 수 없습니다.' }) };
    }

    // 현재 사용자의 상태를 finished로 변경
    myRequest.status = 'finished';
    myRequest.updated_at = new Date().toISOString();
    writeJson(matchingRequestsPath, matchingRequests);

    // 상대방의 매칭 요청 찾기
    const otherMatchId = match_id === matchPair.match_a_id ? matchPair.match_b_id : matchPair.match_a_id;
    const otherRequest = matchingRequests.find((r: any) => r.match_id === otherMatchId);
    
    let existingHistory = null;
    let historySaved = false;
    
    // 상대방도 finished 상태인지 확인
    if (otherRequest && otherRequest.status === 'finished') {
      // 둘 다 finished 상태이면 matching-history로 이동하고 matching-requests에서 삭제
      const reviewsPath = path.join(__dirname, 'data/reviews.json');
      const reviews = fs.existsSync(reviewsPath) ? readJson(reviewsPath) : [];
      const reviewA = reviews.find((r: any) => r.match_id === matchPair.match_a_id);
      const reviewB = reviews.find((r: any) => r.match_id === matchPair.match_b_id);
      
      // 이력 저장
      const historyPath = path.join(__dirname, 'data/matching-history.json');
      const history = fs.existsSync(historyPath) ? readJson(historyPath) : [];
      
      // 이미 history에 있는지 확인
      existingHistory = history.find((h: any) => h.match_pair_id === matchPair.match_pair_id);
      
      if (!existingHistory) {
        // 연락처 교환 완료 시간 및 최종 상태 결정
        const contactExchangedAt = (reviewA?.contact && reviewB?.contact) ? 
          Math.max(
            new Date(reviewA.contact_shared_at || 0).getTime(),
            new Date(reviewB.contact_shared_at || 0).getTime()
          ) : null;
        
        const finalStatus = (reviewA?.contact && reviewB?.contact) ? 'exchanged' : 'finished';
        
        history.push({
          match_pair_id: matchPair.match_pair_id,
          match_a_id: matchPair.match_a_id,
          match_b_id: matchPair.match_b_id,
          contact_a: reviewA?.contact || null,
          contact_b: reviewB?.contact || null,
          contact_exchanged_at: contactExchangedAt ? new Date(contactExchangedAt).toISOString() : null,
          final_status: finalStatus,
          finished_at: new Date().toISOString(),
          review_a: reviewA || null,
          review_b: reviewB || null,
          request_a: matchingRequests.find((r: any) => r.match_id === matchPair.match_a_id) || null,
          request_b: matchingRequests.find((r: any) => r.match_id === matchPair.match_b_id) || null,
          created_at: new Date().toISOString()
        });
        writeJson(historyPath, history);
        historySaved = true;
      }
      
      // 매칭 요청에서 삭제
      const newMatchingRequests = matchingRequests.filter((r: any) => 
        r.match_id !== matchPair.match_a_id && r.match_id !== matchPair.match_b_id
      );
      writeJson(matchingRequestsPath, newMatchingRequests);
    }

    await appendLog({
      type: 'meeting_finished',
      userId: user_id,
      result: 'success',
      detail: { 
        match_pair_id: matchPair.match_pair_id, 
        match_a_id: matchPair.match_a_id, 
        match_b_id: matchPair.match_b_id,
        status: 'finished',
        both_finished: otherRequest && otherRequest.status === 'finished',
        history_saved: historySaved
      },
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error: any) {
    console.error('finishMeeting error:', error);
    
    await appendLog({
      type: 'meeting_finished',
      userId: user_id,
      result: 'fail',
      message: '소개팅 종료 실패',
      detail: { error: error.message, match_id },
    });

    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// 3일 후 자동 삭제 기능
export const cleanupFinishedRequests = async (event: any) => {
  try {
    const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
    const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
    
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3일 전
    
    let deletedCount = 0;
    const requestsToDelete: any[] = [];
    
    // 삭제할 요청들을 먼저 찾기
    matchingRequests.forEach((request: any) => {
      if (request.status === 'finished' && request.updated_at) {
        const finishedAt = new Date(request.updated_at);
        if (finishedAt < threeDaysAgo) {
          requestsToDelete.push(request);
        }
      }
    });
    
    // 삭제할 요청들에 대해 matching-history에 저장
    const historyPath = path.join(__dirname, 'data/matching-history.json');
    const history = fs.existsSync(historyPath) ? readJson(historyPath) : [];
    
    for (const request of requestsToDelete) {
      // 매칭 쌍 정보 찾기
      const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
      const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
      const matchPair = matchPairs.find((m: any) => m.match_a_id === request.match_id || m.match_b_id === request.match_id);
      
      if (matchPair) {
        // 리뷰 정보 찾기
        const reviewsPath = path.join(__dirname, 'data/reviews.json');
        const reviews = fs.existsSync(reviewsPath) ? readJson(reviewsPath) : [];
        const reviewA = reviews.find((r: any) => r.match_id === matchPair.match_a_id);
        const reviewB = reviews.find((r: any) => r.match_id === matchPair.match_b_id);
        
        // 상대방 매칭 요청 찾기
        const otherMatchId = request.match_id === matchPair.match_a_id ? matchPair.match_b_id : matchPair.match_a_id;
        const otherRequest = matchingRequests.find((r: any) => r.match_id === otherMatchId);
        
        // 연락처 교환 완료 시간 및 최종 상태 결정
        const contactExchangedAt = (reviewA?.contact && reviewB?.contact) ? 
          Math.max(
            new Date(reviewA.contact_shared_at || 0).getTime(),
            new Date(reviewB.contact_shared_at || 0).getTime()
          ) : null;
        
        const finalStatus = (reviewA?.contact && reviewB?.contact) ? 'exchanged' : 'finished';
        
        // 이미 history에 있는지 확인
        const existingHistory = history.find((h: any) => h.match_pair_id === matchPair.match_pair_id);
        
        if (!existingHistory) {
          history.push({
            match_pair_id: matchPair.match_pair_id,
            match_a_id: matchPair.match_a_id,
            match_b_id: matchPair.match_b_id,
            contact_a: reviewA?.contact || null,
            contact_b: reviewB?.contact || null,
            contact_exchanged_at: contactExchangedAt ? new Date(contactExchangedAt).toISOString() : null,
            final_status: finalStatus,
            finished_at: request.updated_at,
            review_a: reviewA || null,
            review_b: reviewB || null,
            request_a: matchingRequests.find((r: any) => r.match_id === matchPair.match_a_id) || null,
            request_b: matchingRequests.find((r: any) => r.match_id === matchPair.match_b_id) || null,
            created_at: new Date().toISOString(),
            cleanup_reason: '3일 경과 자동 삭제'
          });
        }
      } else {
        // 매칭 쌍을 찾을 수 없는 경우 로그 기록
        await appendLog({
          type: 'auto_cleanup_finished_request',
          userId: request.requester_id,
          result: 'warning',
          detail: { 
            match_id: request.match_id,
            finished_at: request.updated_at,
            cleanup_reason: '3일 경과 - 매칭 쌍 없음'
          },
        });
      }
      
      // 로그 기록
      await appendLog({
        type: 'auto_cleanup_finished_request',
        userId: request.requester_id,
        result: 'success',
        detail: { 
          match_id: request.match_id,
          finished_at: request.updated_at,
          cleanup_reason: '3일 경과'
        },
      });
    }
    
    // history 저장
    if (requestsToDelete.length > 0) {
      writeJson(historyPath, history);
    }
    
    // 삭제할 요청들을 제외한 나머지 요청들만 유지
    const updatedRequests = matchingRequests.filter((request: any) => {
      if (request.status === 'finished' && request.updated_at) {
        const finishedAt = new Date(request.updated_at);
        if (finishedAt < threeDaysAgo) {
          deletedCount++;
          return false; // 삭제
        }
      }
      return true; // 유지
    });
    
    if (deletedCount > 0) {
      writeJson(matchingRequestsPath, updatedRequests);
      
      await appendLog({
        type: 'cleanup_finished_requests',
        result: 'success',
        detail: { 
          deleted_count: deletedCount,
          total_requests: matchingRequests.length,
          remaining_requests: updatedRequests.length,
          history_saved: true
        },
      });
    }
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        deleted_count: deletedCount,
        total_requests: matchingRequests.length,
        remaining_requests: updatedRequests.length,
        history_saved: requestsToDelete.length > 0
      }) 
    };
  } catch (error: any) {
    console.error('cleanupFinishedRequests error:', error);
    
    await appendLog({
      type: 'cleanup_finished_requests',
      result: 'fail',
      message: '자동 삭제 실패',
      detail: { error: error.message },
    });

    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};