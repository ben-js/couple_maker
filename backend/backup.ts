import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { camelToSnakeCase, snakeToCamelCase } from './utils/caseUtils';
import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
const ddbDocClient = require('./utils/dynamoClient');
const cognitoService = require('./utils/cognitoService');

// AWS SDK v3 import 추가
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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
  component = '',
  logLevel = 'info'
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
  logLevel?: string;
}) {  
  // 로그 레벨이 error가 아니고 성공적인 로그인인 경우 로깅 생략 (성능 최적화)
  if (logLevel !== 'error' && type === 'login' && result === 'success') {
    return;
  }
  
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
    
    // 로그 레벨
    logLevel,
    
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
  } catch (e) {
    // 로그 기록 실패 시 콘솔에만 에러 출력
    console.error('appendLog 기록 실패:', e);
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

// 회원가입 (Cognito 연동)
export const signup = async (event: any) => {
  const startTime = Date.now();
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { email, password, name } = req;
  
  try {
    // Cognito를 통한 회원가입
    const result = await cognitoService.signUp(email, password, name);
    
    if (result.success) {
      // DynamoDB에 사용자 기본 정보 저장
      const userId = result.userSub;
      const userData = {
        user_id: userId,
        email: email,
        is_verified: false,
        has_profile: false,
        has_preferences: false,
        grade: 'general',
        status: 'green',
        is_deleted: false,
        points: 100, // 회원가입 보너스
        created_at: new Date().toISOString()
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: 'Users',
          Item: userData
        })
      );

      // 포인트 히스토리 기록
      await ddbDocClient.send(
        new PutCommand({
          TableName: 'PointsHistory',
          Item: {
            user_id: userId,
            timestamp: new Date().toISOString(),
            type: 'signup',
            points: 100,
            description: '회원가입 보너스',
            related_id: null
          }
        })
      );

      await appendLog({
        type: 'signup',
        email,
        ip: event.requestContext?.identity?.sourceIp || '',
        result: 'success',
        message: '회원가입 성공',
        detail: { userId, email },
        requestMethod: event.httpMethod,
        requestPath: event.path,
        requestBody: JSON.stringify(req),
        responseStatus: 200,
        responseBody: JSON.stringify({ success: true, message: result.message }),
        executionTime: Date.now() - startTime
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          message: result.message,
          userId: userId
        })
      };
    } else {
      await appendLog({
        type: 'signup',
        email,
        ip: event.requestContext?.identity?.sourceIp || '',
        result: 'fail',
        message: result.message,
        detail: { email },
        requestMethod: event.httpMethod,
        requestPath: event.path,
        requestBody: JSON.stringify(req),
        responseStatus: 400,
        responseBody: JSON.stringify({ success: false, message: result.message }),
        executionTime: Date.now() - startTime
      });

      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: result.message
        })
      };
    }
  } catch (error) {
    console.error('Signup error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    await appendLog({
      type: 'signup',
      email,
      ip: event.requestContext?.identity?.sourceIp || '',
      result: 'fail',
      message: '회원가입 중 오류 발생',
      detail: { email, error: errorMessage },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      requestBody: JSON.stringify(req),
      responseStatus: 500,
      responseBody: JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
      errorStack: errorStack,
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    };
  }
};

// 로그인 (Cognito 연동)
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
    
    // Cognito를 통한 로그인
    const cognitoStartTime = Date.now();
    const cognitoResult = await cognitoService.signIn(email, password);
    const cognitoTime = Date.now() - cognitoStartTime;
    console.log(`⏱️ Cognito 로그인 소요시간: ${cognitoTime}ms`);
    
    // 이메일 인증이 필요한 경우 특별 처리
    if (cognitoResult.requiresEmailVerification && cognitoResult.user) {
      const executionTime = Date.now() - startTime;
      const userResponse = {
        user_id: cognitoResult.user.username,
        email: email,
        hasProfile: false,
        hasPreferences: false,
        isVerified: false,
        grade: 'general',
        status: 'green',
        points: 100
      };
      const responseBody = JSON.stringify(snakeToCamelCase(userResponse));

      await appendLog({
        type: 'login',
        userId: cognitoResult.user.username,
        email,
        ip: event?.requestContext?.identity?.sourceIp || '',
        result: 'success',
        message: '이메일 인증이 필요한 사용자',
        detail: { requiresEmailVerification: true },
        requestMethod: event.requestContext?.http?.method || 'POST',
        requestPath: event.requestContext?.http?.path || '/login',
        requestBody: JSON.stringify({ email, password: '***' }),
        responseStatus: 200,
        responseBody,
        executionTime,
        sessionId,
        action: '로그인 시도 (이메일 인증 필요)',
        screen: 'AuthScreen',
        component: 'login',
        logLevel: 'info'
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: responseBody
      };
    }
    
    if (!cognitoResult.success) {
      const executionTime = Date.now() - startTime;
      const responseBody = JSON.stringify({ 
        error: cognitoResult.message, 
        input: { email, password: password ? '***' : 'empty' } 
      });

      await appendLog({
        type: 'login',
        userId: '',
        email,
        ip: event?.requestContext?.identity?.sourceIp || '',
        result: 'fail',
        message: cognitoResult.message,
        detail: {
          reason: 'cognito_auth_failed',
          attemptedEmail: email,
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
        component: 'login',
        logLevel: 'error'
      });

      return { 
        statusCode: 401, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: responseBody 
      };
    }

    // JWT 토큰에서 사용자 정보 추출
    const tokenInfo = cognitoService.parseToken(cognitoResult.idToken);
    const userId = tokenInfo?.sub;
    
    if (!userId) {
      throw new Error('토큰에서 사용자 ID를 추출할 수 없습니다.');
    }

    // DynamoDB에서 사용자 정보 조회
    const userStartTime = Date.now();
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Users',
        Key: { user_id: userId }
      })
    );
    const userTime = Date.now() - userStartTime;
    console.log(`⏱️ DynamoDB 사용자 조회 소요시간: ${userTime}ms`);
    
    const user = userResult.Item;
    const ip = event?.requestContext?.identity?.sourceIp || '';

    console.log('🔍 사용자 검색 결과:', user ? '찾음' : '찾지 못함');
    if (!user) {
      const executionTime = Date.now() - startTime;
      const errorMessage = '사용자 정보를 찾을 수 없습니다.';
      const responseBody = JSON.stringify({ 
        error: errorMessage, 
        input: { email, password: password ? '***' : 'empty' } 
      });

      await appendLog({
        type: 'login',
        userId: '',
        email,
        ip,
        result: 'fail',
        message: errorMessage,
        detail: {
          reason: 'user_not_found_in_dynamodb',
          attemptedEmail: email,
          cognitoUserId: userId
        },
        requestMethod: event.requestContext?.http?.method || 'POST',
        requestPath: event.requestContext?.http?.path || '/login',
        requestBody: JSON.stringify({ email, password: '***' }),
        responseStatus: 404,
        responseBody,
        executionTime,
        sessionId,
        action: '로그인 시도',
        screen: 'AuthScreen',
        component: 'login',
        logLevel: 'error'
      });

      return { 
        statusCode: 404, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: responseBody 
      };
    }

    // DynamoDB에서 프로필/이상형 정보 병렬 조회
    let hasProfile = user.has_profile;
    let hasPreferences = user.has_preferences;
    let userProfile = null;
    let userName = '사용자';

    // 프로필과 이상형 정보를 병렬로 조회
    const profileStartTime = Date.now();
    const [profileResult, preferenceResult] = await Promise.allSettled([
      hasProfile ? ddbDocClient.send(
        new GetCommand({
          TableName: 'Profiles',
          Key: { user_id: user.user_id }
        })
      ) : Promise.resolve(null),
      hasPreferences ? ddbDocClient.send(
        new GetCommand({
          TableName: 'Preferences',
          Key: { user_id: user.user_id }
        })
      ) : Promise.resolve(null)
    ]);
    const profileTime = Date.now() - profileStartTime;
    console.log(`⏱️ 프로필/이상형 병렬 조회 소요시간: ${profileTime}ms`);

    // 프로필 결과 처리
    if (profileResult.status === 'fulfilled' && profileResult.value?.Item) {
      userProfile = profileResult.value.Item;
      userName = userProfile?.name || '사용자';
    } else if (profileResult.status === 'rejected') {
      console.error('프로필 조회 실패:', profileResult.reason);
      hasProfile = false;
    }

    // 이상형 결과 처리 (현재 로그인에서는 사용하지 않음)
    if (preferenceResult.status === 'rejected') {
      console.error('이상형 조회 실패:', preferenceResult.reason);
      hasPreferences = false;
    }

    console.log('✅ 로그인 성공:');
    console.log('   - User ID:', user.user_id);
    console.log('   - Email:', user.email);
    console.log('   - Name:', userName);
    console.log('   - Has Profile:', hasProfile);
    console.log('   - Has Preferences:', hasPreferences);
    console.log('   - Profile found:', !!userProfile);

    const executionTime = Date.now() - startTime;

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
    if (hasProfile && userProfile) {
      userResponse.name = userProfile.name;
    }
    const responseBody = JSON.stringify(snakeToCamelCase(userResponse));

    // 성공적인 로그인은 로깅 완전 생략 (최대 성능)
    // appendLog 호출 제거

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
      component: 'login',
      logLevel: 'error'
    });

    return { 
      statusCode: 500, 
      body: responseBody
    };
  }
};

