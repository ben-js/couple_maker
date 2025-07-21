import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Button from '../../components/common/Button';

interface MatchDetail {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_email?: string;
  user2_email?: string;
  status: string;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

export default function MatchDetail() {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      checkAuth();
      loadMatchDetail();
    }
  }, [id]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadMatchDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/match-pairs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const matchDetail = await response.json();
        setMatch(matchDetail);
      } else {
        alert('매칭 정보를 찾을 수 없습니다.');
        router.push('/matching-management');
      }
    } catch (error) {
      console.error('Error loading match detail:', error);
      alert('매칭 정보를 불러오는 중 오류가 발생했습니다.');
      router.push('/matching-management');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'refused': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'matched': return 'text-purple-600 bg-purple-100';
      case 'unmatched': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'refused': return '거절됨';
      case 'completed': return '완료됨';
      case 'matched': return '매칭됨';
      case 'unmatched': return '매칭 안됨';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
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

  if (!match) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">매칭 정보를 찾을 수 없습니다.</div>
            <Button onClick={() => router.push('/matching-management')}>목록으로 돌아가기</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button 
                  onClick={() => router.back()} 
                  variant="secondary"
                  className="mr-4"
                >
                  ← 뒤로
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">매칭 상세 정보</h1>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                {getStatusText(match.status)}
              </div>
            </div>
          </div>

          {/* Match Information */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 매칭 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매칭 ID</label>
                <p className="text-gray-900">{match.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">매칭 상태</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                  {getStatusText(match.status)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">생성일</label>
                <p className="text-gray-900">{formatDate(match.created_at || match.createdAt || '')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수정일</label>
                <p className="text-gray-900">{formatDate(match.updated_at || match.updatedAt || '')}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 사용자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">사용자 1</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">사용자 ID</label>
                    <p className="text-sm text-gray-900">{match.user1_id}</p>
                  </div>
                  {match.user1_email && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">이메일</label>
                      <p className="text-sm text-gray-900">{match.user1_email}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">사용자 2</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">사용자 ID</label>
                    <p className="text-sm text-gray-900">{match.user2_id}</p>
                  </div>
                  {match.user2_email && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">이메일</label>
                      <p className="text-sm text-gray-900">{match.user2_email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 관리 작업</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => router.push('/matching-management')}
                variant="secondary"
              >
                목록으로 돌아가기
              </Button>
              <Button
                onClick={() => router.push(`/user-detail/${match.user1_id}`)}
                variant="primary"
              >
                사용자 1 상세보기
              </Button>
              <Button
                onClick={() => router.push(`/user-detail/${match.user2_id}`)}
                variant="primary"
              >
                사용자 2 상세보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 