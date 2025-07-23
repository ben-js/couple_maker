import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Toast from '../components/Toast';

interface MatchingRequest {
  request_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function MatchingManagement() {
  const router = useRouter();
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('waiting');
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

  const loadRequests = async (isRefresh = false, status = 'waiting') => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch(`/api/matching-requests`);
      if (response.ok) {
        let data = await response.json();
        if (status !== 'all') {
          data = data.filter((item: MatchingRequest) => item.status === status);
        }
        setRequests(data);
        if (isRefresh) showToast('데이터가 새로고침되었습니다.');
      } else {
        showToast('매칭 요청 데이터를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error loading matching requests:', error);
      if (isRefresh) showToast('데이터 새로고침 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const columns = [
    {
      key: 'user_id',
      header: '유저 ID',
      width: 'w-64',
      render: (value: string) => <span>{value}</span>
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      render: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">{value === 'waiting' ? '대기중' : value}</span>
      )
    },
    {
      key: 'created_at',
      header: '요청일',
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
      render: (_: any, req: MatchingRequest) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push(`/matching-detail/${req.request_id}`)}
          className="w-full text-xs px-2 py-1"
        >
          상세
        </Button>
      )
    }
  ];

  useEffect(() => { checkAuth(); loadRequests(); }, []);

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
            <p className="text-gray-600">매칭 요청 상태를 관리하고 매니저가 매칭을 시켜줄 수 있습니다.</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-row flex-nowrap items-end gap-4">
              <Select
                label="상태 필터"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: '전체' },
                  { value: 'waiting', label: '대기중' }
                ]}
                className="w-32 z-50"
              />
              <Button
                size="sm"
                onClick={() => loadRequests(true, statusFilter)}
                disabled={refreshing}
                className="w-32 py-3 text-base flex-shrink-0"
              >
                {refreshing ? '검색 중...' : '검색'}
              </Button>
            </div>
          </div>

          {/* Matching Requests Table */}
          <Table
            title="매칭 요청 목록"
            data={requests}
            columns={columns}
            loading={loading}
            emptyMessage="매칭 요청이 없습니다."
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