// 프로필 저장 (DynamoDB 기반)
export const saveProfile = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { user_id, ...profile } = req;

  console.log('프로필 저장 시작:', { 
    user_id, 
    hasPhotos: !!profile.photos, 
    photosLength: profile.photos?.length,
    photos: profile.photos 
  });

  // DynamoDB에 프로필 저장
  await ddbDocClient.send(
    new PutCommand({
      TableName: 'Profiles',
      Item: { user_id, ...profile }
    })
  );

  // users 테이블의 has_profile true로 변경
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: 'Users',
      Key: { user_id },
      UpdateExpression: 'set has_profile = :val',
      ExpressionAttributeValues: { ':val': true }
    })
  );

  await appendLog({
    type: 'profile_save',
    userId: user_id,
    result: 'success',
    detail: { profile, photosUpdated: profile.photos ? true : false },
    logLevel: 'info'
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// 이상형 저장 (DynamoDB 기반)
export const saveUserPreferences = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { user_id, ...prefs } = req;
  const startTime = Date.now();
  const sessionId = uuidv4();

  try {
    if (!user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing userId' }) };
    }

    // 사용자 프로필 조회하여 성별 확인
    const profileResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Profiles',
        Key: { user_id }
      })
    );
    
    const profile = profileResult.Item;
    if (profile?.gender && prefs.preferred_gender) {
      // 선호 성별이 사용자 성별과 같은지 검증
      if (prefs.preferred_gender === profile.gender) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: '선호 성별은 자신과 다른 성별이어야 합니다' }) 
        };
      }
    }

    // DynamoDB에 이상형 저장
    await ddbDocClient.send(
      new PutCommand({
        TableName: 'Preferences',
        Item: { user_id, ...prefs }
      })
    );

    // users 테이블의 has_preferences true로 변경
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: 'Users',
        Key: { user_id },
        UpdateExpression: 'set has_preferences = :val',
        ExpressionAttributeValues: { ':val': true }
      })
    );

    const executionTime = Date.now() - startTime;
    const responseBody = JSON.stringify({ ok: true });

    await appendLog({
      type: 'preferences_save',
      userId: user_id,
      result: 'success',
      message: '이상형 저장 성공',
      detail: { preferencesData: prefs },
      responseStatus: 200,
      responseBody,
      executionTime,
      sessionId,
      action: '이상형 저장',
      screen: 'PreferenceSetupScreen',
      component: 'saveUserPreferences',
      logLevel: 'info'
    });

    return { statusCode: 200, body: responseBody };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMessage = `이상형 저장 실패: ${error.message}`;
    const responseBody = JSON.stringify({ error: '이상형 저장 실패', message: error.message });

    await appendLog({
      type: 'preferences_save',
      userId: '',
      result: 'fail',
      message: errorMessage,
      detail: { errorType: error.constructor.name, errorMessage: error.message },
      responseStatus: 500,
      responseBody,
      executionTime,
      sessionId,
      action: '이상형 저장',
      screen: 'PreferenceSetupScreen',
      component: 'saveUserPreferences',
      logLevel: 'error'
    });

    return { statusCode: 500, body: responseBody };
  }
};

// 프로필 조회 (DynamoDB 기반)
export const getProfile = async (event: any) => {
  const { userId } = event.pathParameters || {};

  try {
    // DynamoDB에서 프로필 조회
    const { Item: profile } = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Profiles',
        Key: { user_id: userId }
      })
    );

    if (profile) {
      console.log('프로필 조회 성공:', { 
        userId, 
        hasPhotos: !!profile.photos, 
        photosLength: profile.photos?.length,
        photos: profile.photos 
      });
      
      const responseBody = JSON.stringify(snakeToCamelCase(profile));
      await appendLog({
        type: 'profile_get',
        userId: userId,
        result: 'success',
        message: '프로필 조회 성공',
        detail: { userId, profile },
        logLevel: 'info'
      });
      return { statusCode: 200, body: responseBody };
    }

    await appendLog({
      type: 'profile_get',
      userId: userId,
      result: 'fail',
      message: '프로필 조회 실패',
      detail: { userId },
      logLevel: 'error'
    });
    return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found', userId }) };
  } catch (error: any) {
    console.error('getProfile 에러:', error);
    
    // 스키마 에러인 경우 빈 프로필 반환 (프로필이 없는 것으로 처리)
    if (error.name === 'ValidationException') {
      await appendLog({
        type: 'profile_get',
        userId: userId,
        result: 'fail',
        message: '프로필 테이블 스키마 에러',
        detail: { userId, error: error.message },
        logLevel: 'error'
      });
      return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found', userId }) };
    }
    
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};

// 이상형 조회 (DynamoDB 기반)
export const getUserPreferences = async (event: any) => {
  const { userId } = event.pathParameters || {};

  // DynamoDB에서 이상형 조회
  const { Item: pref } = await ddbDocClient.send(
    new GetCommand({
      TableName: 'Preferences',
      Key: { user_id: userId }
    })
  );

  if (pref) {
    return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(pref)) };
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'Preferences not found' }) };
};

// 소개팅 신청
export const requestMatching = async (event: any) => {
  const { userId } = JSON.parse(event.body || '{}');
  // 1. 유저 조회 (DynamoDB)
  const userResult = await ddbDocClient.send(
    new GetCommand({ TableName: 'Users', Key: { user_id: userId } })
  );
  const user = userResult.Item;
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  }
  if (user.points < 100) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Insufficient points' }) };
  }
  // 2. 포인트 차감 (DynamoDB)
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: 'Users',
      Key: { user_id: userId },
      UpdateExpression: 'set points = points - :val',
      ExpressionAttributeValues: { ':val': 100 }
    })
  );
  // 3. 매칭 요청 생성 (DynamoDB)
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
  await ddbDocClient.send(
    new PutCommand({ TableName: 'MatchingRequests', Item: newRequest })
  );
  await appendLog({
    type: 'matching_request',
    userId,
    email: user.email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: { match_id: newRequest.match_id, points_deducted: 100 },
    logLevel: 'info'
  });
  return { statusCode: 200, body: JSON.stringify({ match_id: newRequest.match_id }) };
};

// 매칭 요청 목록 조회 (관리자용)
export const getMatchingRequests = async (event: any) => {
  // DynamoDB에서 매칭 요청 전체 조회
  const { Items: matchingRequests = [] } = await ddbDocClient.send(
    new ScanCommand({ TableName: 'MatchingRequests' })
  );
  const waitingRequests = matchingRequests.filter((req: any) => req.status === 'waiting');
  return { statusCode: 200, body: JSON.stringify({ requests: waitingRequests }) };
};

// 매칭 확정
export const confirmMatching = async (event: any) => {
  const { match_id, user_a_id, user_b_id } = JSON.parse(event.body || '{}');
  // 1. MatchingRequests 상태 업데이트
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: 'MatchingRequests',
      Key: { match_id },
      UpdateExpression: 'set status = :s',
      ExpressionAttributeValues: { ':s': 'confirmed' }
    })
  );
  // 2. MatchPairs 테이블에 기록 생성
  const newMatch = {
    match_id,
    user_a_id,
    user_b_id,
    user_a_choices: { dates: [], locations: [] },
    user_b_choices: { dates: [], locations: [] },
    final_date: null,
    final_location: null
  };
  await ddbDocClient.send(
    new PutCommand({ TableName: 'MatchPairs', Item: newMatch })
  );
  await appendLog({
    type: 'matching_confirmed',
    userId: user_a_id,
    result: 'success',
    detail: { match_id, user_a_id, user_b_id },
    logLevel: 'info'
  });
};

// 관리자 매칭 최종 확정 (confirmed → scheduled)
export const finalizeMatching = async (event: any) => {
  const { match_pair_id, final_date, final_location, photo_visible_at } = JSON.parse(event.body || '{}');
  const now = new Date().toISOString();
  // 1. MatchPairs 상태 업데이트
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: 'MatchPairs',
      Key: { match_pair_id },
      UpdateExpression: 'set updated_at = :ua',
      ExpressionAttributeValues: { ':ua': now }
    })
  );
  // 2. MatchingRequests 상태 업데이트 (양쪽 모두)
  // MatchPairs에서 match_a_id, match_b_id 조회
  const { Item: matchPair } = await ddbDocClient.send(
    new GetCommand({ TableName: 'MatchPairs', Key: { match_pair_id } })
  );
  if (matchPair) {
    for (const mid of [matchPair.match_a_id, matchPair.match_b_id]) {
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'MatchingRequests',
          Key: { match_id: mid },
          UpdateExpression: 'set status = :s, final_date = :fd, final_location = :fl, photo_visible_at = :pv, updated_at = :ua',
          ExpressionAttributeValues: {
            ':s': 'scheduled',
            ':fd': final_date,
            ':fl': final_location,
            ':pv': photo_visible_at,
            ':ua': now
          }
        })
      );
    }
  }
  await appendLog({
    type: 'matching_finalized',
    result: 'success',
    detail: { match_pair_id, final_date, final_location, photo_visible_at },
    action: '매칭 최종 확정',
    logLevel: 'info'
  });
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ message: '매칭이 최종 확정되었습니다.' })
  };
};

