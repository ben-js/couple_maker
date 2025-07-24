import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Toast from '../components/Toast';

interface ManagerLog {
  id: string;
  manager_email: string;
  manager_role: string;
  action: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

interface CurrentUser {
  id: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
}

export default function ManagerLogs() {
  const [logs, setLogs] = useState<ManagerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    console.log('매니저 로그 페이지 로드 시작');
    checkAuth();
    loadLogs();
  }, []);

  console.log('매니저 로그 페이지 렌더링, loading:', loading, 'logs length:', logs.length);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // 개발 환경에서는 토큰 검증 완화
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        } else {
          localStorage.removeItem('adminToken');
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      router.push('/login');
    }
  };

  const loadLogs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/manager-logs', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('매니저 로그 로드 성공:', data.length, '건');
        setLogs(data);
        if (isRefresh) {
          showToast('데이터가 새로고침되었습니다.');
        }
      } else {
        console.error('매니저 로그 로드 실패:', response.status, response.statusText);
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // 필터링된 로그 목록
  const filteredLogs = logs.filter(log => {
    return actionFilter === 'all' || log.action === actionFilter;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'text-blue-600 bg-blue-100';
      case 'logout': return 'text-gray-600 bg-gray-100';
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-yellow-600 bg-yellow-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'password_change': return 'text-purple-600 bg-purple-100';
      case 'change_password': return 'text-purple-600 bg-purple-100';
      case 'status_change': return 'text-pink-600 bg-pink-100';
      case 'user_status_change': return 'text-pink-600 bg-pink-100';
      case 'grade_change': return 'text-cyan-600 bg-cyan-100';
      case 'user_grade_change': return 'text-cyan-600 bg-cyan-100';
      case 'matching_approve': return 'text-emerald-600 bg-emerald-100';
      case 'matching_refuse': return 'text-rose-600 bg-rose-100';
      case 'review_delete': return 'text-red-600 bg-red-100';
      case 'point_adjust': return 'text-amber-600 bg-amber-100';
      case 'user_delete': return 'text-red-600 bg-red-100';
      case 'manager_delete': return 'text-red-600 bg-red-100';
      case 'permission_change': return 'text-indigo-600 bg-indigo-100';
      case 'test_action': return 'text-violet-600 bg-violet-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'login': return '로그인';
      case 'logout': return '로그아웃';
      case 'create': return '생성';
      case 'update': return '수정';
      case 'delete': return '삭제';
      case 'password_change': return '비밀번호 변경';
      case 'change_password': return '비밀번호 변경';
      case 'status_change': return '상태 변경';
      case 'user_status_change': return '상태 변경';
      case 'grade_change': return '등급 변경';
      case 'user_grade_change': return '등급 변경';
      case 'matching_approve': return '매칭 승인';
      case 'matching_refuse': return '매칭 거부';
      case 'review_delete': return '리뷰 삭제';
      case 'point_adjust': return '포인트 조정';
      case 'user_delete': return '사용자 삭제';
      case 'manager_delete': return '매니저 삭제';
      case 'permission_change': return '권한 변경';
      case 'test_action': return '테스트 액션';
      default: return action;
    }
  };

  const columns = [
    { 
      key: 'manager_email', 
      header: '사용자', 
      width: 'w-56',
      render: (value: string, log: ManagerLog) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {value}
            </div>
            <div className="text-xs text-gray-500">
              {log.manager_role}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      header: '작업 유형',
      width: 'w-28',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(value)}`}>
          {getActionText(value)}
        </span>
      )
    },
    {
      key: 'details',
      header: '작업 설명',
      width: 'w-96',
      render: (value: string) => (
        <div className="text-sm text-gray-900">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: () => (
        <span className="text-sm text-gray-500">
          알 수 없음
        </span>
      )
    },
    {
      key: 'created_at',
      header: '타임스탬프',
      width: 'w-48',
      render: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleString('ko-KR');
        } catch (error) {
          return '-';
        }
      }
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">매니저 로그</h1>
            <p className="text-gray-600">매니저 활동 내역을 확인할 수 있습니다.</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="액션 필터"
                value={actionFilter}
                onChange={setActionFilter}
                options={[
                  { value: 'all', label: '전체' },
                  { value: 'login', label: '로그인' },
                  { value: 'logout', label: '로그아웃' },
                  { value: 'password_change', label: '비밀번호 변경' },
                  { value: 'change_password', label: '비밀번호 변경' },
                  { value: 'status_change', label: '상태 변경' },
                  { value: 'user_status_change', label: '상태 변경' },
                  { value: 'grade_change', label: '등급 변경' },
                  { value: 'user_grade_change', label: '등급 변경' },
                  { value: 'matching_approve', label: '매칭 승인' },
                  { value: 'matching_refuse', label: '매칭 거부' },
                  { value: 'point_adjust', label: '포인트 조정' },
                  { value: 'review_delete', label: '리뷰 삭제' },
                  { value: 'user_delete', label: '사용자 삭제' },
                  { value: 'manager_delete', label: '매니저 삭제' },
                  { value: 'permission_change', label: '권한 변경' },
                  { value: 'test_action', label: '테스트 액션' }
                ]}
              />
              <div className="flex items-end">
                <Button
                  onClick={() => loadLogs(true)}
                  disabled={refreshing}
                  variant={undefined}
                  className="h-11 px-4 text-base bg-white text-black border border-gray-300 rounded-md font-bold hover:bg-gray-50 transition-colors w-full"
                >
                  {refreshing ? '검색 중...' : '검색'}
                </Button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <Table
            title="매니저 활동 로그"
            data={filteredLogs}
            columns={columns}
            loading={loading}
            emptyMessage="로그가 없습니다."
            maxHeight="max-h-[600px]"
          />
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
} 