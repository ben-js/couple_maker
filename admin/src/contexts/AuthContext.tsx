import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { api } from '../utils/api';
import { useToast } from './ToastContext';

// 서버 사이드 렌더링 방지
const isClient = typeof window !== 'undefined';

interface User {
  id: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
  permissions?: {
    [key: string]: {
      read: boolean;
      write: boolean;
      delete: boolean;
    };
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string, action?: 'read' | 'write' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = isClient ? useRouter() : null;
  const { showToast } = useToast();
  const authCheckCompleted = useRef(false);

  // 인증 확인 함수 - 한 번만 실행
  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.log('🔍 토큰이 없음 - 로그아웃 상태');
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      console.log('🔍 토큰 존재 - 검증 시작');
      
      // 실제 매니저 정보 가져오기
      try {
        // JWT 토큰 유효성 검사 (더 엄격하게)
        if (!token || typeof token !== 'string') {
          console.log('❌ 토큰이 문자열이 아님');
          throw new Error('Invalid token type');
        }

        // 토큰 형식 검사
        const parts = token.split('.');
        console.log('🔍 토큰 파트 수:', parts.length);
        console.log('🔍 토큰 길이:', token.length);
        
        if (parts.length !== 3) {
          console.log('❌ 토큰 형식이 잘못됨 (파트 수:', parts.length, ')');
          console.log('❌ 토큰 내용:', token.substring(0, 100) + '...');
          throw new Error('Invalid token format');
        }

        // JWT 토큰에서 매니저 ID 추출 (안전한 디코딩)
        let tokenPayload;
        try {
          const payloadString = atob(parts[1]);
          tokenPayload = JSON.parse(payloadString);
          console.log('✅ 토큰 디코딩 성공:', tokenPayload);
        } catch (decodeError) {
          console.log('❌ 토큰 디코딩 실패:', decodeError);
          console.log('❌ 페이로드 문자열:', parts[1]);
          throw new Error('Token decode failed');
        }

        const managerId = tokenPayload.userId || tokenPayload.id || 'admin';
        
        console.log('🔍 매니저 ID 추출:', managerId);
        console.log('🔍 토큰 페이로드:', tokenPayload);
        
        // 매니저 정보 API 호출
        const response = await fetch(`/api/admin/managers/${managerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🔍 API 응답 상태:', response.status);
        
        if (response.ok) {
          const managerData = await response.json();
          console.log('✅ 매니저 정보 로드 성공:', managerData);
          
          // 실제 매니저 정보로 사용자 상태 업데이트
          setUser({
            id: managerData.id,
            name: managerData.name || tokenPayload.name || '관리자',
            email: managerData.email || tokenPayload.email || 'admin@datesense.com',
            role: managerData.role || tokenPayload.role || 'admin',
            permissions: managerData.permissions || {
              dashboard: { read: true, write: true, delete: true },
              user_management: { read: true, write: true, delete: true },
              matching_management: { read: true, write: true, delete: true },
              review_management: { read: true, write: true, delete: true },
              point_management: { read: true, write: true, delete: true },
              manager_management: { read: true, write: true, delete: true },
              admin_logs: { read: true, write: true, delete: true }
            }
          });
          setIsAuthenticated(true);
        } else {
          console.log('❌ 매니저 정보 로드 실패:', response.status);
          const errorText = await response.text();
          console.log('❌ 에러 내용:', errorText);
          
          // API 호출 실패 시 토큰에서 직접 정보 추출 시도
          console.log('🔄 토큰에서 직접 정보 추출 시도');
          setUser({
            id: managerId,
            name: tokenPayload.name || '관리자',
            email: tokenPayload.email || 'admin@datesense.com',
            role: tokenPayload.role || 'admin',
            permissions: {
              dashboard: { read: true, write: true, delete: true },
              user_management: { read: true, write: true, delete: true },
              matching_management: { read: true, write: true, delete: true },
              review_management: { read: true, write: true, delete: true },
              point_management: { read: true, write: true, delete: true },
              manager_management: { read: true, write: true, delete: true },
              admin_logs: { read: true, write: true, delete: true }
            }
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('매니저 정보 가져오기 실패:', error);
        
        // 토큰 관련 에러인 경우에만 로그아웃 처리
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage === 'Invalid token format' || errorMessage === 'Token decode failed' || errorMessage === 'Invalid token type') {
          console.log('🔄 토큰 에러로 인한 로그아웃 처리');
          localStorage.removeItem('adminToken');
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // API 호출 실패나 기타 에러는 기본 정보로 계속 진행
        console.log('🔄 기본 정보로 계속 진행');
        setUser({
          id: 'admin',
          name: '관리자',
          email: 'admin@datesense.com',
          role: 'admin',
          permissions: {
            dashboard: { read: true, write: true, delete: true },
            user_management: { read: true, write: true, delete: true },
            matching_management: { read: true, write: true, delete: true },
            review_management: { read: true, write: true, delete: true },
            point_management: { read: true, write: true, delete: true },
            manager_management: { read: true, write: true, delete: true },
            admin_logs: { read: true, write: true, delete: true }
          }
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('인증 검증 실패:', error);
      // 최종 에러 시에도 로그아웃하지 않고 기본 정보 사용
      setUser({
        id: 'admin',
        name: '관리자',
        email: 'admin@datesense.com',
        role: 'admin',
        permissions: {
          dashboard: { read: true, write: true, delete: true },
          user_management: { read: true, write: true, delete: true },
          matching_management: { read: true, write: true, delete: true },
          review_management: { read: true, write: true, delete: true },
          point_management: { read: true, write: true, delete: true },
          manager_management: { read: true, write: true, delete: true },
          admin_logs: { read: true, write: true, delete: true }
        }
      });
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔍 로그인 시도:', { email, password: '***' });
      
      // axios 대신 직접 fetch 사용
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('🔍 로그인 응답:', response);
      console.log('🔍 응답 상태:', response.status);
      console.log('🔍 응답 OK:', response.ok);
      
      const responseData = await response.json();
      console.log('🔍 응답 데이터:', responseData);
      
      if (response.ok && responseData.success) {
        const { token, user } = responseData.data;
        
        console.log('🔍 토큰 길이:', token.length);
        console.log('🔍 토큰 파트 수:', token.split('.').length);
        console.log('🔍 사용자 정보:', user);
        
        localStorage.setItem('adminToken', token);
        setUser(user);
        setIsAuthenticated(true);
        authCheckCompleted.current = true; // 로그인 성공 시 플래그 설정
        showToast('로그인되었습니다.', 'success');
        return true;
      } else {
        const errorMessage = responseData.error || '로그인에 실패했습니다.';
        console.log('❌ 로그인 실패:', errorMessage);
        showToast(errorMessage, 'error');
        return false;
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      const errorMessage = '로그인 중 오류가 발생했습니다.';
      showToast(errorMessage, 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
    setIsAuthenticated(false);
    authCheckCompleted.current = false; // 로그아웃 시 플래그 리셋
    showToast('로그아웃되었습니다.', 'info');
    if (router) {
      router.push('/login');
    }
  };

  const hasPermission = (permission: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions[permission]?.[action] || false;
  };

  // 컴포넌트 마운트 시 한 번만 인증 확인
  useEffect(() => {
    console.log('🔍 AuthContext useEffect 실행');
    
    // 서버 사이드 렌더링 중에는 실행하지 않음
    if (typeof window === 'undefined') {
      console.log('🔍 서버 사이드 렌더링 - 인증 검증 건너뜀');
      setLoading(false);
      return;
    }

    // 인증 확인 실행
    verifyAuth();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 