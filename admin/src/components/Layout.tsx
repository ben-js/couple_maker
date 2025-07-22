import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  HomeIcon, 
  UsersIcon, 
  HeartIcon, 
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  ArrowLeftIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // 전역 상태에서 사이드바 상태 가져오기
    if (typeof window !== 'undefined') {
      const globalState = (window as any).__SIDEBAR_STATE__;
      if (globalState !== undefined) {
        return globalState;
      }
    }
    return false;
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { user, loading, isAuthenticated, logout, hasPermission } = useAuth();
  const { showToast } = useToast();

  // 전역 상태에 사이드바 상태 저장
  const updateSidebarState = (newState: boolean) => {
    setIsSidebarOpen(newState);
    if (typeof window !== 'undefined') {
      (window as any).__SIDEBAR_STATE__ = newState;
      localStorage.setItem('sidebarOpen', newState.toString());
    }
  };

  // 초기화 useEffect (한 번만 실행)
  useEffect(() => {
    // 이미 초기화되었다면 건너뛰기
    if (isInitialized) {
      return;
    }

    // 다크모드 설정
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    
    // 사이드바 상태 복원 (전역 상태 우선)
    if (typeof window !== 'undefined') {
      const globalState = (window as any).__SIDEBAR_STATE__;
      if (globalState !== undefined) {
        setIsSidebarOpen(globalState);
        console.log('🔧 전역 상태에서 사이드바 복원:', globalState);
      } else {
        const savedSidebarState = localStorage.getItem('sidebarOpen');
        if (savedSidebarState !== null) {
          const state = savedSidebarState === 'true';
          setIsSidebarOpen(state);
          (window as any).__SIDEBAR_STATE__ = state;
          console.log('🔧 localStorage에서 사이드바 복원:', savedSidebarState);
        } else {
          // 저장된 값이 없으면 기본적으로 숨김
          setIsSidebarOpen(false);
          (window as any).__SIDEBAR_STATE__ = false;
          localStorage.setItem('sidebarOpen', 'false');
          console.log('🔧 사이드바 기본 상태 설정: false');
        }
      }
    }
    
    // 초기화 완료
    setIsInitialized(true);
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 페이지 이동 시 모바일에서만 사이드바 닫기
  useEffect(() => {
    if (isInitialized) {
      // 모바일에서만 페이지 이동 시 사이드바 닫기
      const isMobile = window.innerWidth < 1024; // lg 브레이크포인트
      if (isMobile) {
        updateSidebarState(false);
        console.log('🔧 모바일 페이지 이동: 사이드바 닫기');
      } else {
        console.log('🔧 데스크톱 페이지 이동: 사이드바 유지');
      }
    }
  }, [router.pathname, isInitialized]); // router.pathname 변경 시 실행

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    updateSidebarState(newState);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    // 로그아웃 시 사이드바 상태 초기화
    localStorage.removeItem('sidebarOpen');
    if (typeof window !== 'undefined') {
      delete (window as any).__SIDEBAR_STATE__;
    }
    console.log('🔧 로그아웃: 사이드바 상태 초기화');
    logout();
  };

  const handlePasswordChange = () => {
    console.log('🔧 비밀번호 변경 버튼 클릭됨');
    router.push('/change-password');
  };

  const startEditingName = () => {
    setEditingName(user?.name || user?.username || '');
    setIsEditingName(true);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const saveName = async () => {
    if (!editingName.trim()) {
      showToast('이름을 입력해주세요.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/managers/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingName.trim() })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // 사용자 정보 업데이트 (AuthContext에서 처리해야 함)
        showToast('이름이 성공적으로 변경되었습니다.');
        setIsEditingName(false);
        setEditingName('');
        // 페이지 새로고침으로 사용자 정보 업데이트
        window.location.reload();
      } else {
        const errorData = await response.json();
        showToast(`이름 변경에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('Name change error:', error);
      showToast('이름 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const menuItems: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission: string;
  }> = [
    {
      name: '대시보드',
      href: '/dashboard',
      icon: HomeIcon,
      permission: 'dashboard'
    },
    {
      name: '사용자 관리',
      href: '/user-management',
      icon: UsersIcon,
      permission: 'user_management'
    },
    {
      name: '매칭 관리',
      href: '/matching-management',
      icon: HeartIcon,
      permission: 'matching_management'
    },
    {
      name: '포인트 관리',
      href: '/point-management',
      icon: ChatBubbleLeftRightIcon,
      permission: 'point_management'
    },
    {
      name: '매니저 관리',
      href: '/manager-management',
      icon: UserGroupIcon,
      permission: 'manager_management'
    },
    {
      name: '매니저 로그',
      href: '/manager-logs',
      icon: ChatBubbleLeftRightIcon,
      permission: 'admin_logs'
    }
  ];

  // 권한이 있는 메뉴만 필터링 (개발 중에는 모든 메뉴 표시)
  const filteredMenuItems = menuItems.filter(item => 
    process.env.NODE_ENV === 'development' || hasPermission(item.permission)
  );

  // 로그인 페이지이면 Layout 없이 렌더링
  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  // 로딩 중이면 로딩 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않았으면 로그인 페이지로 리다이렉트
  if (!isAuthenticated && typeof window !== 'undefined') {
    router.push('/login');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-[999999] w-64 bg-white dark:bg-gray-800 shadow-lg transform
        ${isInitialized ? 'transition-transform duration-300 ease-in-out' : 'transition-none'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarOpen ? 'lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0' : 'lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0 lg:w-0 lg:overflow-hidden lg:opacity-0'}
        ${!isInitialized ? 'lg:opacity-0 lg:pointer-events-none' : ''}
      `}>
        <div className="flex flex-col h-full">
          {/* 사이드바 헤더 */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Date Sense Admin
            </h1>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="사이드바 닫기"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 mt-5 px-2">
            <div className="space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                // 상세 페이지에서도 해당 관리 메뉴가 활성화되도록 수정
                const isActive = router.pathname === item.href || 
                               (item.href === '/user-management' && router.pathname.startsWith('/user-detail')) ||
                               (item.href === '/matching-management' && router.pathname.startsWith('/match-detail')) ||
                               (item.href === '/point-management' && router.pathname.startsWith('/point-detail')) ||
                               (item.href === '/manager-management' && router.pathname.startsWith('/manager-permissions'));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* 하단 설정 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="다크모드 토글"
              >
                {darkMode ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
              </button>
              
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="로그아웃"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[999998] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 mr-4"
                title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 보이기"}
              >
                {isSidebarOpen ? (
                  <ArrowLeftIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {menuItems.find(item => item.href === router.pathname)?.name || '관리자'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 사용자 프로필 정보 */}
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden md:block">
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveName();
                          } else if (e.key === 'Escape') {
                            cancelEditingName();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveName}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="저장"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEditingName}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="취소"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name || user?.username || '관리자'}
                      </p>
                      <button
                        onClick={startEditingName}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="이름 편집"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || 'admin@datesense.app'}
                  </p>
                </div>
              </div>
              
              {/* 비밀번호 변경 버튼 */}
              <button
                onClick={handlePasswordChange}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-700"
                title="비밀번호 변경"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                <span className="hidden sm:inline">비밀번호 변경</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 