import { apiGet, apiPost } from '@/utils/apiUtils';
import { UserPreferences } from '@/types';

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const data = await apiGet(`/user-preferences/${userId}`);
    return data; // 백엔드에서 이미 camelCase로 변환 후 반환
  } catch (error) {
    console.error('이상형 프로필 조회 실패:', error);
    return null;
  }
}

export async function saveUserPreferences(data: UserPreferences): Promise<boolean> {
  try {
    await apiPost('/user-preferences', data); // camelCase 그대로 전송
    return true;
  } catch (error) {
    console.error('이상형 프로필 저장 실패:', error);
    return false;
  }
} 