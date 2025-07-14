import { UserProfile } from '../types/profile';
import { apiGet, apiPost } from '../utils/apiUtils';
import * as FileSystem from 'expo-file-system';

// 회원가입 (단일 책임)
export async function signup(userData: { email: string; password: string; name: string }): Promise<UserProfile | null> {
  try {
    const data = await apiPost<UserProfile>('/signup', userData);
    if (data && !data.id && (data.userId || data.user_id)) {
      data.id = data.userId || data.user_id;
    }
    return data;
  } catch (error) {
    console.error('회원가입 실패:', error);
    return null;
  }
}

// 로그인 (단일 책임)
export async function login(credentials: { email: string; password: string }): Promise<UserProfile | null> {
  try {
    const data = await apiPost<UserProfile>('/login', credentials);
    if (data && !data.id && (data.userId || data.user_id)) {
      data.id = data.userId || data.user_id;
    }
    return data;
  } catch (error) {
    console.error('로그인 실패:', error);
    return null;
  }
}

// 프로필 조회 (단일 책임)
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const data = await apiGet<UserProfile>(`/profile/${userId}`);
    if (data && !data.id && (data.userId || data.user_id)) {
      data.id = data.userId || data.user_id;
    }
    return data;
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    return null;
  }
}

// 프로필 저장 (단일 책임)
export async function saveProfile(profile: UserProfile): Promise<boolean> {
  try {
    // 이미지들을 백엔드에 업로드
    const uploadedPhotos = [];
    if (profile.photos && profile.photos.length > 0) {
      for (let i = 0; i < profile.photos.length; i++) {
        const photoUri = profile.photos[i];
        // 백엔드 URL인 경우 건너뛰기
        if (photoUri && (photoUri.startsWith('http') || photoUri.startsWith('/files/'))) {
          uploadedPhotos.push(photoUri);
          continue;
        }
        // 로컬 파일인 경우 백엔드에 업로드
        if (photoUri && photoUri.startsWith('file://')) {
          try {
            const base64 = await FileSystem.readAsStringAsync(photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const uploadResponse = await apiPost<{ imageUrl: string }>('/upload-image', {
              userId: profile.userId,
              imageData: `data:image/jpeg;base64,${base64}`,
              fileName: `photo_${i}.jpg`
            });
            if (uploadResponse && uploadResponse.imageUrl) {
              uploadedPhotos.push(uploadResponse.imageUrl);
            } else {
              console.error('이미지 업로드 실패:', uploadResponse);
              return false;
            }
          } catch (uploadError) {
            console.error(`이미지 ${i} 업로드 실패:`, uploadError);
            return false;
          }
        } else {
          continue;
        }
      }
    }
    // 업로드된 이미지 URL로 프로필 업데이트
    const profileWithUploadedPhotos = {
      ...profile,
      photos: uploadedPhotos
    };
    await apiPost('/profile', profileWithUploadedPhotos);
    return true;
  } catch (error) {
    console.error('프로필 저장 실패:', error);
    return false;
  }
} 