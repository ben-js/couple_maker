import { User } from '../types';

// 실제 REST API URL에 맞게 수정
const API_BASE = 'http://192.168.219.100:3000'; // ← 본인 PC의 사설 IP로 변경

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('로그인 실패');
  return res.json();
}

export async function getUserProfile(userId: string): Promise<User> {
  const res = await fetch(`${API_BASE}/user/${userId}`);
  if (!res.ok) throw new Error('회원정보 조회 실패');
  return res.json();
}

export async function saveUserProfile(userId: string, profile: any): Promise<User> {
  const res = await fetch(`${API_BASE}/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('프로필 저장 실패');
  return res.json();
} 