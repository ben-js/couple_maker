// '@/utils/apiUtils' 관련 import 구문을 모두 삭제
import { User } from '@/types';
import { apiGet, apiPost } from '@/utils/apiUtils';

export async function signup(userData: { email: string; password: string; name: string }): Promise<User | null> {
  try {
    const data = await apiPost<any>('/signup', userData);
    if (data && !data.id && (data.userId || data.user_id)) {
      data.id = data.userId || data.user_id;
    }
    return data as User;
  } catch (error) {
    console.error('회원가입 실패:', error);
    return null;
  }
}

export async function login(credentials: { email: string; password: string }): Promise<User | null> {
  try {
    console.log('🔐 로그인 시도:', { email: credentials.email, password: credentials.password ? '***' : 'empty' });
    const data = await apiPost<any>('/login', credentials);
    console.log('📥 로그인 응답:', data);
    if (data && !data.id && (data.userId || data.user_id)) {
      data.id = data.userId || data.user_id;
      console.log('🔄 ID 매핑 완료:', { originalId: data.userId || data.user_id, mappedId: data.id });
    }
    console.log('✅ 최종 사용자 데이터:', data);
    return data as User;
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const data = await apiGet<any>(`/profile/${userId}`);
    if (data && !data.id && (data.userId || data.user_id)) {
      data.id = data.userId || data.user_id;
    }
    return data as User;
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    return null;
  }
}

export async function saveProfile(profile: User): Promise<boolean> {
  try {
    await apiPost('/profile', profile);
    return true;
  } catch (error) {
    console.error('프로필 저장 실패:', error);
    return false;
  }
} 