import { useState, useEffect } from 'react';
import { getUserProfile } from '../services/userService';
import { useAuth } from '../store/AuthContext';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        setUserProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
      } catch (err) {
        console.error('프로필 로드 실패:', err);
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  // 프로필 사진 가져오기
  const getProfilePhoto = () => {
    if (userProfile?.photos && userProfile.photos.length > 0) {
      return userProfile.photos[0]; // 첫 번째 사진을 대표 사진으로 사용
    }
    return null;
  };

  // 사용자 이름 가져오기
  const getUserDisplayName = () => {
    if (userProfile?.name) return userProfile.name;
    if (user?.name && user.name.trim()) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return '사용자';
  };

  // 사용자 이니셜 가져오기
  const getUserInitial = () => {
    const name = getUserDisplayName();
    if (name === '사용자') return '?';
    return name[0].toUpperCase();
  };

  return {
    userProfile,
    isLoading,
    error,
    getProfilePhoto,
    getUserDisplayName,
    getUserInitial,
  };
}; 