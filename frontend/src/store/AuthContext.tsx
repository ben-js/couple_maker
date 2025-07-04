import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User } from '@/types';
import { saveUser, getUser, deleteUser } from '../db/user';

// 액션 타입 정의
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'INIT_USER'; payload: User | null };

// 초기 상태
const initialState: AuthState = {
  user: null,
  isLoading: true, // 앱 시작 시 로딩 상태
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
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'INIT_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
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
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 프로바이더 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 앱 시작 시 저장된 user 정보 로드
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await getUser();
        dispatch({ type: 'INIT_USER', payload: storedUser });
        console.log('Stored user loaded:', storedUser?.id || 'none');
      } catch (error) {
        console.error('Failed to load stored user:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadStoredUser();
  }, []);

  // 사용자 정보 설정 (로그인 시)
  const setUser = async (user: User | null) => {
    if (user) {
      try {
        await saveUser(user);
        dispatch({ type: 'SET_USER', payload: user });
        console.log('User set and saved:', user.id);
      } catch (error) {
        console.error('Failed to save user:', error);
        dispatch({ type: 'SET_USER', payload: user }); // Context는 업데이트하되 저장 실패 로그
      }
    } else {
      dispatch({ type: 'SET_USER', payload: null });
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await deleteUser();
      dispatch({ type: 'LOGOUT' });
      console.log('User logged out and deleted from storage');
    } catch (error) {
      console.error('Failed to delete user from storage:', error);
      dispatch({ type: 'LOGOUT' }); // Context는 로그아웃하되 삭제 실패 로그
    }
  };

  // 사용자 정보 업데이트
  const updateUser = async (userData: Partial<User>) => {
    if (state.user) {
      try {
        const updatedUser = { ...state.user, ...userData };
        await saveUser(updatedUser);
        dispatch({ type: 'UPDATE_USER', payload: userData });
        console.log('User updated and saved:', updatedUser.id);
      } catch (error) {
        console.error('Failed to update user:', error);
        dispatch({ type: 'UPDATE_USER', payload: userData }); // Context는 업데이트하되 저장 실패 로그
      }
    }
  };

  // 로딩 상태 설정
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const value: AuthContextType = {
    ...state,
    logout,
    updateUser,
    setUser,
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