export const submitChoices = async (event: any) => {
  const { match_id, user_id, dates, locations, final_date, final_location } = JSON.parse(event.body || '{}');
  const now = new Date().toISOString();

  // 1. 본인 매칭 요청 조회
  const { Item: currentRequest } = await ddbDocClient.send(
    new GetCommand({ TableName: 'MatchingRequests', Key: { match_id } })
  );
  if (!currentRequest) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Matching request not found' }) };
  }

  // 2. 매칭 페어 조회
  const { Items: matchPairs = [] } = await ddbDocClient.send(
    new ScanCommand({ TableName: 'MatchPairs', FilterExpression: 'match_a_id = :mid OR match_b_id = :mid', ExpressionAttributeValues: { ':mid': match_id } })
  );
  const matchPair = matchPairs[0];

  // 3. 상대방 매칭 요청 조회
  let otherRequest = null;
  if (matchPair) {
    const otherMatchId = matchPair.match_a_id === match_id ? matchPair.match_b_id : matchPair.match_a_id;
    const otherReqResult = await ddbDocClient.send(
      new GetCommand({ TableName: 'MatchingRequests', Key: { match_id: otherMatchId } })
    );
    otherRequest = otherReqResult.Item;
  }

  // 4. 본인 매칭 요청 업데이트
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: 'MatchingRequests',
      Key: { match_id },
      UpdateExpression: 'set date_choices = :dc, choices_submitted_at = :csa, updated_at = :ua',
      ExpressionAttributeValues: {
        ':dc': { dates, locations },
        ':csa': now,
        ':ua': now
      }
    })
  );

  let status = currentRequest.status;
  let finalDate = null;
  let photoVisibleAt = null;

  // 5. 매칭 성공/실패 판정 및 상태 업데이트
  if (otherRequest && otherRequest.date_choices && otherRequest.date_choices.dates.length > 0) {
    // 일정/장소 겹침 판정 로직 (생략: 기존 코드 복사)
    // ... (여기서 기존의 commonDates, commonLocations, flexibleMatch 등 로직 적용)
    // 예시: (실제 로직은 기존 코드 참고)
    const commonDates = dates.filter((date: any) => otherRequest.date_choices.dates.includes(date));
    const commonLocations = locations.filter((loc: any) => otherRequest.date_choices.locations.includes(loc));
    // ... flexibleMatch, commonRegions 등
    if (commonDates.length > 0 && commonLocations.length > 0) {
      status = 'confirmed';
      finalDate = commonDates[0];
      photoVisibleAt = new Date(new Date(finalDate).getTime() - 30 * 60 * 1000).toISOString();
      // 본인/상대방 모두 상태 업데이트
      await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id }, UpdateExpression: 'set status = :s, final_date = :fd, final_location = :fl, photo_visible_at = :pv, updated_at = :ua', ExpressionAttributeValues: { ':s': 'confirmed', ':fd': finalDate, ':fl': commonLocations[0], ':pv': photoVisibleAt, ':ua': now } }));
      await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: otherRequest.match_id }, UpdateExpression: 'set status = :s, final_date = :fd, final_location = :fl, photo_visible_at = :pv, updated_at = :ua', ExpressionAttributeValues: { ':s': 'confirmed', ':fd': finalDate, ':fl': commonLocations[0], ':pv': photoVisibleAt, ':ua': now } }));
    } else {
      status = 'mismatched';
      await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id }, UpdateExpression: 'set status = :s, updated_at = :ua', ExpressionAttributeValues: { ':s': 'mismatched', ':ua': now } }));
    }
  } else {
    // 상대방이 아직 제출 안 했으면 matched로 변경
    if (currentRequest.status === 'mismatched') {
      status = 'matched';
      await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id }, UpdateExpression: 'set status = :s, updated_at = :ua', ExpressionAttributeValues: { ':s': 'matched', ':ua': now } }));
    } else {
      status = 'matched';
      await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id }, UpdateExpression: 'set status = :s, updated_at = :ua', ExpressionAttributeValues: { ':s': 'matched', ':ua': now } }));
    }
  }

  await appendLog({
    type: 'choices_submitted',
    userId: user_id,
    result: 'success',
    detail: { 
      match_id, 
      dates, 
      locations, 
      status,
      final_date: finalDate,
      photo_visible_at: photoVisibleAt 
    },
    logLevel: 'info'
  });

  return { 
    statusCode: 200, 
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ 
      ok: true, 
      status,
      message: status === 'mismatched' ? '일정이 맞지 않습니다. 다시 일정을 선택해주세요.' : '일정이 제출되었습니다.',
      logLevel: 'info'
    }) 
  };
};

// 리뷰 저장 (DynamoDB 기반)
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
  
  // DynamoDB에 리뷰 저장
  await ddbDocClient.send(
    new PutCommand({
      TableName: 'Reviews',
      Item: newReview
    })
  );
  
  await appendLog({
    type: 'review_saved',
    userId: reviewer_id,
    result: 'success',
    detail: { review_id: newReview.review_id, target_id, rating },
    logLevel: 'info'
  });
  
  return { 
    statusCode: 200, 
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ review_id: newReview.review_id }) 
  };
};

// 포인트 충전 (DynamoDB 기반)
export const chargePoints = async (event: any) => {
  const { userId, amount, type } = JSON.parse(event.body || '{}');
  
  try {
    // DynamoDB에서 사용자 조회
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Users',
        Key: { user_id: userId }
      })
    );
    
    if (userResult.Item) {
      const user = userResult.Item;
      const newPoints = user.points + amount;
      
      // DynamoDB에서 포인트 업데이트
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Users',
          Key: { user_id: userId },
          UpdateExpression: 'set points = :val',
          ExpressionAttributeValues: { ':val': newPoints }
        })
      );
      
      // 포인트 히스토리 기록
      await ddbDocClient.send(
        new PutCommand({
          TableName: 'PointsHistory',
          Item: {
            history_id: uuidv4(),
            user_id: userId,
            timestamp: new Date().toISOString(),
            type,
            points: amount,
            description: `${type} 포인트 적립`,
            related_id: null
          }
        })
      );
      
      await appendLog({
        type: 'points_charged',
        userId,
        result: 'success',
        detail: { amount, type, new_balance: newPoints },
        logLevel: 'info'
      });
      
      return { statusCode: 200, body: JSON.stringify({ points: newPoints }) };
    }
    
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  } catch (error: any) {
    console.error('chargePoints error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// 사용자 상태 변경 (관리자용) - DynamoDB 기반
export const updateUserStatus = async (event: any) => {
  const { userId, new_status, reason, updated_by } = JSON.parse(event.body || '{}');
  
  try {
    // DynamoDB에서 사용자 조회
    const userResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Users',
        Key: { user_id: userId }
      })
    );
    
    if (userResult.Item) {
      const oldStatus = userResult.Item.status;
      
      // DynamoDB에서 상태 업데이트
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Users',
          Key: { user_id: userId },
          UpdateExpression: 'set status = :val',
          ExpressionAttributeValues: { ':val': new_status }
        })
      );
      
      // 상태 변경 히스토리 기록
      await ddbDocClient.send(
        new PutCommand({
          TableName: 'UserStatusHistory',
          Item: {
            history_id: uuidv4(),
            user_id: userId,
            timestamp: new Date().toISOString(),
            from_status: oldStatus,
            to_status: new_status,
            reason,
            updated_by
          }
        })
      );
      
      await appendLog({
        type: 'user_status_updated',
        userId,
        result: 'success',
        detail: { from_status: oldStatus, to_status: new_status, reason },
        action: '사용자 상태 변경',
        screen: 'AdminScreen',
        component: 'user_status',
        logLevel: 'info'
      });
      
      return { statusCode: 200, body: JSON.stringify({ status: new_status }) };
    }
    
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
  } catch (error: any) {
    console.error('updateUserStatus error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// 사용자 정보 조회
export const getUser = async (event: any) => {
  const { userId } = event.pathParameters || {};
  
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }

  try {
    // DynamoDB에서 사용자 조회
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Users',
        Key: { user_id: userId }
      })
    );

    if (result.Item) {
      return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(result.Item)) };
    }
    
    return { statusCode: 404, body: JSON.stringify({ error: 'User not found', userId }) };
  } catch (error: any) {
    console.error('getUser 에러:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
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
  
  // DynamoDB에서 매칭 페어 조회
  const { Items: matchPairs = [] } = await ddbDocClient.send(
    new ScanCommand({ 
      TableName: 'MatchPairs',
      FilterExpression: 'user_a_id = :userId OR user_b_id = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    })
  );
  
  const myMatches = matchPairs;
  
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

  let cards = [];
  for (const m of myMatches) {
    const otherUserId = m.user_a_id === userId ? m.user_b_id : m.user_a_id;
    // DynamoDB에서 프로필 조회
    const { Item: profile } = await ddbDocClient.send(
      new GetCommand({ TableName: 'Profiles', Key: { user_id: otherUserId } })
    );
    if (!profile) continue;
    
    cards.push({
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
    });
  }

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
    component: 'cards_list',
    logLevel: 'info'
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
  // DynamoDB에서 리뷰 조회
  const { Items: reviews = [] } = await ddbDocClient.send(
    new ScanCommand({ 
      TableName: 'Reviews',
      FilterExpression: 'target_id = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    })
  );
  const myReviews = reviews;
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
    component: 'reviews_list',
    logLevel: 'info'
  });
  return { statusCode: 200, body: JSON.stringify(paged.map(snakeToCamelCase)) };
};

// 홈(메인) 프로필 카드 1건 조회
export const getMainCard = async (event: any) => {
  const userId = event.queryStringParameters?.userId || event.headers?.userid;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  // DynamoDB에서 매칭 요청 조회
  const { Items: matchingRequests = [] } = await ddbDocClient.send(
    new ScanCommand({ 
      TableName: 'MatchingRequests',
      FilterExpression: 'requester_id = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    })
  );
  const myRequest = matchingRequests[0]; // 첫 번째 매칭 요청
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
    component: 'main_card',
    logLevel: 'info'
  });
  return { statusCode: 200, body: JSON.stringify({ matchingStatus: status }) };
};

// 카드 상세 정보 조회
export const getCardDetail = async (event: any) => {
  const userId = event.pathParameters?.userId;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  // DynamoDB에서 프로필 조회
  const { Item: profile } = await ddbDocClient.send(
    new GetCommand({ TableName: 'Profiles', Key: { user_id: userId } })
  );
  
  if (!profile) {
    await appendLog({
      type: 'get_card_detail',
      userId: '',
      result: 'fail',
      message: 'Profile not found',
      detail: { requestedUserId: userId },
      action: '카드 상세 조회',
      screen: 'UserDetailScreen',
      component: 'card_detail',
      logLevel: 'error'
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
    component: 'card_detail',
    logLevel: 'info'
  });
  
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(profile)) };
};

// 프로필 조회
function getBaseUrl(event: any) {
  const host = event.headers?.['host'] || event.requestContext?.domainName || 'localhost:3000';
  const protocol = event.headers?.['x-forwarded-proto'] || 'http';
  return `${protocol}://${host}`;
}

// S3 클라이언트 초기화
const s3Client = new S3Client({
  region: 'ap-northeast-2'
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'date-sense';

// 이미지 업로드 (S3 연동)
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
    
    // S3 구조: images/profile/{year}/{month}/{day}/{userId}/{fileName}
    const localPath = `${year}/${month}/${day}/${userId}`;
    
    // 파일명 생성 (타임스탬프 + 원본 확장자)
    const timestamp = Date.now();
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : 'jpg';
    const savedFileName = `${timestamp}.${extension}`;
    const s3Key = generateS3Path(userId, savedFileName, 'profile');

    // S3에 파일 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: getContentType(savedFileName),
      Metadata: {
        userId: userId,
        uploadDate: now.toISOString(),
        originalFileName: fileName || 'unknown'
      }
    });

    await s3Client.send(uploadCommand);

    // S3 URL 생성
    const s3Url = `https://${S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${s3Key}`;
    const baseUrl = getBaseUrl(event);

    await appendLog({
      type: 'image_upload',
      userId,
      result: 'success',
      detail: { 
        fileName: savedFileName, 
        localPath,
        s3Key: s3Key,
        s3Url: s3Url,
        fileSize: buffer.length,
        bucket: S3_BUCKET_NAME
      },
      action: '이미지 업로드',
      screen: 'ProfileEditScreen',
      component: 'image_upload',
      logLevel: 'info'
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        imageUrl: s3Url,
        fileName: savedFileName,
        localPath,
        s3Key: s3Key,
        bucket: S3_BUCKET_NAME
      }) 
    };
  } catch (error: any) {
    console.error('이미지 업로드 에러:', error);
    
    await appendLog({
      type: 'image_upload',
      userId,
      result: 'fail',
      message: error.message,
      detail: { error: error.message, bucket: S3_BUCKET_NAME },
      action: '이미지 업로드',
      screen: 'ProfileEditScreen',
      component: 'image_upload',
      logLevel: 'error'
    });

    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Image upload failed' }) 
    };
  }
};

