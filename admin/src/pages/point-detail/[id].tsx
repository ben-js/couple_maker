import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Button from '../../components/common/Button';

interface PointHistory {
  id: string;
  user_id: string;
  amount: number;
  points?: number;
  type: string;
  description?: string;
  reason?: string;
  balance?: number;
  balance_after?: number;
  created_at: string;
  createdAt?: string;
  created_by?: string;
  user?: {
    user_id: string;
    email: string;
    name?: string;
    grade?: string;
    points?: number;
    created_at: string;
    createdAt?: string;
  };
}

export default function PointDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [pointHistory, setPointHistory] = useState<PointHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPointDetail();
    }
  }, [id]);

  const fetchPointDetail = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/points/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const pointData = await response.json();
        setPointHistory(pointData);
      } else {
        setError('포인트 내역을 찾을 수 없습니다.');
      }
      
    } catch (error) {
      console.error('포인트 상세 정보 조회 오류:', error);
      setError('포인트 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earn':
      case 'admin_add':
      case '적립':
        return 'text-green-600';
      case 'use':
      case 'spend':
      case 'admin_deduct':
      case '사용':
        return 'text-red-600';
      case 'refund':
      case '환불':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'earn':
      case 'admin_add':
      case '적립':
        return '적립';
      case 'use':
      case 'spend':
      case 'admin_deduct':
      case '사용':
        return '사용';
      case 'refund':
      case '환불':
        return '환불';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
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

  if (error || !pointHistory) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">{error || '포인트 내역을 찾을 수 없습니다.'}</div>
            <Button onClick={() => router.back()}>뒤로 가기</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isDeduct = pointHistory.type === 'use' || pointHistory.type === 'spend' || pointHistory.type === 'admin_deduct' || pointHistory.type === '사용';
  const pointAmount = pointHistory.amount || pointHistory.points || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Button 
                  onClick={() => router.back()} 
                  variant="secondary"
                  className="mr-4"
                >
                  ← 뒤로
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">포인트 상세 정보</h1>
              </div>
            </div>
          </div>

          {/* 포인트 정보 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 포인트 내역 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">내역 ID</label>
                  <p className="text-gray-900">{pointHistory.id}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">포인트</label>
                  <p className={`text-2xl font-bold ${getTypeColor(pointHistory.type)}`}>
                    {isDeduct ? '-' : '+'}{pointAmount.toLocaleString()} P
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(pointHistory.type)}`}>
                    {getTypeText(pointHistory.type)}
                  </span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">처리일</label>
                  <p className="text-gray-900">{formatDate(pointHistory.created_at || pointHistory.createdAt || '')}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상세 정보</label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">설명:</span>
                    <p className="text-gray-800 mt-1">{pointHistory.description || '설명 없음'}</p>
                  </div>
                  {pointHistory.reason && (
                    <div>
                      <span className="font-medium text-gray-700">사유:</span>
                      <p className="text-gray-800 mt-1">{pointHistory.reason}</p>
                    </div>
                  )}
                  {(pointHistory.balance || pointHistory.balance_after) && (
                    <div>
                      <span className="font-medium text-gray-700">잔액:</span>
                      <p className="text-gray-800 mt-1">
                        {(pointHistory.balance_after || pointHistory.balance || 0).toLocaleString()} P
                      </p>
                    </div>
                  )}
                  {pointHistory.created_by && (
                    <div>
                      <span className="font-medium text-gray-700">처리자:</span>
                      <p className="text-gray-800 mt-1">{pointHistory.created_by}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 사용자 정보 */}
          {pointHistory.user && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 사용자 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용자 ID</label>
                    <p className="text-gray-900">{pointHistory.user.user_id}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <p className="text-gray-900">{pointHistory.user.email}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <p className="text-gray-900">{pointHistory.user.name || '미설정'}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                    <p className="text-gray-900">{pointHistory.user.grade || '일반'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">현재 포인트</label>
                    <p className="text-2xl font-bold text-blue-600">
                      {(pointHistory.user.points || 0).toLocaleString()} P
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                    <p className="text-gray-900">{formatDateOnly(pointHistory.user.created_at || pointHistory.user.createdAt || '')}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => router.push(`/user-detail/${pointHistory.user!.user_id}`)}
                  variant="primary"
                  size="sm"
                >
                  사용자 상세보기
                </Button>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 관리 액션</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => {
                  alert('포인트 내역 수정 기능은 추후 구현 예정입니다.');
                }}
                variant="secondary"
              >
                내역 수정
              </Button>
              <Button
                onClick={() => {
                  if (confirm('정말로 이 포인트 내역을 삭제하시겠습니까?')) {
                    alert('포인트 내역 삭제 기능은 추후 구현 예정입니다.');
                  }
                }}
                variant="danger"
              >
                내역 삭제
              </Button>
              <Button
                onClick={() => router.push('/point-management')}
                variant="secondary"
              >
                목록으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 