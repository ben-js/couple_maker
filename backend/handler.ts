// 더미 데이터
// User 타입을 email 기반으로 통일
// 회원가입/로그인 모두 email, password만 사용

import fs from 'fs';
import path from 'path';

const usersPath = path.join(__dirname, 'data/users.json');
const profilesPath = path.join(__dirname, 'data/profiles.json');
const preferencesPath = path.join(__dirname, 'data/preferences.json');

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJson(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

type User = { id: string; email: string; password: string };
type UserStatus = { userId: string; status: string; date: string };
type UserProfile = { userId: string; [key: string]: any };
type UserPreferences = { userId: string; [key: string]: any };

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
  return { statusCode: 201, body: JSON.stringify({ id, email }) };
};

// 로그인
export const login = async (event: any) => {
  const { email, password } = JSON.parse(event.body || '{}');
  const users: User[] = readJson(usersPath);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials', input: { email, password } }) };
  }
  const profiles: UserProfile[] = readJson(profilesPath);
  const preferences: UserPreferences[] = readJson(preferencesPath);
  const hasProfile = profiles.some(p => p.userId === user.id);
  const hasPreferences = preferences.some(p => p.userId === user.id);
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