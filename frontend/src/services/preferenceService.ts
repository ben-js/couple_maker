import { apiGet, apiPost } from '../utils/apiUtils';
import { Preferences } from '../types/preference';

// 이상형 정보 조회 (단일 책임)
export async function getPreferences(userId: string): Promise<Preferences | null> {
  try {
    console.log('🔍 getPreferences 호출됨, userId:', userId);
    const response = await apiGet(`/user-preferences/${userId}`);
    console.log('🔍 API 응답:', response);
    
    // 백엔드 응답 구조: { success: true, ...data }
    if (response && response.success) {
      console.log('🔍 preferences 데이터:', response);
      return response as Preferences;
    }
    
    console.log('🔍 preferences 데이터 없음');
    return null;
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