// S3 Presigned URL 생성 (프론트엔드에서 직접 업로드용)
export const getUploadUrl = async (event: any) => {
  const { userId, fileName, contentType } = JSON.parse(event.body || '{}');
  
  if (!userId || !fileName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId and fileName required' }) };
  }

  try {
    // AWS S3 구조를 고려한 경로 생성
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // S3 구조: images/profile/{year}/{month}/{day}/{userId}/{fileName}
    const timestamp = Date.now();
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const savedFileName = `${timestamp}.${extension}`;
    const s3Key = generateS3Path(userId, savedFileName, 'profile');

    // Presigned URL 생성
    const putObjectCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType || getContentType(savedFileName),
      Metadata: {
        userId: userId,
        uploadDate: now.toISOString(),
        originalFileName: fileName
      }
    });

    const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 }); // 1시간 유효

    await appendLog({
      type: 'presigned_url_generated',
      userId,
      result: 'success',
      detail: { 
        fileName: savedFileName, 
        s3Key: s3Key,
        expiresIn: 3600,
        bucket: S3_BUCKET_NAME
      },
      action: 'Presigned URL 생성',
      screen: 'ProfileEditScreen',
      component: 'image_upload',
      logLevel: 'info'
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        uploadUrl: presignedUrl,
        fileName: savedFileName,
        s3Key: s3Key,
        s3Url: `https://${S3_BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${s3Key}`,
        expiresIn: 3600
      }) 
    };
  } catch (error: any) {
    console.error('Presigned URL 생성 에러:', error);
    
    await appendLog({
      type: 'presigned_url_generated',
      userId,
      result: 'fail',
      message: error.message,
      detail: { error: error.message, bucket: S3_BUCKET_NAME },
      action: 'Presigned URL 생성',
      screen: 'ProfileEditScreen',
      component: 'image_upload',
      logLevel: 'error'
    });

    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to generate upload URL' }) 
    };
  }
};

// 정적 파일 서빙 (S3 사용으로 대체됨)
export const serveFile = async (event: any) => {
  return { 
    statusCode: 410, 
    body: JSON.stringify({ 
      error: 'This endpoint is deprecated. Use S3 URLs directly.' 
    }) 
  };
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

// 기존 이미지 마이그레이션 (S3 사용으로 대체됨)
export const migrateImages = async (event: any) => {
  return { 
    statusCode: 410, 
    body: JSON.stringify({ 
      error: 'This endpoint is deprecated. Use S3 for image storage.' 
    }) 
  };
};

// AWS S3 구조를 고려한 파일 경로 생성 함수
function generateS3Path(userId: string, fileName: string, type: 'profile' | 'temp' = 'profile'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // fileName이 비어있으면 userId까지만 반환 (가상 폴더 생성 방지)
  if (!fileName || fileName.trim() === '') {
    return `images/${type}/${year}/${month}/${day}/${userId}`;
  }
  
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

// 파일 정리 함수 (S3 사용으로 대체됨)
export const cleanupTempFiles = async (event: any) => {
  return { 
    statusCode: 410, 
    body: JSON.stringify({ 
      error: 'This endpoint is deprecated. Use S3 lifecycle policies for file cleanup.' 
    }) 
  };
};

// 정적 데이터는 하드코딩으로 대체 (DynamoDB 사용하지 않음)
export const getTerms = async () => {
  const terms = {
    title: "이용약관",
    content: "이용약관 내용...",
    updated_at: new Date().toISOString()
  };
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(terms)) };
};

export const getPrivacy = async () => {
  const privacy = {
    title: "개인정보처리방침",
    content: "개인정보처리방침 내용...",
    updated_at: new Date().toISOString()
  };
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(privacy)) };
};

export const getCustomerService = async () => {
  const cs = {
    title: "고객센터",
    content: "고객센터 정보...",
    contact: "support@datesense.com",
    updated_at: new Date().toISOString()
  };
  return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(cs)) };
};



