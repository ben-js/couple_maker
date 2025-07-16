import { UserProfile } from '../types/profile';
import { apiGet, apiPost } from '../utils/apiUtils';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

// 회원가입 (단일 책임)
export async function signup(userData: { email: string; password: string; name: string }): Promise<UserProfile | null> {
  try {
    const data = await apiPost<UserProfile>('/signup', userData);
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
export async function login(credentials: { email: string; password: string }): Promise<UserProfile | null> {
  try {
    const data = await apiPost<UserProfile>('/login', credentials);
    const dataAny = data as any;
    if (data && !dataAny.id && (data.userId || dataAny.user_id)) {
      dataAny.id = data.userId || dataAny.user_id;
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
    console.log('프로필 조회 시작:', { userId });
    const data = await apiGet<UserProfile>(`/profile/${userId}`);
    console.log('프로필 조회 결과:', { 
      hasData: !!data, 
      photos: data?.photos, 
      photosLength: data?.photos?.length 
    });
    
    const dataAny = data as any;
    if (data && !dataAny.id && (data.userId || dataAny.user_id)) {
      dataAny.id = data.userId || dataAny.user_id;
    }
    return data;
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
export async function saveProfile(profile: UserProfile): Promise<boolean> {
  try {
    // 로컬 파일을 S3에 업로드하고 S3 URL로 변환
    const uploadedPhotos = [];
    if (profile.photos && profile.photos.length > 0) {
      // null이 아닌 사진만 필터링하여 업로드
      const validPhotos = profile.photos.filter(photo => photo && photo.trim() !== '');
      
      console.log('프로필 저장 - 사진 업로드 시작:', {
        totalPhotos: profile.photos.length,
        validPhotos: validPhotos.length,
        photoUris: validPhotos
      });
      
      for (const photoUri of validPhotos) {
        if (photoUri.startsWith('https://') && photoUri.includes('s3.amazonaws.com')) {
          // 이미 S3 URL인 경우 그대로 사용
          uploadedPhotos.push(photoUri);
        } else if (photoUri.startsWith('file://')) {
          // 로컬 파일인 경우 S3에 업로드
          console.log(`로컬 파일을 S3에 업로드 중: ${photoUri}`);
          const userIdToUse = (profile as any).id || profile.userId;
          const s3Url = await uploadToS3(photoUri, userIdToUse);
          uploadedPhotos.push(s3Url);
          console.log(`S3 업로드 완료: ${s3Url}`);
        } else {
          console.warn(`지원하지 않는 URL 형식입니다: ${photoUri}`);
          continue;
        }
      }
    }
    
    // 백엔드에서 user_id를 기대하므로 필드명 변환
    const { userId, ...profileData } = profile;
    const profileAny = profile as any;
    const userIdToSend = profileAny.id || userId || profileAny.user_id;
    
    // 업로드된 S3 URL로 프로필 업데이트
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