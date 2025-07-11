// 더미 데이터
// User 타입을 email 기반으로 통일
// 회원가입/로그인 모두 email, password만 사용

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
    // photos의 각 경로 앞에 baseUrl 붙이기
    const transformedProfile = snakeToCamelCase({
      ...profile,
      points: user?.points ?? 0,
      photos: (profile.photos || []).map((url: string) =>
        url && url.startsWith('/files/') ? `${baseUrl}${url}` : url
      ),
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
    photo_visible_at: null
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
  
  return { statusCode: 200, body: JSON.stringify({ match_id }) };
};

// 일정 제출 및 조율 실패/재매칭 로직 추가
export const submitChoices = async (event: any) => {
  const { match_id, user_id, dates, locations, acceptOtherSchedule } = JSON.parse(event.body || '{}');

  const matchPairsPath = path.join(__dirname, 'data/match-pairs.json');
  const matchPairs = fs.existsSync(matchPairsPath) ? readJson(matchPairsPath) : [];
  const matchIndex = matchPairs.findIndex((match: any) => match.match_id === match_id || match.match_a_id === match_id || match.match_b_id === match_id);

  const now = new Date().toISOString();

  if (matchIndex >= 0) {
    const match = matchPairs[matchIndex];
    // 일정 제출
    let changed = false;
    if (match.user_a_id === user_id) {
      match.user_a_choices = { dates, locations };
      changed = true;
    } else if (match.user_b_id === user_id) {
      match.user_b_choices = { dates, locations };
      changed = true;
    }
    // 양쪽 모두 제출했는지 확인
    if (match.user_a_choices?.dates?.length && match.user_b_choices?.dates?.length) {
      // 겹치는 날짜/장소 찾기
      const commonDates = match.user_a_choices.dates.filter((d: string) => match.user_b_choices.dates.includes(d));
      const commonLocations = match.user_a_choices.locations.filter((l: string) => match.user_b_choices.locations.includes(l));
      if (commonDates.length && commonLocations.length) {
        // 일정 확정
        match.schedule_date = commonDates[0];
        match.date_location = commonLocations[0];
        match.status = 'scheduled';
        changed = true;
      } else {
        // 일정 조율 실패
        match.status = 'failed';
        changed = true;
      }
    }
    // 상대방 일정에 맞추기(acceptOtherSchedule)
    if (acceptOtherSchedule) {
      // 상대방이 먼저 제출한 일정으로 확정
      const otherChoices = match.user_a_id === user_id ? match.user_b_choices : match.user_a_choices;
      match.schedule_date = otherChoices.dates[0];
      match.date_location = otherChoices.locations[0];
      match.status = 'scheduled';
      changed = true;
    }
    if (changed) {
      match.updated_at = now;
    }
    writeJson(matchPairsPath, matchPairs);

    // matching-requests 상태도 같이 변경
    const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
    const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
    // match_a_id, match_b_id로 각각 찾아서 상태 변경
    [match.match_a_id, match.match_b_id].forEach((mid: string) => {
      const reqIdx = matchingRequests.findIndex((req: any) => req.match_id === mid);
      if (reqIdx >= 0) {
        // 일정 제출한 쪽은 confirm, 최종 확정 시 scheduled
        if (match.status === 'scheduled') {
          matchingRequests[reqIdx].status = 'scheduled';
        } else if (user_id && mid === match_id) {
          matchingRequests[reqIdx].status = 'confirmed';
        }
        // date_choices 저장 (일정 제출한 쪽만)
        if (user_id && mid === match_id) {
          matchingRequests[reqIdx].date_choices = { dates, locations };
        }
        matchingRequests[reqIdx].updated_at = now;
      }
    });
    writeJson(matchingRequestsPath, matchingRequests);
  }
  await appendLog({
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
  
  await appendLog({
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
  if (myRequest) {
    status = myRequest.status; // waiting, matching, confirmed, scheduled 등
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
  
  const result = {
    matchId: match.match_id,
    userId: otherUserId,
    profile: profile || null,
    preference: preference || null,
    matchDate: match.final_date || null,
    status: match.final_date ? 'revealed' : 'pending'
  };
  
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
  // matching-requests에서 신청 기록 조회
  const matchingRequestsPath = path.join(__dirname, 'data/matching-requests.json');
  const matchingRequests = fs.existsSync(matchingRequestsPath) ? readJson(matchingRequestsPath) : [];
  const myRequest = matchingRequests.find((req: any) => req.requester_id === userId);
  let status = null;
  let matchId = null;
  let matchedUser = null;
  if (myRequest) {
    status = myRequest.status; // waiting, propose, matched, confirmed, scheduled, failed
    matchId = myRequest.match_id;
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
    detail: { status, matchedUserId: matchedUser?.userId },
    action: '매칭상태 조회',
    screen: 'MainScreen',
    component: 'matching_status'
  });
  return { statusCode: 200, body: JSON.stringify({ status, matchId, matchedUser }) };
}; 

// [신규] 인사이트 API (더미)
export const getInsight = async (event: any) => {
  const { userId } = event.pathParameters || {};
  // 실제 구현 전까지 더미 데이터 반환
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  // 예시: 매칭 횟수, 성공률, 최근 활동 등
  const dummy = {
    userId,
    totalMatches: 5,
    successfulMatches: 2,
    lastActive: new Date().toISOString(),
    favoriteRegion: '서울',
    pointsUsed: 300,
    reviewScore: 4.2,
    // ... 기타 통계
  };
  return { statusCode: 200, body: JSON.stringify(dummy) };
}; 

// 히스토리 조회
export const getHistory = async (event: any) => {
  try {
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // 매칭 요청 히스토리
    const matchingRequests = readJson(matchingRequestsPath);
    const userMatchingRequests = matchingRequests.filter((req: any) => req.requester_id === userId);

    // 매칭 성사 히스토리
    const matchPairs = readJson(matchPairsPath);
    const userMatchPairs = matchPairs.filter((pair: any) => {
      const matchA = matchingRequests.find((req: any) => req.match_id === pair.match_a_id);
      const matchB = matchingRequests.find((req: any) => req.match_id === pair.match_b_id);
      return (matchA && matchA.requester_id === userId) || (matchB && matchB.requester_id === userId);
    });

    // 포인트 히스토리
    const pointsHistory = readJson(pointsHistoryPath);
    const userPointsHistory = pointsHistory.filter((history: any) => history.user_id === userId);

    // 상태 변경 히스토리
    const statusHistory = readJson(userStatusHistoryPath);
    const userStatusHistory = statusHistory.filter((history: any) => history.user_id === userId);

    const history = {
      matchingRequests: userMatchingRequests,
      matchPairs: userMatchPairs,
      pointsHistory: userPointsHistory,
      statusHistory: userStatusHistory
    };

    await appendLog({
      type: 'get_history',
      userId: userId,
      result: 'success',
      message: '히스토리 조회 성공',
      detail: { 
        matchingRequestsCount: userMatchingRequests.length,
        matchPairsCount: userMatchPairs.length,
        pointsHistoryCount: userPointsHistory.length,
        statusHistoryCount: userStatusHistory.length
      },
      action: '히스토리 조회',
      screen: 'HistoryScreen',
      component: 'history'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(history)
    };

  } catch (error: any) {
    console.error('getHistory error:', error);
    
    await appendLog({
      type: 'get_history',
      userId: event.pathParameters?.userId,
      result: 'fail',
      message: '히스토리 조회 실패',
      detail: { error: error.message },
      action: '히스토리 조회',
      screen: 'HistoryScreen',
      component: 'history'
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