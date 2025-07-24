import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
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
  const [refreshing, setRefreshing] = useState(false);
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

  const loadPointHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

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
        if (isRefresh) {
          showToast('데이터가 새로고침되었습니다.');
        }
      } else {
        console.error('포인트 히스토리 로드 실패:', response.status, response.statusText);
        showToast('포인트 히스토리를 불러오는데 실패했습니다.', 'error');
        setPointHistory([]);
      }
    } catch (error) {
      console.error('Error loading point history:', error);
      showToast('포인트 히스토리 로딩 중 오류가 발생했습니다.', 'error');
      setPointHistory([]);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
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

  const columns = [
    { 
      key: 'user_email', 
      header: '사용자', 
      width: 'w-48',
      render: (value: string) => (
        <div className="text-sm font-medium text-gray-900">
          {value}
        </div>
      )
    },
    {
      key: 'points',
      header: '포인트',
      width: 'w-24',
      render: (value: number) => (
        <span className={`text-sm font-medium ${getPointsColor(value)}`}>
          {value > 0 ? `+${value}` : value}
        </span>
      )
    },
    {
      key: 'type',
      header: '유형',
      width: 'w-28',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(value)}`}>
          {getTypeText(value)}
        </span>
      )
    },
    {
      key: 'reason',
      header: '사유',
      width: 'w-64',
      render: (value: string) => (
        <div className="text-sm text-gray-900">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: '날짜',
      width: 'w-32',
      render: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('ko-KR');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      key: 'actions',
      header: '작업',
      width: 'w-20',
      render: (_: any, record: PointRecord) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push(`/point-detail/${record.id}`)}
          className="w-full text-xs px-2 py-1"
        >
          상세
        </Button>
      )
    }
  ];

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
            <p className="text-gray-600">포인트 히스토리를 관리하고 모니터링할 수 있습니다.</p>
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
                <Button
                  onClick={() => loadPointHistory(true)}
                  disabled={refreshing}
                  variant={undefined}
                  className="h-11 px-4 text-base bg-white text-black border border-gray-300 rounded-md font-bold hover:bg-gray-50 transition-colors w-full"
                >
                  {refreshing ? '검색 중...' : '검색'}
                </Button>
              </div>
            </div>
          </div>

          {/* Point History Table */}
          <Table
            title="포인트 히스토리"
            data={filteredHistory}
            columns={columns}
            loading={loading}
            emptyMessage="포인트 히스토리가 없습니다."
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