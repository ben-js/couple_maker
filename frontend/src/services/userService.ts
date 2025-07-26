import { Profile } from '../types/profile';
import { apiGet, apiPost, apiGetWithAuth } from '../utils/apiUtils';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

// 회원가입 (단일 책임)
export async function signup(userData: { email: string; password: string; name: string }): Promise<Profile | null> {
  try {
    const data = await apiPost<Profile>('/signup', userData);
    const dataAny = data as any;
    if (data && !dataAny.id && (data.userId || dataAny.user_id)) {
      dataAny.id = data.userId || dataAny.user_id;
    }
    return data;
  } catch (error) {
    console.error('회원가입 실패:', error);
    return null;
  }
}

// 이메일 인증 확인
export async function confirmSignup(userData: { email: string; confirmationCode: string }): Promise<boolean> {
  try {
    const data = await apiPost('/confirm-signup', userData);
    return data?.success || false;
  } catch (error) {
    console.error('이메일 인증 실패:', error);
    return false;
  }
}

// 인증 코드 재발송
export async function resendConfirmationCode(email: string): Promise<boolean> {
  try {
    const data = await apiPost('/resend-confirmation-code', { email });
    return data?.success || false;
  } catch (error) {
    console.error('인증 코드 재발송 실패:', error);
    return false;
  }
}

// 로그인 (단일 책임)
export async function login(credentials: { email: string; password: string }): Promise<Profile | null> {
  try {
    console.log('로그인 시도:', { email: credentials.email, password: '***' });
    
    const response = await apiPost<any>('/login', credentials);
    console.log('로그인 응답 받음:', { 
      hasResponse: !!response, 
      success: response?.success, 
      hasUser: !!response?.user,
      userFields: response?.user ? Object.keys(response.user) : []
    });
    
    // 백엔드 응답 구조: { success: true, message: string, user: Profile, matchingStatus?: any }
    if (response && response.success && response.user) {
      const user = response.user;
      const userAny = user as any;
      
      // userId 필드 정규화
      if (user && !userAny.id && (user.userId || userAny.user_id)) {
        userAny.id = user.userId || userAny.user_id;
      }
      
      console.log('로그인 성공 - 사용자 정보:', { 
        id: userAny.id, 
        userId: user.userId,
        email: user.email,
        hasProfile: user.hasProfile,
        hasPreferences: user.hasPreferences,
        isVerified: user.isVerified
      });
      
      // 매칭 상태 정보가 있으면 로그
      if (response.matchingStatus) {
        console.log('로그인 성공 - 매칭 상태:', response.matchingStatus);
      }
      
      // userId가 확실히 있는지 확인
      if (!user.userId && !userAny.id) {
        console.error('로그인 응답에 userId가 없습니다:', user);
        throw new Error('사용자 ID가 없습니다.');
      }
      
      return user; // 반드시 user만 반환
    }
    
    console.log('로그인 실패 - 응답에 user 정보 없음:', response);
    return null;
  } catch (error) {
    console.error('로그인 실패:', error);
    return null;
  }
}

// 프로필 조회 (단일 책임)
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    console.log('프로필 조회 시작:', { userId });
    const data = await apiGetWithAuth<any>(`/profile/${userId}`, userId);
    // 백엔드에서 { profile: ... } 구조로 올 수 있으므로 profile을 꺼냄
    const profile = data?.profile ? data.profile : data;
    // photos가 string 배열이 아닐 경우 변환
    if (profile && profile.photos && Array.isArray(profile.photos)) {
      profile.photos = profile.photos.map((p: any) =>
        typeof p === 'string' ? p : (p && p.S ? p.S : null)
      ).filter(Boolean);
    }
    const dataAny = profile as any;
    if (profile && !dataAny.id && (profile.userId || dataAny.user_id)) {
      dataAny.id = profile.userId || dataAny.user_id;
    }
    return profile;
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    return null;
  }
}

// S3 업로드 헬퍼 함수
async function uploadToS3(fileUri: string, userId: string): Promise<string> {
  try {
    console.log('S3 업로드 시작:', { fileUri, userId });
    
    if (!userId) {
      throw new Error('userId is required for S3 upload');
    }
    
    // 파일명 추출 (없으면 uuid로 생성)
    let fileName = fileUri.split('/').pop() || `profile-${uuidv4()}.jpg`;
    // 1. 백엔드에서 presigned URL 받기
    const uploadData = await apiPost('/get-upload-url', { userId, fileName }, userId);
    const { uploadUrl, fileKey, s3Url } = uploadData;
    
    // 2. 파일을 Blob으로 읽기
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();
    
    // 3. S3에 업로드
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
    
    if (!response.ok) {
      throw new Error(`S3 업로드 실패: ${response.status}`);
    }
    
    // 4. S3 URL 반환 (API에서 s3Url 제공 시 사용)
    return s3Url || `https://date-sense.s3.ap-northeast-2.amazonaws.com/${fileKey}`;
  } catch (error) {
    console.error('S3 업로드 실패:', error);
    throw error;
  }
}

// 프로필 저장 (단일 책임)
export async function saveProfile(profile: Profile): Promise<boolean> {
  try {
    // 로컬 파일을 S3에 업로드하고 S3 URL로 변환
    const uploadedPhotos = [];
    if (profile.photos && profile.photos.length > 0) {
      const validPhotos = profile.photos.filter(photo => typeof photo === 'string' && photo.trim() !== '');
      for (const photoUriRaw of validPhotos) {
        let photoUri = photoUriRaw;
        if (typeof photoUri !== 'string' && photoUri && typeof photoUri === 'object' && (photoUri as any).S) {
          photoUri = (photoUri as any).S;
        }
        if (typeof photoUri === 'string') {
          photoUri = photoUri.trim();
        }
        // S3 URL이면 무조건 추가
        if (typeof photoUri === 'string' && photoUri.startsWith('https://date-sense.s3.ap-northeast-2.amazonaws.com/')) {
          uploadedPhotos.push(photoUri);
        } else if (typeof photoUri === 'string' && photoUri.startsWith('file://')) {
          const userIdToUse = (profile as any).id || profile.userId;
          const s3Url = await uploadToS3(photoUri, userIdToUse);
          uploadedPhotos.push(s3Url);
        } else {
          continue;
        }
      }
    }
    // 업로드된 S3 URL로 프로필 업데이트
    console.log('API POST photos:', uploadedPhotos);
    const { userId, ...profileData } = profile;
    const profileAny = profile as any;
    const userIdToSend = profileAny.id || userId || profileAny.user_id;
    const profileWithUploadedPhotos = {
      user_id: userIdToSend,
      ...profileData,
      photos: uploadedPhotos
    };
    
    await apiPost('/profile', profileWithUploadedPhotos);
    return true;
  } catch (error) {
    console.error('프로필 저장 실패:', error);
    return false;
  }
} 