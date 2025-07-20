import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProfile } from '../services/userService';
import { useAuth } from './AuthContext';
import { Profile } from '../types/profile';

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  getProfilePhoto: () => string | null;
  getUserDisplayName: () => string;
  getUserInitial: () => string;
  refreshProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.userId) {
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('ProfileContext - 프로필 로드 시작:', { userId: user.userId });
        const profile = await getProfile(user.userId);
        setProfile(profile);
        console.log('ProfileContext - 프로필 로드 완료:', profile);
      } catch (err) {
        console.error('프로필 로드 실패:', err);
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user?.userId]);

  const refreshProfile = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
              console.log('ProfileContext - 프로필 수동 새로고침 시작:', { userId: user.userId });
        const profile = await getProfile(user.userId);
        setProfile(profile);
        console.log('ProfileContext - 프로필 수동 새로고침 완료');
    } catch (err) {
      console.error('프로필 새로고침 실패:', err);
      setError('프로필을 새로고침하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfilePhoto = () => {
    if (profile?.photos && profile.photos.length > 0) {
      return profile.photos[0];
    }
    if (user?.photos && user.photos.length > 0) {
      return user.photos[0];
    }
    return null;
  };

  const getUserDisplayName = () => {
    if (profile?.name) return profile.name;
    if (user?.name && user.name.trim()) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return '사용자';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    if (name === '사용자') return '?';
    return name[0].toUpperCase();
  };

  const value: ProfileContextType = {
    profile,
    isLoading,
    error,
    getProfilePhoto,
    getUserDisplayName,
    getUserInitial,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 