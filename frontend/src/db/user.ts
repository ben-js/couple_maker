import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const USER_STORAGE_KEY = 'user_data';

// User 정보 저장
export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    throw error;
  }
};

// User 정보 조회
export const getUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (userData) {
      const user: User = JSON.parse(userData);
      return user;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// User 정보 업데이트
export const updateUser = async (userData: Partial<User>): Promise<void> => {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      throw new Error('No user found');
    }
    
    const updatedUser = { ...currentUser, ...userData };
    await saveUser(updatedUser);
  } catch (error) {
    throw error;
  }
};

// User 정보 삭제 (로그아웃)
export const deleteUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    throw error;
  }
};

// 앱 시작 시 초기화 (AsyncStorage는 별도 초기화 불필요)
export const initDatabase = async (): Promise<void> => {
}; 