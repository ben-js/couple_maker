import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '../services/userService';
import { useAuth } from './AuthContext';
import { UserProfile } from '../types/profile';

interface UserProfileContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  getProfilePhoto: () => string | null;
  getUserDisplayName: () => string;
  getUserInitial: () => string;
  refreshProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.userId) {
        setUserProfile(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const profile = await getUserProfile(user.userId);
        setUserProfile(profile);
      } catch (err) {
        console.error('프로필 로드 실패:', err);
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.userId, refreshKey]);

  const refreshProfile = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getProfilePhoto = () => {
    if (userProfile?.photos && userProfile.photos.length > 0) {
      return userProfile.photos[0];
    }
    if (user?.photos && user.photos.length > 0) {
      return user.photos[0];
    }
    return null;
  };

  const getUserDisplayName = () => {
    if (userProfile?.name) return userProfile.name;
    if (user?.name && user.name.trim()) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return '사용자';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    if (name === '사용자') return '?';
    return name[0].toUpperCase();
  };

  const value: UserProfileContextType = {
    userProfile,
    isLoading,
    error,
    getProfilePhoto,
    getUserDisplayName,
    getUserInitial,
    refreshProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}; 