// 매칭 상세 정보 조회 (matchId 기반) - DynamoDB 기반
export const getMatchDetail = async (event: any) => {
  const matchId = event.pathParameters?.matchId;
  const requestUserId = event.queryStringParameters?.userId || event.headers?.userid;
  
  if (!matchId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'matchId required' }) };
  }
  
  if (!requestUserId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  try {
    // DynamoDB에서 매칭 페어 조회
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchPairs',
        FilterExpression: 'match_a_id = :mid OR match_b_id = :mid',
        ExpressionAttributeValues: { ':mid': matchId }
      })
    );
    
    const match = matchPairs[0];
    if (!match) {
      await appendLog({
        type: 'get_match_detail',
        userId: requestUserId,
        result: 'fail',
        message: 'Match not found',
        detail: { requestedMatchId: matchId },
        action: '매칭 상세 조회',
        screen: 'UserDetailScreen',
        component: 'match_detail',
        logLevel: 'error'
      });
      return { statusCode: 404, body: JSON.stringify({ error: 'Match not found' }) };
    }
    
    // 요청한 사용자가 매칭에 포함되어 있는지 확인
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ TableName: 'MatchingRequests' })
    );
    
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
        component: 'match_detail',
        logLevel: 'error'
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
    
    // DynamoDB에서 프로필과 이상형 조회
    const profileResult = await ddbDocClient.send(
      new GetCommand({ TableName: 'Profiles', Key: { user_id: otherUserId } })
    );
    const profile = profileResult.Item;
    
    const preferenceResult = await ddbDocClient.send(
      new GetCommand({ TableName: 'Preferences', Key: { user_id: otherUserId } })
    );
    const preference = preferenceResult.Item;
    
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
      component: 'match_detail',
      logLevel: 'info'
    });
    
    return { statusCode: 200, body: JSON.stringify(snakeToCamelCase(result)) };
  } catch (error: any) {
    console.error('getMatchDetail error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
  

}; 

// 매칭 상태 조회: 항상 matchId, matchedUser를 응답에 포함 (없으면 null) - DynamoDB 기반
export const getMatchingStatus = async (event: any) => {
  const userId = event.queryStringParameters?.userId || event.headers?.userid;
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  try {
    // DynamoDB에서 매칭 요청 조회
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchingRequests',
        FilterExpression: 'requester_id = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      })
    );
    
    const myRequest = matchingRequests[0]; // 첫 번째 매칭 요청
    
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
    
    // DynamoDB에서 매칭 페어 조회
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ TableName: 'MatchPairs' })
    );
    
    const myMatch = matchPairs.find((m: any) => {
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
        // DynamoDB에서 프로필 조회
        const profileResult = await ddbDocClient.send(
          new GetCommand({ TableName: 'Profiles', Key: { user_id: otherUserId } })
        );
        const profile = profileResult.Item;
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
    
    await appendLog({ 
      type: 'get_matching_status', 
      userId, 
      result: 'success', 
      detail: { 
        status, 
        matchedUserId: matchedUser?.userId,
        hasPendingProposal,
        proposalMatchId,
        myRequestStatus: myRequest?.status,
        myRequestId: myRequest?.match_id
      },
      action: '매칭상태 조회',
      screen: 'MainScreen',
      component: 'matching_status',
      logLevel: 'info'
    });

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
        finalDate: myRequest?.final_date || null
      })
    };
  } catch (error: any) {
    console.error('getMatchingStatus error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
}; 

// [신규] 인사이트 API (더미) - DynamoDB 기반으로 변경 예정
export const getInsight = async (event: any) => {
  const { userId } = event.pathParameters || {};
  
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) };
  }
  
  try {
    // 임시로 더미 데이터 반환 (DynamoDB 마이그레이션 후 실제 데이터로 교체 예정)
    const response = {
      userId,
      totalMatches: 0,
      successfulMatches: 0,
      successRate: 0,
      averageRating: 0,
      favoriteRegion: '없음',
      dominantStyle: '없음',
      insightCards: [
        {
          id: 'personality',
          title: '성향 분석',
          description: '소개팅 1회 완료 시 해금됩니다.',
          isLocked: true
        },
        {
          id: 'success_rate',
          title: '매칭 성공률 추이',
          description: '소개팅 3회 완료 시 해금됩니다.',
          isLocked: true
        },
        {
          id: 'conversation_style',
          title: '대화 스타일 요약',
          description: '첫 소개팅 이후 분석이 시작됩니다.',
          isLocked: true
        },
        {
          id: 'custom_feedback',
          title: '맞춤 피드백',
          description: '소개팅 2회 완료 시 해금됩니다.',
          isLocked: true
        }
      ]
    };
    
    await appendLog({
      type: 'insight_get',
      userId,
      result: 'success',
      detail: { 
        totalMatches: 0, 
        successRate: 0, 
        cardsCount: 4 
      },
      action: '인사이트 조회',
      screen: 'InsightScreen',
      component: 'insight_list',
      logLevel: 'info'
    });
    
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
      component: 'insight_list',
      logLevel: 'error'
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
    // DynamoDB에서 사용자의 히스토리 조회
    const { Items: matchingHistory = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchingHistory',
        FilterExpression: 'request_a.requester_id = :userId OR request_b.requester_id = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      })
    );
    
    // 사용자가 참여한 히스토리 찾기 (request_a 또는 request_b에서 사용자 ID 확인)
    const userHistory = matchingHistory.filter((history: any) => {
      return (history.request_a && history.request_a.requester_id === userId) || 
             (history.request_b && history.request_b.requester_id === userId);
    });
    
    // 파트너 정보 추가 (DynamoDB 조회를 위해 Promise.all 사용)
    const enrichedHistoryPromises = userHistory.map(async (history: any) => {
      // 현재 사용자의 요청과 상대방 요청 찾기
      const isUserA = history.request_a && history.request_a.requester_id === userId;
      const userRequest = isUserA ? history.request_a : history.request_b;
      const partnerRequest = isUserA ? history.request_b : history.request_a;
      const partnerId = userRequest?.partner_id;
      
      // DynamoDB에서 파트너 프로필 조회
      let partnerProfile = null;
      if (partnerId) {
        const profileResult = await ddbDocClient.send(
          new GetCommand({ TableName: 'Profiles', Key: { user_id: partnerId } })
        );
        partnerProfile = profileResult.Item;
      }
      
      // 파트너 프로필 정보 (finished 상태일 때는 연락처 정보 제외)
      let partnerInfo = null;
      if (partnerProfile) {
        if (history.final_status === 'finished') {
          // finished 상태일 때는 기본 정보만 제공 (연락처 정보 제외)
          partnerInfo = {
            name: partnerProfile.name,
            birthDate: partnerProfile.birth_date,
            job: partnerProfile.job,
            mbti: partnerProfile.mbti,
            location: partnerProfile.location,
            photos: [] // 사진도 제외
          };
        } else {
          // 다른 상태일 때는 모든 정보 제공
          partnerInfo = {
            name: partnerProfile.name,
            birthDate: partnerProfile.birth_date,
            job: partnerProfile.job,
            mbti: partnerProfile.mbti,
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
    
    // Promise.all로 모든 비동기 작업 완료 대기
    const enrichedHistory = await Promise.all(enrichedHistoryPromises);
    
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
      component: 'history_list',
      logLevel: 'info'
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
      component: 'history_list',
      logLevel: 'error'
    });
    
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: '히스토리 조회 중 오류가 발생했습니다.' }),
      logLevel: 'error'
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

    // DynamoDB에서 사용자 정보 조회
    const userResult = await ddbDocClient.send(
      new GetCommand({ TableName: 'Users', Key: { user_id: userId } })
    );
    const user = userResult.Item;
    
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // DynamoDB에서 포인트 히스토리 조회
    const { Items: pointsHistory = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'PointsHistory',
        FilterExpression: 'user_id = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      })
    );
    const userPointsHistory = pointsHistory;

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
      component: 'reward',
      logLevel: 'info'
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
      component: 'reward',
      logLevel: 'error'
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

    // DynamoDB에서 매칭 요청 조회
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchingRequests',
        FilterExpression: 'match_id = :matchId',
        ExpressionAttributeValues: { ':matchId': matchId }
      })
    );
    const matchingRequest = matchingRequests[0];
    
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

    // DynamoDB에서 매칭 페어 조회
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchPairs',
        FilterExpression: 'match_b_id = :matchId',
        ExpressionAttributeValues: { ':matchId': matchId }
      })
    );
    const matchPair = matchPairs[0];
    
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

    // DynamoDB에서 제안 조회
    const { Items: proposes = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'Proposes',
        FilterExpression: 'match_pair_id = :matchPairId',
        ExpressionAttributeValues: { ':matchPairId': matchPair.match_pair_id }
      })
    );
    const propose = proposes[0];
    
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
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Proposes',
          Key: { propose_id: propose.propose_id },
          UpdateExpression: 'SET #status = :status, updated_at = :updatedAt, responded_at = :respondedAt, #response = :response',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#response': 'response'
          },
          ExpressionAttributeValues: {
            ':status': 'accept',
            ':updatedAt': now,
            ':respondedAt': now,
            ':response': response
          }
        })
      );

      // 2. user-1의 매칭 요청 상태를 matched로 변경
      const user1MatchRequest = matchingRequests.find((req: any) => req.match_id === matchPair.match_a_id);
      if (user1MatchRequest) {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: 'MatchingRequests',
            Key: { match_id: user1MatchRequest.match_id },
            UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'matched',
              ':updatedAt': now
            }
          })
        );
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
      
      await ddbDocClient.send(
        new PutCommand({
          TableName: 'MatchingRequests',
          Item: newRequest
        })
      );

      // 4. 매칭 페어 상태를 matched로 변경
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'MatchPairs',
          Key: { match_pair_id: matchPair.match_pair_id },
          UpdateExpression: 'SET #status = :status, confirm_proposed = :confirmProposed, updated_at = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'matched',
            ':confirmProposed': true,
            ':updatedAt': now
          }
        })
      );

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
        executionTime: Date.now() - startTime,
        logLevel: 'info'
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
        }),
        logLevel: 'info'
      };

    } else {
      // 거절 처리
      
      // 1. 제안 상태를 refuse로 변경
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Proposes',
          Key: { propose_id: propose.propose_id },
          UpdateExpression: 'SET #status = :status, updated_at = :updatedAt, responded_at = :respondedAt, #response = :response',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#response': 'response'
          },
          ExpressionAttributeValues: {
            ':status': 'refuse',
            ':updatedAt': now,
            ':respondedAt': now,
            ':response': response
          }
        })
      );

      // 2. user-1의 매칭 요청 상태를 waiting으로 유지 (다른 매칭 시도 가능)
      const user1MatchRequest = matchingRequests.find((req: any) => req.match_id === matchPair.match_a_id);
      if (user1MatchRequest) {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: 'MatchingRequests',
            Key: { match_id: user1MatchRequest.match_id },
            UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'waiting',
              ':updatedAt': now
            }
          })
        );
      }

      // 3. 매칭 페어 상태를 finished로 변경
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'MatchPairs',
          Key: { match_pair_id: matchPair.match_pair_id },
          UpdateExpression: 'SET #status = :status, confirm_proposed = :confirmProposed, updated_at = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'finished',
            ':confirmProposed': false,
            ':updatedAt': now
          }
        })
      );

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
        executionTime: Date.now() - startTime,
        logLevel: 'info'
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
        }),
        logLevel: 'info'
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
      component: 'proposal_modal',
      logLevel: 'error'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
      logLevel: 'error'
    };
  }
};

