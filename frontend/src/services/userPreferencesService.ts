import { apiGet, apiPost } from '../utils/apiUtils';
import { Preferences } from '../types/preference';

// 이상형 정보 조회 (단일 책임)
export async function getPreferences(userId: string): Promise<Preferences | null> {
  try {
    const data = await apiGet(`/user-preferences/${userId}`);
    if (!data) return null;
    return data as Preferences;
  } catch (error) {
    console.error('이상형 프로필 조회 실패:', error);
    return null;
  }
}

// 이상형 정보 저장 (단일 책임)
export async function savePreferences(data: Preferences): Promise<boolean> {
  try {
    await apiPost('/user-preferences', data);
    return true;
  } catch (error) {
    console.error('이상형 프로필 저장 실패:', error);
    return false;
  }
} 