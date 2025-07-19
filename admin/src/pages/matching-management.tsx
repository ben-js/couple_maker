import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';
import Toast from '../components/Toast';

interface Match {
  id: string;
  user1_email: string;
  user2_email: string;
  status: string;
  created_at?: string;
  createdAt?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function MatchingManagement() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkAuth = async () => {
    // 개발 중에는 토큰 검증을 우회
    console.log('개발 중 토큰 검증 우회');
    return;
  };

  const loadMatches = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/match-pairs', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      } else {
        showToast('매칭 데이터를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      if (isRefresh) {
        showToast('데이터 새로고침 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  // 필터링된 매칭 목록
  const filteredMatches = matches.filter(match => {
    return statusFilter === 'all' || match.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-800 bg-yellow-100 border border-yellow-200';
      case 'accepted': return 'text-green-800 bg-green-100 border border-green-200';
      case 'rejected': return 'text-red-800 bg-red-100 border border-red-200';
      case 'completed': return 'text-blue-800 bg-blue-100 border border-blue-200';
      default: return 'text-gray-800 bg-gray-100 border border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      case 'completed': return '완료됨';
      default: return status;
    }
  };

  useEffect(() => {
    checkAuth();
    loadMatches();
  }, []);

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
            <h1 className="text-2xl font-bold text-gray-900">매칭 관리</h1>
            <p className="text-gray-600">매칭 상태를 관리하고 모니터링할 수 있습니다.</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="상태 필터"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: '전체' },
                  { value: 'pending', label: '대기중' },
                  { value: 'accepted', label: '수락됨' },
                  { value: 'rejected', label: '거절됨' },
                  { value: 'completed', label: '완료됨' }
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={() => loadMatches(true)}
                  disabled={refreshing}
                  className={`w-full font-medium py-2 px-4 rounded-md transition-colors ${
                    refreshing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {refreshing ? '새로고침 중...' : '새로고침'}
                </button>
              </div>
            </div>
          </div>

          {/* Matches Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                매칭 목록 ({filteredMatches.length}건)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매칭 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매칭일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMatches.map((match) => (
                    <tr key={match.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-300 flex items-center justify-center">
                              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {match.user1_email} ↔ {match.user2_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                          {getStatusText(match.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(match.created_at || match.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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