// 매칭 상태 자동 전환 및 실패 처리 API
export const processMatchingStatus = async (event: any) => {
  try {
    const startTime = Date.now();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let updated = false;

    // 1. 모든 매칭 페어 조회
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ TableName: 'MatchPairs' })
    );
    // 2. 모든 매칭 요청 조회
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ TableName: 'MatchingRequests' })
    );
    // 3. 모든 유저 조회
    const { Items: users = [] } = await ddbDocClient.send(
      new ScanCommand({ TableName: 'Users' })
    );

    for (const pair of matchPairs) {
      const matchA = matchingRequests.find((req: any) => req.match_id === pair.match_a_id);
      const matchB = matchingRequests.find((req: any) => req.match_id === pair.match_b_id);
      if (!matchA || !matchB) continue;

      // 1. 양측 일정 선택 완료 시 confirmed 상태로 전환
      if (pair.status === 'matched' && matchA.choices_submitted_at && matchB.choices_submitted_at) {
        // 공통 날짜/장소 찾기
        const commonDates = matchA.date_choices.dates.filter((date: any) => matchB.date_choices.dates.includes(date));
        const commonLocations = matchA.date_choices.locations.filter((loc: any) => matchB.date_choices.locations.includes(loc));
        if (commonDates.length > 0 && commonLocations.length > 0) {
          // 자동으로 첫 번째 공통 날짜/장소 선택
          const suggestedDate = commonDates[0];
          const suggestedLocation = commonLocations[0];
          // 상태를 confirmed로 변경
          await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchPairs', Key: { match_pair_id: pair.match_pair_id }, UpdateExpression: 'set status = :s, confirmed_at = :ca, schedule_date = :sd, date_location = :dl, updated_at = :ua', ExpressionAttributeValues: { ':s': 'confirmed', ':ca': now.toISOString(), ':sd': suggestedDate, ':dl': suggestedLocation, ':ua': now.toISOString() } }));
          await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: matchA.match_id }, UpdateExpression: 'set status = :s, updated_at = :ua', ExpressionAttributeValues: { ':s': 'confirmed', ':ua': now.toISOString() } }));
          await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: matchB.match_id }, UpdateExpression: 'set status = :s, updated_at = :ua', ExpressionAttributeValues: { ':s': 'confirmed', ':ua': now.toISOString() } }));
          updated = true;
        }
      }

      // 2. 7일 초과 미응답 시 실패 처리
      if (pair.status === 'matched' && pair.created_at && new Date(pair.created_at) < sevenDaysAgo) {
        await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchPairs', Key: { match_pair_id: pair.match_pair_id }, UpdateExpression: 'set status = :s, failed_at = :fa, failure_reason = :fr, updated_at = :ua', ExpressionAttributeValues: { ':s': 'finished', ':fa': now.toISOString(), ':fr': 'timeout_no_response', ':ua': now.toISOString() } }));
        if (matchA) await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: matchA.match_id }, UpdateExpression: 'set status = :s, failure_reason = :fr, updated_at = :ua', ExpressionAttributeValues: { ':s': 'failed', ':fr': 'timeout_no_response', ':ua': now.toISOString() } }));
        if (matchB) await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: matchB.match_id }, UpdateExpression: 'set status = :s, failure_reason = :fr, updated_at = :ua', ExpressionAttributeValues: { ':s': 'failed', ':fr': 'timeout_no_response', ':ua': now.toISOString() } }));
        // 포인트 반환 (users, PointsHistory)
        for (const match of [matchA, matchB]) {
          if (match && !match.points_refunded) {
            const user = users.find((u: any) => u.user_id === match.requester_id);
            if (user) {
              await ddbDocClient.send(new UpdateCommand({ TableName: 'Users', Key: { user_id: user.user_id }, UpdateExpression: 'set points = points + :val', ExpressionAttributeValues: { ':val': 100 } }));
              await ddbDocClient.send(new PutCommand({ TableName: 'PointsHistory', Item: { history_id: uuidv4(), user_id: match.requester_id, type: 'refund', points: 100, description: '매칭 실패로 인한 포인트 반환', created_at: now.toISOString() } }));
              await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: match.match_id }, UpdateExpression: 'set points_refunded = :pr', ExpressionAttributeValues: { ':pr': true } }));
            }
          }
        }
        updated = true;
      }

      // 3. 30일 초과 미진행 시 실패 처리
      if (pair.status === 'confirmed' && pair.confirmed_at && new Date(pair.confirmed_at) < thirtyDaysAgo) {
        await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchPairs', Key: { match_pair_id: pair.match_pair_id }, UpdateExpression: 'set status = :s, failed_at = :fa, failure_reason = :fr, updated_at = :ua', ExpressionAttributeValues: { ':s': 'finished', ':fa': now.toISOString(), ':fr': 'timeout_no_meeting', ':ua': now.toISOString() } }));
        if (matchA) await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: matchA.match_id }, UpdateExpression: 'set status = :s, failure_reason = :fr, updated_at = :ua', ExpressionAttributeValues: { ':s': 'failed', ':fr': 'timeout_no_meeting', ':ua': now.toISOString() } }));
        if (matchB) await ddbDocClient.send(new UpdateCommand({ TableName: 'MatchingRequests', Key: { match_id: matchB.match_id }, UpdateExpression: 'set status = :s, failure_reason = :fr, updated_at = :ua', ExpressionAttributeValues: { ':s': 'failed', ':fr': 'timeout_no_meeting', ':ua': now.toISOString() } }));
        updated = true;
      }
    }

    await appendLog({
      type: 'process_matching_status',
      result: 'success',
      message: '매칭 상태 자동 처리 완료',
      detail: { processedPairs: matchPairs.length, updated: updated },
      action: '매칭 상태 처리',
      executionTime: Date.now() - startTime,
      logLevel: 'info'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: '매칭 상태 처리 완료', updated: updated }),
      logLevel: 'info'
    };
  } catch (error: any) {
    console.error('processMatchingStatus error:', error);
    await appendLog({
      type: 'process_matching_status',
      result: 'fail',
      message: '매칭 상태 자동 처리 실패',
      detail: { error: error.message },
      action: '매칭 상태 처리',
      logLevel: 'error'
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
      logLevel: 'error'
    };
  }
};

