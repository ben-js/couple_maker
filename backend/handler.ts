// 더미 데이터
// User 타입을 email 기반으로 통일
// 회원가입/로그인 모두 email, password만 사용

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { camelToSnakeCase, snakeToCamelCase } from './utils/caseUtils';

const usersPath = path.join(__dirname, 'data/users.json');
const profilesPath = path.join(__dirname, 'data/profiles.json');
const preferencesPath = path.join(__dirname, 'data/preferences.json');
const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
const reviewsPath = path.join(__dirname, 'data/reviews.json');
const reviewStatsPath = path.join(__dirname, 'data/review-stats.json');
const userStatusHistoryPath = path.join(__dirname, 'data/user-status-history.json');
const pointsHistoryPath = path.join(__dirname, 'data/points-history.json');
const logsPath = path.join(__dirname, 'data/logs.json');

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

type User = { 
  user_id: string; 
  email: string; 
  password: string; 
  is_verified: boolean;
  has_profile: boolean; 
  has_preferences: boolean;
  grade: 'general' | 'excellent' | 'gold' | 'vip' | 'vvip';
  status: 'green' | 'yellow' | 'red' | 'black';
  points: number;
  created_at: string;
};
type UserStatus = { userId: string; status: string; date: string };
type UserProfile = { user_id: string; [key: string]: any };
type UserPreferences = { user_id: string; [key: string]: any };

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
      const fileContent = fs.readFileSync(logFilePath, 'utf-8');
      logs = JSON.parse(fileContent);
    }
    
    // 새 로그 추가
    logs.push(logEntry);
    
    // 파일에 저장
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    
    // 콘솔에도 출력 (개발용)
    const logLevel = logEntry.tags.isError ? '❌ ERROR' : logEntry.tags.isSuccess ? '✅ SUCCESS' : 'ℹ️ INFO';
    console.log(`${logLevel} [${type}] ${action || message} - User: ${userId} - Time: ${logEntry.executionTime}ms`);
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
  appendLog({
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
      
      appendLog({
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

    appendLog({
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
        userProfileExists: profiles.some(p => p.userId === user.user_id),
        userPreferencesExists: preferences.some(p => p.userId === user.user_id)
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

    appendLog({
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

  appendLog({
    type: 'profile_save',
    userId: user_id,
    email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: { profile },
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

    appendLog({
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

    appendLog({
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
export const getProfile = async (event: any) => {
  const { userId } = event.pathParameters || {};
  console.log('프로필 조회 요청:', { userId, path: event.requestContext?.http?.path });
  const profiles: UserProfile[] = readJson(profilesPath);
  const profile = profiles.find(p => p.user_id === userId);
  if (profile) {
    const transformedProfile = snakeToCamelCase(profile);
    const responseBody = JSON.stringify(transformedProfile);
    appendLog({
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
  appendLog({
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
    is_manual: false
  };
  
  matchingRequests.push(newRequest);
  writeJson(matchingRequestsPath, matchingRequests);
  
  appendLog({
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
  
  appendLog({
    type: 'matching_confirmed',
    userId: user_a_id,
    result: 'success',
    detail: { match_id, user_a_id, user_b_id },
  });
  
  return { statusCode: 200, body: JSON.stringify({ match_id }) };
};

// 소개팅 일정/장소 선택
export const submitChoices = async (event: any) => {
  const { match_id, user_id, dates, locations } = JSON.parse(event.body || '{}');
  
  const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
  const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
  const matchIndex = matchPairs.findIndex((match: any) => match.match_id === match_id);
  
  if (matchIndex >= 0) {
    const match = matchPairs[matchIndex];
    if (match.user_a_id === user_id) {
      match.user_a_choices = { dates, locations };
    } else if (match.user_b_id === user_id) {
      match.user_b_choices = { dates, locations };
    }
    writeJson(matchPairsPath, matchPairs);
  }
  
  appendLog({
    type: 'choices_submitted',
    userId: user_id,
    result: 'success',
    detail: { match_id, dates, locations },
  });
  
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// 리뷰 저장
export const saveReview = async (event: any) => {
  const { match_id, reviewer_id, target_id, rating, want_to_meet_again, tags, comment } = JSON.parse(event.body || '{}');
  
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
      total_reviews: 0,
      positive_tags: []
    };
    reviewStats.push(targetStats);
  }
  
  // 평균 계산
  targetStats.total_reviews += 1;
  targetStats.avg_appearance = (targetStats.avg_appearance * (targetStats.total_reviews - 1) + rating.appearance) / targetStats.total_reviews;
  targetStats.avg_conversation = (targetStats.avg_conversation * (targetStats.total_reviews - 1) + rating.conversation) / targetStats.total_reviews;
  targetStats.avg_manners = (targetStats.avg_manners * (targetStats.total_reviews - 1) + rating.manners) / targetStats.total_reviews;
  targetStats.avg_honesty = (targetStats.avg_honesty * (targetStats.total_reviews - 1) + rating.honesty) / targetStats.total_reviews;
  
  // 긍정적 태그 추가
  if (tags && tags.length > 0) {
    targetStats.positive_tags = [...new Set([...targetStats.positive_tags, ...tags])];
  }
  
  writeJson(reviewStatsPath, reviewStats);
  
  appendLog({
    type: 'review_saved',
    userId: reviewer_id,
    result: 'success',
    detail: { review_id: newReview.review_id, target_id, rating },
  });
  
  return { statusCode: 200, body: JSON.stringify({ review_id: newReview.review_id }) };
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
    
    appendLog({
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
    
    appendLog({
      type: 'user_status_updated',
      userId,
      result: 'success',
      detail: { from_status: oldStatus, to_status: new_status, reason },
    });
    
    return { statusCode: 200, body: JSON.stringify({ status: new_status }) };
  }
  
  return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
};

// 사용자 정보 조회
export const getUser = async (event: any) => {
  const userId = event.pathParameters?.id;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required' }) };
  }
  const users: User[] = readJson(usersPath);
  const user = users.find(u => u.user_id === userId);
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  }
  appendLog({
    type: 'user_retrieved',
    userId,
    result: 'success',
    detail: { user_id: userId },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(snakeToCamelCase(user))
  };
}; 