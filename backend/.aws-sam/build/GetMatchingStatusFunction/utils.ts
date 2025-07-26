import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { camelToSnakeCase, snakeToCamelCase } from './utils/caseUtils';
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
  return path.join('/tmp', fileName); // Lambda에서는 /tmp 디렉토리 사용
}

// 로그 디렉토리 생성
function ensureLogDirectory() {
  const logDir = '/tmp';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

export async function appendLog({ 
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

export function getBaseUrl(event: any) {
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers.host || event.requestContext?.domainName;
  return `${protocol}://${host}`;
}

export function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const contentTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json'
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
}

export function generateS3Path(userId: string, fileName: string, type: 'profile' | 'temp' = 'profile'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  if (type === 'temp') {
    return `temp/${userId}/${fileName}`;
  }
  
  return `${year}/${month}/${day}/${userId}/${fileName}`;
}

export function validateFileSize(buffer: Buffer): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return buffer.length <= maxSize;
}

export function validateImageFormat(fileName: string): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

export function calcAge(birthDate: any): number | null {
  if (!birthDate) return null;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('나이 계산 오류:', error);
    return null;
  }
}

// 공통 응답 헤더
export const commonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// 공통 모듈들 export
export { ddbDocClient, cognitoService, S3Client, PutObjectCommand, GetObjectCommand, getSignedUrl };
export { camelToSnakeCase, snakeToCamelCase }; 