// 연락처 공유 처리 (쌍방 YES 선택 시)
export const shareContact = async (event: any) => {
  const { match_pair_id, user_id, want_to_meet_again } = JSON.parse(event.body || '{}');
  
  try {
    // DynamoDB에서 매칭 페어 조회
    const { Item: match } = await ddbDocClient.send(
      new GetCommand({ 
        TableName: 'MatchPairs',
        Key: { match_pair_id }
      })
    );
    
    if (!match) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Match pair not found' }),
        logLevel: 'error'
      };
    }
    
    const now = new Date().toISOString();
    
    // 사용자의 재만남 의사 저장
    let updateExpression = '';
    let expressionAttributeNames: any = {};
    let expressionAttributeValues: any = { ':updatedAt': now };
    
    if (match.user_a_id === user_id) {
      updateExpression = 'SET user_a_want_to_meet_again = :wantToMeetAgain, updated_at = :updatedAt';
      expressionAttributeValues[':wantToMeetAgain'] = want_to_meet_again;
    } else if (match.user_b_id === user_id) {
      updateExpression = 'SET user_b_want_to_meet_again = :wantToMeetAgain, updated_at = :updatedAt';
      expressionAttributeValues[':wantToMeetAgain'] = want_to_meet_again;
    }
    
    // 양측 모두 YES인지 확인
    const userAWantToMeet = match.user_a_id === user_id ? want_to_meet_again : match.user_a_want_to_meet_again;
    const userBWantToMeet = match.user_b_id === user_id ? want_to_meet_again : match.user_b_want_to_meet_again;
    
    if (userAWantToMeet === true && userBWantToMeet === true) {
      // 연락처 공유 활성화
      updateExpression = 'SET contact_shared = :contactShared, both_interested = :bothInterested, #status = :status, finished_at = :finishedAt, updated_at = :updatedAt';
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':contactShared'] = true;
      expressionAttributeValues[':bothInterested'] = true;
      expressionAttributeValues[':status'] = 'finished';
      expressionAttributeValues[':finishedAt'] = now;
      
      // matching-requests 상태도 같이 변경
      const { Items: matchingRequests = [] } = await ddbDocClient.send(
        new ScanCommand({ 
          TableName: 'MatchingRequests',
          FilterExpression: 'match_id IN (:matchAId, :matchBId)',
          ExpressionAttributeValues: { 
            ':matchAId': match.match_a_id,
            ':matchBId': match.match_b_id
          }
        })
      );
      
      // 매칭 요청 상태 업데이트
      for (const req of matchingRequests) {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: 'MatchingRequests',
            Key: { match_id: req.match_id },
            UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'finished',
              ':updatedAt': now
            }
          })
        );
      }
    }
    
    // 매칭 페어 업데이트
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: 'MatchPairs',
        Key: { match_pair_id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      })
    );
    
    await appendLog({
      type: 'contact_share_updated',
      userId: user_id,
      result: 'success',
      detail: { match_pair_id, want_to_meet_again, contact_shared: userAWantToMeet === true && userBWantToMeet === true },
      action: '연락처 공유 처리',
      logLevel: 'info'
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        contact_shared: userAWantToMeet === true && userBWantToMeet === true,
        both_interested: userAWantToMeet === true && userBWantToMeet === true
      }),
      logLevel: 'info'
    };
  } catch (error: any) {
    console.error('processMatchingStatus error:', error);
    
    await appendLog({
      type: 'contact_share_updated',
      userId: user_id,
      result: 'fail',
      message: '연락처 공유 처리 실패',
      errorStack: error instanceof Error ? error.stack : '',
      action: '연락처 공유 처리',
      logLevel: 'error'
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
      logLevel: 'error'
    };
  }
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

    // DynamoDB에서 제안 조회
    const { Item: propose } = await ddbDocClient.send(
      new GetCommand({ 
        TableName: 'Proposes',
        Key: { propose_id: proposeId }
      })
    );
    
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
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Proposes',
          Key: { propose_id: proposeId },
          UpdateExpression: 'SET #status = :status, updated_at = :updatedAt, responded_at = :respondedAt, #response = :response',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#response': 'response'
          },
          ExpressionAttributeValues: {
            ':status': 'accept',
            ':updatedAt': now,
            ':respondedAt': now,
            ':response': response
          }
        })
      );

      // 2. user-1의 매칭 요청 상태를 matched로 변경
      const { Items: matchingRequests = [] } = await ddbDocClient.send(
        new ScanCommand({ 
          TableName: 'MatchingRequests',
          FilterExpression: 'requester_id = :userId',
          ExpressionAttributeValues: { ':userId': propose.propose_user_id }
        })
      );
      const user1MatchRequest = matchingRequests[0];
      
      if (user1MatchRequest) {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: 'MatchingRequests',
            Key: { match_id: user1MatchRequest.match_id },
            UpdateExpression: 'SET #status = :status, updated_at = :updatedAt, partner_id = :partnerId',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'matched',
              ':updatedAt': now,
              ':partnerId': propose.target_id
            }
          })
        );
      }

      // 3. user-2의 매칭 요청 상태를 matched로 변경
      const { Items: user2Requests = [] } = await ddbDocClient.send(
        new ScanCommand({ 
          TableName: 'MatchingRequests',
          FilterExpression: 'requester_id = :userId',
          ExpressionAttributeValues: { ':userId': propose.target_id }
        })
      );
      const user2MatchRequest = user2Requests[0];
      
      if (user2MatchRequest) {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: 'MatchingRequests',
            Key: { match_id: user2MatchRequest.match_id },
            UpdateExpression: 'SET #status = :status, updated_at = :updatedAt, partner_id = :partnerId',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'matched',
              ':updatedAt': now,
              ':partnerId': propose.propose_user_id
            }
          })
        );
      }

      // 4. 매칭 페어 생성
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
      
      await ddbDocClient.send(
        new PutCommand({
          TableName: 'MatchPairs',
          Item: newMatchPair
        })
      );

      // 5. propose에 match_pair_id 연결
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Proposes',
          Key: { propose_id: proposeId },
          UpdateExpression: 'SET match_pair_id = :matchPairId',
          ExpressionAttributeValues: {
            ':matchPairId': newMatchPair.match_pair_id
          }
        })
      );

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
        executionTime: Date.now() - startTime,
        logLevel: 'info'
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
        }),
        logLevel: 'info'
      };

    } else {
      // 거절 처리
      
      // 1. 제안 상태를 refuse로 변경
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'Proposes',
          Key: { propose_id: proposeId },
          UpdateExpression: 'SET #status = :status, updated_at = :updatedAt, responded_at = :respondedAt, #response = :response',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#response': 'response'
          },
          ExpressionAttributeValues: {
            ':status': 'refuse',
            ':updatedAt': now,
            ':respondedAt': now,
            ':response': response
          }
        })
      );

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
        executionTime: Date.now() - startTime,
        logLevel: 'info'
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
        }),
        logLevel: 'info'
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
      component: 'proposal_modal',
      logLevel: 'error'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
      logLevel: 'error'
    };
  }
}; 

export const saveReviewContact = async (event: any) => {
  const { match_id, reviewer_id, contact } = JSON.parse(event.body || '{}');
  if (!match_id || !reviewer_id || !contact) {
    return { statusCode: 400, body: JSON.stringify({ error: '필수 파라미터 누락' }) };
  }
  
  try {
    // DynamoDB에서 리뷰 조회
    const { Items: reviews = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'Reviews',
        FilterExpression: 'match_id = :matchId AND reviewer_id = :reviewerId',
        ExpressionAttributeValues: { 
          ':matchId': match_id,
          ':reviewerId': reviewer_id
        }
      })
    );
    
    if (reviews.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: '리뷰를 찾을 수 없습니다.' }) };
    }
    
    const review = reviews[0];
    
    // 리뷰에 연락처 정보 업데이트
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: 'Reviews',
        Key: { review_id: review.review_id },
        UpdateExpression: 'SET contact = :contact, contact_shared_at = :contactSharedAt',
        ExpressionAttributeValues: {
          ':contact': contact,
          ':contactSharedAt': new Date().toISOString()
        }
      })
    );

    // 연락처가 양쪽 모두 입력되면 MatchingRequests 상태 exchanged로 변경
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchPairs',
        FilterExpression: 'match_a_id = :matchId OR match_b_id = :matchId',
        ExpressionAttributeValues: { ':matchId': match_id }
      })
    );
    
    if (matchPairs.length > 0) {
      const matchPair = matchPairs[0];
      
      // 양쪽 리뷰 조회
      const { Items: allReviews = [] } = await ddbDocClient.send(
        new ScanCommand({ 
          TableName: 'Reviews',
          FilterExpression: 'match_id IN (:matchAId, :matchBId)',
          ExpressionAttributeValues: { 
            ':matchAId': matchPair.match_a_id,
            ':matchBId': matchPair.match_b_id
          }
        })
      );
      
      const reviewsA = allReviews.find((r: any) => r.match_id === matchPair.match_a_id);
      const reviewsB = allReviews.find((r: any) => r.match_id === matchPair.match_b_id);
      
      if (reviewsA?.contact && reviewsB?.contact) {
        // 매칭 요청 상태를 exchanged로 변경
        const { Items: matchingRequests = [] } = await ddbDocClient.send(
          new ScanCommand({ 
            TableName: 'MatchingRequests',
            FilterExpression: 'match_id IN (:matchAId, :matchBId)',
            ExpressionAttributeValues: { 
              ':matchAId': matchPair.match_a_id,
              ':matchBId': matchPair.match_b_id
            }
          })
        );
        
        for (const req of matchingRequests) {
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: 'MatchingRequests',
              Key: { match_id: req.match_id },
              UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'exchanged',
                ':updatedAt': new Date().toISOString()
              }
            })
          );
        }
      }
    }

    await appendLog({
      type: 'review_contact_saved',
      userId: reviewer_id,
      result: 'success',
      detail: { match_id, reviewer_id, contact },
      logLevel: 'info'
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error: any) {
    console.error('saveReviewContact error:', error);
    
    await appendLog({
      type: 'review_contact_saved',
      userId: reviewer_id,
      result: 'fail',
      message: '연락처 저장 실패',
      errorStack: error instanceof Error ? error.stack : '',
      detail: { match_id, reviewer_id, contact },
      logLevel: 'error'
    });
    
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// 연락처 상세 정보 조회
export const getContactDetail = async (event: any) => {
  const matchId = event.queryStringParameters?.matchId;
  const userId = event.headers?.userid;
  
  if (!matchId || !userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'matchId와 userId가 필요합니다.' }) };
  }

  try {
    // DynamoDB에서 매칭 페어 조회
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchPairs',
        FilterExpression: 'match_a_id = :matchId OR match_b_id = :matchId',
        ExpressionAttributeValues: { ':matchId': matchId }
      })
    );
    const matchPair = matchPairs[0];
    
    if (!matchPair) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 정보를 찾을 수 없습니다.' }) };
    }

    // DynamoDB에서 매칭 요청 조회
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchingRequests',
        FilterExpression: 'match_id IN (:matchAId, :matchBId)',
        ExpressionAttributeValues: { 
          ':matchAId': matchPair.match_a_id,
          ':matchBId': matchPair.match_b_id
        }
      })
    );

    // 현재 사용자와 상대방의 매칭 요청 찾기
    const myRequest = matchingRequests.find((r: any) => r.match_id === matchId && r.requester_id === userId);
    const otherRequest = matchingRequests.find((r: any) => 
      (r.match_id === matchPair.match_a_id || r.match_id === matchPair.match_b_id) && r.requester_id !== userId
    );

    if (!myRequest || !otherRequest) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 요청 정보를 찾을 수 없습니다.' }) };
    }

    // DynamoDB에서 상대방 프로필 정보 조회
    const { Item: otherProfile } = await ddbDocClient.send(
      new GetCommand({ 
        TableName: 'Profiles',
        Key: { user_id: otherRequest.requester_id }
      })
    );
    
    // 디버깅 로그 추가
    console.log('=== getContactDetail Debug ===');
    console.log('otherRequest.requester_id:', otherRequest.requester_id);
    console.log('otherProfile:', otherProfile);
    console.log('otherProfile?.photos:', otherProfile?.photos);
    console.log('============================');
    
    // DynamoDB에서 상대방 연락처 정보 조회
    const { Items: reviews = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'Reviews',
        FilterExpression: 'match_id = :matchId',
        ExpressionAttributeValues: { ':matchId': otherRequest.match_id }
      })
    );
    const otherReview = reviews[0];
    const contact = otherReview?.contact || null;

    await appendLog({
      type: 'contact_detail_viewed',
      userId: userId,
      result: 'success',
      detail: { matchId, otherUserId: otherRequest.requester_id },
      action: '연락처 상세 조회',
      screen: 'ContactDetailScreen',
      component: 'contact_detail',
      logLevel: 'info'
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
      }),
      logLevel: 'info'
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
      component: 'contact_detail',
      logLevel: 'error'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' }),
      logLevel: 'error'
    };
  }
};

