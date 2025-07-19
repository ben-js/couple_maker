import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
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
        if (isRefresh) {
          showToast('데이터가 새로고침되었습니다.');
        }
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
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const columns = [
    { 
      key: 'match_info', 
      header: '매칭 정보', 
      width: 'w-96',
      render: (_: any, match: Match) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-purple-300 flex items-center justify-center">
              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {match.user1_email} ↔ {match.user2_email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {getStatusText(value)}
        </span>
      )
    },
    {
      key: 'created_at',
      header: '매칭일',
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
      render: (_: any, match: Match) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push(`/match-detail/${match.id}`)}
          className="w-full text-xs px-2 py-1"
        >
          상세
        </Button>
      )
    }
  ];

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
                <Button
                  onClick={() => loadMatches(true)}
                  disabled={refreshing}
                  className="w-full"
                >
                  {refreshing ? '새로고침 중...' : '새로고침'}
                </Button>
              </div>
            </div>
          </div>

          {/* Matches Table */}
          <Table
            title="매칭 목록"
            data={filteredMatches}
            columns={columns}
            loading={loading}
            emptyMessage="매칭이 없습니다."
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