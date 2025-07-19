import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';

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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [actionFilter, setActionFilter] = useState('all');
  const router = useRouter();

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

  const loadLogs = async () => {
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
      } else {
        console.error('매니저 로그 로드 실패:', response.status, response.statusText);
        // API 호출 실패 시에도 페이지에 머무름
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      // 에러 발생 시에도 페이지에 머무름
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 로그 목록
  const filteredLogs = logs.filter(log => {
    return actionFilter === 'all' || log.action === actionFilter;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'logout': return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'create': return 'text-green-700 bg-green-50 border-green-200';
      case 'update': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'delete': return 'text-red-700 bg-red-50 border-red-200';
      case 'password_change': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'change_password': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'status_change': return 'text-pink-700 bg-pink-50 border-pink-200';
      case 'user_status_change': return 'text-pink-700 bg-pink-50 border-pink-200';
      case 'grade_change': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'user_grade_change': return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'matching_approve': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'matching_reject': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'review_delete': return 'text-red-700 bg-red-50 border-red-200';
      case 'point_adjust': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'user_delete': return 'text-red-700 bg-red-50 border-red-200';
      case 'manager_delete': return 'text-red-700 bg-red-50 border-red-200';
      case 'permission_change': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'test_action': return 'text-violet-700 bg-violet-50 border-violet-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
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
      case 'matching_reject': return '매칭 거부';
      case 'review_delete': return '리뷰 삭제';
      case 'point_adjust': return '포인트 조정';
      case 'user_delete': return '사용자 삭제';
      case 'manager_delete': return '매니저 삭제';
      case 'permission_change': return '권한 변경';
      case 'test_action': return '테스트 액션';
      default: return action;
    }
  };

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
                  { value: 'matching_reject', label: '매칭 거부' },
                  { value: 'point_adjust', label: '포인트 조정' },
                  { value: 'review_delete', label: '리뷰 삭제' },
                  { value: 'user_delete', label: '사용자 삭제' },
                  { value: 'manager_delete', label: '매니저 삭제' },
                  { value: 'permission_change', label: '권한 변경' },
                  { value: 'test_action', label: '테스트 액션' }
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={loadLogs}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                매니저 로그 ({filteredLogs.length}건)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매니저
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상세 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP 주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-300 flex items-center justify-center">
                              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {log.manager_email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.manager_role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border ${getActionColor(log.action)}`}>
                          <div className="w-2 h-2 rounded-full mr-2 bg-current opacity-75"></div>
                          {getActionText(log.action)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {log.details || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 