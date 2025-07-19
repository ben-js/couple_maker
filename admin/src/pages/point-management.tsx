import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';
import Toast from '../components/Toast';

interface PointRecord {
  id: string;
  user_id: string;
  user_email: string;
  points: number;
  type: string;
  reason?: string;
  balance_after: number;
  createdAt: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function PointManagement() {
  const router = useRouter();
  const [pointHistory, setPointHistory] = useState<PointRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // 개발 환경에서는 토큰 검증 완화
    if (process.env.NODE_ENV === 'production') {
      try {
        const response = await fetch('/api/admin/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          localStorage.removeItem('adminToken');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('adminToken');
        router.push('/login');
      }
    }
  };

  const loadPointHistory = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/points', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('포인트 히스토리 로드 성공:', data.length, '건');
        setPointHistory(data);
      } else {
        console.error('포인트 히스토리 로드 실패:', response.status, response.statusText);
        showToast('포인트 히스토리를 불러오는데 실패했습니다.', 'error');
        // API 호출 실패 시에도 페이지에 머무름
        setPointHistory([]);
      }
    } catch (error) {
      console.error('Error loading point history:', error);
      showToast('포인트 히스토리 로딩 중 오류가 발생했습니다.', 'error');
      // 에러 발생 시에도 페이지에 머무름
      setPointHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async (userId: string, points: number, reason: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/points/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, points, reason })
      });

      if (response.ok) {
        showToast('포인트가 추가되었습니다.');
        loadPointHistory();
      } else {
        showToast('포인트 추가에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Add points error:', error);
      showToast('포인트 추가 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeductPoints = async (userId: string, points: number, reason: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/points/deduct', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, points, reason })
      });

      if (response.ok) {
        showToast('포인트가 차감되었습니다.');
        loadPointHistory();
      } else {
        showToast('포인트 차감에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Deduct points error:', error);
      showToast('포인트 차감 중 오류가 발생했습니다.', 'error');
    }
  };

  // 필터링된 포인트 히스토리
  const filteredHistory = pointHistory.filter(record => {
    return typeFilter === 'all' || record.type === typeFilter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earn': return 'text-green-600 bg-green-100';
      case 'spend': return 'text-red-600 bg-red-100';
      case 'admin_add': return 'text-blue-600 bg-blue-100';
      case 'admin_deduct': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'earn': return '획득';
      case 'spend': return '사용';
      case 'admin_add': return '관리자 추가';
      case 'admin_deduct': return '관리자 차감';
      default: return type;
    }
  };

  const getPointsColor = (points: number) => {
    return points > 0 ? 'text-green-600' : 'text-red-600';
  };

  useEffect(() => {
    console.log('포인트 관리 페이지 로드 시작');
    checkAuth();
    loadPointHistory();
  }, []);

  console.log('포인트 관리 페이지 렌더링, loading:', loading, 'pointHistory length:', pointHistory.length);

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
            <h1 className="text-2xl font-bold text-gray-900">포인트 관리</h1>
            <p className="text-gray-600">사용자 포인트를 관리하고 히스토리를 확인할 수 있습니다.</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="유형 필터"
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: 'all', label: '전체' },
                  { value: 'earn', label: '획득' },
                  { value: 'spend', label: '사용' },
                  { value: 'admin_add', label: '관리자 추가' },
                  { value: 'admin_deduct', label: '관리자 차감' }
                ]}
              />
              <div className="flex items-end">
                <button
                  onClick={loadPointHistory}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>

          {/* Point History Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                포인트 히스토리 ({filteredHistory.length}건)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      포인트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사유
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-300 flex items-center justify-center">
                              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.user_email}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {record.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getPointsColor(record.points)}`}>
                          {record.points > 0 ? '+' : ''}{record.points} P
                        </div>
                        <div className="text-xs text-gray-500">
                          잔액: {record.balance_after} P
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                          {getTypeText(record.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {record.reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              console.log('상세 버튼 클릭:', record.id);
                              router.push(`/point-detail/${record.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            상세
                          </button>
                          <button
                            onClick={() => {
                              const points = prompt('추가할 포인트를 입력하세요:');
                              const reason = prompt('사유를 입력하세요:');
                              if (points && reason) {
                                handleAddPoints(record.user_id, parseInt(points), reason);
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            추가
                          </button>
                          <button
                            onClick={() => {
                              const points = prompt('차감할 포인트를 입력하세요:');
                              const reason = prompt('사유를 입력하세요:');
                              if (points && reason) {
                                handleDeductPoints(record.user_id, parseInt(points), reason);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            차감
                          </button>
                        </div>
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