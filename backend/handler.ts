// 더미 데이터
// User 타입을 email 기반으로 통일
// 회원가입/로그인 모두 email, password만 사용

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const usersPath = path.join(__dirname, 'data/users.json');
const profilesPath = path.join(__dirname, 'data/profiles.json');
const preferencesPath = path.join(__dirname, 'data/preferences.json');
const logsPath = path.join(__dirname, 'data/logs.json');

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

type User = { id: string; email: string; password: string; hasProfile?: boolean; hasPreferences?: boolean };
type UserStatus = { userId: string; status: string; date: string };
type UserProfile = { userId: string; [key: string]: any };
type UserPreferences = { userId: string; [key: string]: any };

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

async function appendLog({ type, userId = '', email = '', ip = '', hasProfile = false, hasPreferences = false, result = '', message = '', detail = {} }: {
  type: string;
  userId?: string;
  email?: string;
  ip?: string;
  hasProfile?: boolean;
  hasPreferences?: boolean;
  result?: string;
  message?: string;
  detail?: any;
}) {  
  ensureLogDirectory();
  
  const logEntry = {
    logId: uuidv4(),
    type,
    userId,
    email,
    ip,
    hasProfile,
    hasPreferences,
    result,
    message,
    detail,
    date: new Date().toISOString(),
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
    
    console.log(`Log saved to: ${logFilePath}`);
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
  const { email, password } = JSON.parse(event.body || '{}');
  const users: User[] = readJson(usersPath);
  const id = `user-${users.length + 1}`;
  users.push({ id, email, password });
  writeJson(usersPath, users);
  appendLog({
    type: 'signup',
    userId: id,
    email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: {},
  });
  return { statusCode: 201, body: JSON.stringify({ id, email }) };
};

// 로그인
export const login = async (event: any) => {
  const { email, password } = JSON.parse(event.body || '{}');
  console.log('Login request:', { email, password });
  const users: User[] = readJson(usersPath);
  console.log('Available users:', users);
  const user = users.find(u => u.email === email && u.password === password);
  const ip = event?.requestContext?.identity?.sourceIp || '';
  if (!user) {
    appendLog({
      type: 'login',
      userId: '',
      email,
      ip,
      hasProfile: false,
      hasPreferences: false,
      result: 'fail',
      message: 'Invalid credentials',
      detail: {},
    });
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials', input: { email, password } }) };
  }
  const profiles: UserProfile[] = readJson(profilesPath);
  const preferences: UserPreferences[] = readJson(preferencesPath);
  const hasProfile = user.hasProfile;
  const hasPreferences = user.hasPreferences;
  
  console.log('Profiles data:', profiles);
  console.log('User ID:', user.id);
  console.log('Profile userIds:', profiles.map(p => p.userId));
  console.log('HasProfile result:', hasProfile);
  console.log('HasPreferences result:', hasPreferences);
  
  appendLog({
    type: 'login',
    userId: user.id,
    email: user.email,
    ip,
    hasProfile,
    hasPreferences,
    result: 'success',
    detail: {},
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      hasProfile,
      hasPreferences
    })
  };
};

// 프로필 저장
export const saveProfile = async (event: any) => {
  const { userId, ...profile } = JSON.parse(event.body || '{}');
  const profiles: UserProfile[] = readJson(profilesPath);
  const idx = profiles.findIndex(p => p.userId === userId);
  if (idx >= 0) profiles[idx] = { userId, ...profile };
  else profiles.push({ userId, ...profile });
  writeJson(profilesPath, profiles);

  // users.json의 hasProfile true로 변경
  const users = readJson(usersPath);
  const userIdx = users.findIndex((u: any) => u.id === userId);
  let email = '';
  if (userIdx >= 0) {
    users[userIdx].hasProfile = true;
    email = users[userIdx].email;
    writeJson(usersPath, users);
  }

  appendLog({
    type: 'profile_save',
    userId,
    email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: { profile },
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// 이상형 저장
export const savePreferences = async (event: any) => {
  const { userId, ...prefs } = JSON.parse(event.body || '{}');
  const preferences: UserPreferences[] = readJson(preferencesPath);
  const idx = preferences.findIndex(p => p.userId === userId);
  if (idx >= 0) preferences[idx] = { userId, ...prefs };
  else preferences.push({ userId, ...prefs });
  writeJson(preferencesPath, preferences);

  // 이메일 추출
  const users = readJson(usersPath);
  const user = users.find((u: any) => u.id === userId);
  const email = user ? user.email : '';

  appendLog({
    type: 'preferences_save',
    userId,
    email,
    ip: event?.requestContext?.identity?.sourceIp || '',
    result: 'success',
    detail: { prefs },
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// 프로필 조회
export const getProfile = async (event: any) => {
  const { userId } = event.pathParameters || {};
  const profiles: UserProfile[] = readJson(profilesPath);
  const profile = profiles.find(p => p.userId === userId);
  if (profile) {
    return { statusCode: 200, body: JSON.stringify(profile) };
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found' }) };
};

// 이상형 조회
export const getPreferences = async (event: any) => {
  const { userId } = event.pathParameters || {};
  const preferences: UserPreferences[] = readJson(preferencesPath);
  const pref = preferences.find(p => p.userId === userId);
  if (pref) {
    return { statusCode: 200, body: JSON.stringify(pref) };
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'Preferences not found' }) };
}; 