import { UserPreferences } from '../types';

const API_BASE = 'http://192.168.219.100:3000';

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const res = await fetch(`${API_BASE}/preferences/${userId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveUserPreferences(data: UserPreferences): Promise<void> {
  await fetch(`${API_BASE}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
} 