export const finishMeeting = async (event: any) => {
  const { match_id, user_id } = JSON.parse(event.body || '{}');
  if (!match_id || !user_id) {
    return { statusCode: 400, body: JSON.stringify({ error: '필수 파라미터 누락' }) };
  }

  try {
    // DynamoDB에서 매칭 페어 조회
    const { Items: matchPairs = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchPairs',
        FilterExpression: 'match_a_id = :matchId OR match_b_id = :matchId',
        ExpressionAttributeValues: { ':matchId': match_id }
      })
    );
    const matchPair = matchPairs[0];
    
    if (!matchPair) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 쌍을 찾을 수 없습니다.' }) };
    }

    // DynamoDB에서 매칭 요청 조회
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchingRequests',
        FilterExpression: 'match_id IN (:matchAId, :matchBId)',
        ExpressionAttributeValues: { 
          ':matchAId': matchPair.match_a_id,
          ':matchBId': matchPair.match_b_id
        }
      })
    );
    
    // 현재 사용자의 매칭 요청 찾기
    const myRequest = matchingRequests.find((r: any) => r.match_id === match_id && r.requester_id === user_id);
    if (!myRequest) {
      return { statusCode: 404, body: JSON.stringify({ error: '매칭 요청을 찾을 수 없습니다.' }) };
    }

    // 현재 사용자의 상태를 finished로 변경
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: 'MatchingRequests',
        Key: { match_id },
        UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'finished',
          ':updatedAt': new Date().toISOString()
        }
      })
    );

    // 상대방의 매칭 요청 찾기
    const otherMatchId = match_id === matchPair.match_a_id ? matchPair.match_b_id : matchPair.match_a_id;
    const otherRequest = matchingRequests.find((r: any) => r.match_id === otherMatchId);
    
    // 상대방도 finished 상태인지 확인
    if (otherRequest && otherRequest.status === 'finished') {
      // 둘 다 finished 상태이면 DynamoDB에서 매칭 요청 삭제
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: 'MatchingRequests',
          Key: { match_id: otherRequest.match_id },
          UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'finished',
            ':updatedAt': new Date().toISOString()
          }
        })
      );
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
        both_finished: otherRequest && otherRequest.status === 'finished'
      },
      logLevel: 'info'
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
      logLevel: 'error'
    });

    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }), logLevel: 'error' };
  }
};

// 3일 후 자동 삭제 기능 (DynamoDB 기반)
export const cleanupFinishedRequests = async (event: any) => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3일 전
    
    // DynamoDB에서 finished 상태인 매칭 요청 조회
    const { Items: matchingRequests = [] } = await ddbDocClient.send(
      new ScanCommand({ 
        TableName: 'MatchingRequests',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'finished' }
      })
    );
    
    let deletedCount = 0;
    
    // 3일이 지난 finished 요청들을 찾아서 처리
    for (const request of matchingRequests) {
      if (request.updated_at) {
        const finishedAt = new Date(request.updated_at);
        if (finishedAt < threeDaysAgo) {
          // DynamoDB에서 해당 매칭 요청 삭제
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: 'MatchingRequests',
              Key: { match_id: request.match_id },
              UpdateExpression: 'SET #status = :status, cleanup_reason = :reason, updated_at = :updatedAt',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': 'cleaned',
                ':reason': '3일 경과 자동 삭제',
                ':updatedAt': now.toISOString()
              }
            })
          );
          
          deletedCount++;
          
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
            logLevel: 'info'
          });
        }
      }
    }
    
    if (deletedCount > 0) {
      await appendLog({
        type: 'cleanup_finished_requests',
        result: 'success',
        detail: { 
          deleted_count: deletedCount,
          total_requests: matchingRequests.length
        },
        logLevel: 'info'
      });
    }
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true, 
        deleted_count: deletedCount,
        total_requests: matchingRequests.length
      }),
      logLevel: 'info'
    };
  } catch (error: any) {
    console.error('cleanupFinishedRequests error:', error);
    
    await appendLog({
      type: 'cleanup_finished_requests',
      result: 'fail',
      message: '자동 삭제 실패',
      detail: { error: error.message },
      logLevel: 'error'
    });

    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }), logLevel: 'error' };
  }
};

// 히스토리 상세 조회 (DynamoDB 기반)
export const getHistoryDetail = async (event: any) => {
  const { matchPairId } = event.pathParameters || {};
  if (!matchPairId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'matchPairId required' }) };
  }
  
  try {
    // DynamoDB에서 히스토리 조회
    const { Item: history } = await ddbDocClient.send(
      new GetCommand({
        TableName: 'MatchingHistory',
        Key: { match_pair_id: matchPairId }
      })
    );
    
    if (!history) {
      return { statusCode: 404, body: JSON.stringify({ error: 'History not found' }) };
    }
    
    // 파트너 정보 추가
    const userRequest = history.request_a;
    const partnerRequest = history.request_b;
    const partnerId = userRequest?.partner_id;
    
    let partnerInfo = null;
    if (partnerId) {
      // DynamoDB에서 파트너 프로필 조회
      const { Item: partnerProfile } = await ddbDocClient.send(
        new GetCommand({
          TableName: 'Profiles',
          Key: { user_id: partnerId }
        })
      );
      
      if (partnerProfile) {
        if (history.final_status === 'finished') {
          partnerInfo = {
            name: partnerProfile.name,
            birthDate: partnerProfile.birth_date,
            job: partnerProfile.job,
            mbti: partnerProfile.mbti,
            location: partnerProfile.location,
            photos: []
          };
        } else {
          partnerInfo = {
            name: partnerProfile.name,
            birthDate: partnerProfile.birth_date,
            job: partnerProfile.job,
            mbti: partnerProfile.mbti,
            location: partnerProfile.location,
            photos: partnerProfile.photos || []
          };
        }
      }
    }
    
    // 타임라인 생성
    const matchTimeline = [];
    if (history.request_a?.created_at) matchTimeline.push({ label: '신청일', date: history.request_a.created_at });
    if (history.request_a?.final_date) matchTimeline.push({ label: '매칭 확정일', date: history.request_a.final_date });
    if (history.review_a?.created_at) matchTimeline.push({ label: '후기 작성일', date: history.review_a.created_at });
    if (history.review_a?.contact_shared_at) matchTimeline.push({ label: '연락처 교환일', date: history.review_a.contact_shared_at });
    
    const detail = {
      ...history,
      partner: partnerInfo,
      matchTimeline
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(snakeToCamelCase(detail))
    };
  } catch (error: any) {
    console.error('getHistoryDetail error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// DynamoDB 테이블 생성 함수
export const createDynamoDBTables = async (event: any) => {
  try {
    console.log('=== DynamoDB 테이블 생성 시작 ===');
    
    const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
    const dynamoClient = new DynamoDBClient({
      region: 'ap-northeast-2',
      endpoint: 'http://localhost:8000' // DynamoDB Local
    });
    
    // 1. users 테이블 생성
    try {
      await dynamoClient.send(new CreateTableCommand({
        TableName: 'Users',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }));
      console.log('Users 테이블 생성 완료');
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log('Users 테이블이 이미 존재합니다');
      } else {
        console.error('Users 테이블 생성 실패:', error);
      }
    }
    
    // 2. profiles 테이블 생성
    try {
      await dynamoClient.send(new CreateTableCommand({
        TableName: 'Profiles',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }));
      console.log('Profiles 테이블 생성 완료');
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log('Profiles 테이블이 이미 존재합니다');
      } else {
        console.error('Profiles 테이블 생성 실패:', error);
      }
    }
    
    // 3. Preferences 테이블 생성
    try {
      await dynamoClient.send(new CreateTableCommand({
        TableName: 'Preferences',
        KeySchema: [
          { AttributeName: 'user_id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }));
      console.log('Preferences 테이블 생성 완료');
    } catch (error: any) {
      if (error.name === 'ResourceInUseException') {
        console.log('Preferences 테이블이 이미 존재합니다');
      } else {
        console.error('Preferences 테이블 생성 실패:', error);
      }
    }
    
    console.log('=== DynamoDB 테이블 생성 완료 ===');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'DynamoDB 테이블 생성 완료'
      })
    };
  } catch (error: any) {
    console.error('DynamoDB 테이블 생성 에러:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: '테이블 생성 실패', message: error.message })
    };
  }
};