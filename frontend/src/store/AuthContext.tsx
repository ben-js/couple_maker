import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '@/types';

// 액션 타입 정의
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

// 초기 상태
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// 리듀서
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
};

// 컨텍스트 생성
interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 프로바이더 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 토큰 저장
  const saveToken = async (token: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  };

  // 토큰 불러오기
  const loadToken = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        dispatch({ type: 'SET_TOKEN', payload: token });
        // TODO: 토큰 검증 API 호출
        // const user = await validateToken(token);
        // dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      console.error('토큰 불러오기 실패:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 사용자 정보 저장
  const saveUser = async (user: User) => {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
    }
  };

  // 사용자 정보 불러오기
  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      console.error('사용자 정보 불러오기 실패:', error);
    }
  };

  // 로그인
  const login = async (user: User, token: string) => {
    await saveToken(token);
    await saveUser(user);
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_TOKEN', payload: token });
  };

  // 로그아웃
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
    dispatch({ type: 'LOGOUT' });
  };

  // 사용자 정보 업데이트
  const updateUser = async (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      await saveUser(updatedUser);
      dispatch({ type: 'UPDATE_USER', payload: userData });
    }
  };

  // 로딩 상태 설정
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  // 앱 시작 시 토큰과 사용자 정보 불러오기
  useEffect(() => {
    const initializeAuth = async () => {
      await loadToken();
      await loadUser();
    };
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    setLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 