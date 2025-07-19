import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Button from '../../components/common/Button';

interface ReviewDetail {
  id: string;
  user_id: string;
  target_user_id: string;
  rating: number;
  comment?: string;
  review_text?: string;
  status: string;
  created_at: string;
  createdAt?: string;
  user?: {
    user_id: string;
    email: string;
    name?: string;
    grade?: string;
    status?: string;
    created_at: string;
    createdAt?: string;
  };
  targetUser?: {
    user_id: string;
    email: string;
    name?: string;
    grade?: string;
    status?: string;
    created_at: string;
    createdAt?: string;
  };
}

export default function ReviewDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReviewDetail();
    }
  }, [id]);

  const fetchReviewDetail = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/reviews/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const reviewData = await response.json();
        setReview(reviewData);
      } else {
        setError('리뷰를 찾을 수 없습니다.');
      }
      
    } catch (error) {
      console.error('리뷰 상세 정보 조회 오류:', error);
      setError('리뷰 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'pending': return '대기중';
      default: return status;
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

  if (error || !review) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">{error || '리뷰를 찾을 수 없습니다.'}</div>
            <Button onClick={() => router.back()}>뒤로 가기</Button>
          </div>
        </div>
      </Layout>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">리뷰 상세 정보</h1>
              </div>
            </div>
          </div>

          {/* 리뷰 정보 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">⭐ 리뷰 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 ID</label>
                  <p className="text-gray-900">{review.id}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">평점</label>
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-xl mr-2">★</span>
                    <span className="text-gray-900 font-medium">{review.rating}/5</span>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">작성일</label>
                  <p className="text-gray-900">{formatDate(review.created_at || review.createdAt || '')}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                    {getStatusText(review.status)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {review.comment || review.review_text || '내용 없음'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 작성자 정보 */}
          {review.user && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">✍️ 작성자 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용자 ID</label>
                    <p className="text-gray-900">{review.user.user_id}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <p className="text-gray-900">{review.user.email}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <p className="text-gray-900">{review.user.name || '미설정'}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                    <p className="text-gray-900">{review.user.grade || '일반'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <p className="text-gray-900">{review.user.status || '활성'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                    <p className="text-gray-900">{formatDateOnly(review.user.created_at || review.user.createdAt || '')}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => router.push(`/user-detail/${review.user!.user_id}`)}
                  variant="primary"
                  size="sm"
                >
                  작성자 상세보기
                </Button>
              </div>
            </div>
          )}

          {/* 대상자 정보 */}
          {review.targetUser && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 대상자 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">사용자 ID</label>
                    <p className="text-gray-900">{review.targetUser.user_id}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <p className="text-gray-900">{review.targetUser.email}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <p className="text-gray-900">{review.targetUser.name || '미설정'}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                    <p className="text-gray-900">{review.targetUser.grade || '일반'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <p className="text-gray-900">{review.targetUser.status || '활성'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                    <p className="text-gray-900">{formatDateOnly(review.targetUser.created_at || review.targetUser.createdAt || '')}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => router.push(`/user-detail/${review.targetUser!.user_id}`)}
                  variant="primary"
                  size="sm"
                >
                  대상자 상세보기
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
                  alert('리뷰 상태 변경 기능은 추후 구현 예정입니다.');
                }}
                variant="secondary"
              >
                상태 변경
              </Button>
              <Button
                onClick={() => {
                  if (confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
                    alert('리뷰 삭제 기능은 추후 구현 예정입니다.');
                  }
                }}
                variant="danger"
              >
                리뷰 삭제
              </Button>
              <Button
                onClick={() => router.push('/review-management')}
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