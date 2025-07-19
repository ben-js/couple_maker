import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { User } from '../../types/common';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface UserDetail {
  user: {
    user_id: string;
    email: string;
    status: string;
    grade: string;
    points: number;
    created_at: string;
    updated_at: string;
    has_profile: boolean;
    has_preferences: boolean;
    is_verified: boolean;
    is_deleted: boolean;
    profile?: any; // 프로필 정보 추가
    preferences?: any; // 선호도 정보 추가
  };
  matchingHistory: Array<{
    id: string;
    user1_id: string;
    user2_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  reviews: Array<{
    id: string;
    user_id: string;
    target_user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  pointHistory: Array<{
    id: string;
    user_id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
  }>;
  statusHistory: Array<{
    id: string;
    user_id: string;
    status: string;
    reason: string;
    created_at: string;
  }>;
}

export default function UserDetail() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'matching' | 'reviews' | 'points'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const router = useRouter();
  const { userId } = router.query;

  useEffect(() => {
    if (userId) {
      loadUserDetail();
    }
  }, [userId]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      console.log('사용자 상세 정보 로딩 시작, userId:', userId);
      
      const token = localStorage.getItem('adminToken');
      console.log('토큰 존재 여부:', !!token);
      console.log('토큰 값:', token ? token.substring(0, 20) + '...' : 'null');
      
      // 개발 중에는 토큰이 없어도 API 호출 허용
      console.log('개발 중 토큰 검증 우회');
      
      const url = `/api/users/${userId}`;
      console.log('API 호출 URL:', url);
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('받은 사용자 데이터:', result);
        if (result.success && result.data) {
          console.log('사용자 프로필 데이터:', result.data.user.profile);
          console.log('사용자 선호도 데이터:', result.data.user.preferences);
          console.log('has_profile:', result.data.user.has_profile);
          console.log('has_preferences:', result.data.user.has_preferences);
          setUser(result.data);
        } else {
          console.error('API 응답이 성공이지만 데이터가 없음:', result);
          setError('사용자 데이터 형식이 올바르지 않습니다.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 에러 응답:', errorData);
        setError(`사용자 정보를 불러올 수 없습니다. (${response.status}: ${errorData.message || '알 수 없는 오류'})`);
      }
    } catch (error) {
      console.error('Error loading user detail:', error);
      setError('사용자 정보 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'black': return 'text-white bg-gray-800';
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {

      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'general': return 'text-blue-600 bg-blue-100';
      case 'excellent': return 'text-purple-600 bg-purple-100';
      case 'vip': return 'text-orange-600 bg-orange-100';
      case 'vvip': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusName = (status: string) => {
    const statusNames: Record<string, string> = {
      'active': '활성',
      'inactive': '비활성',
      'suspended': '정지',
      'black': '블랙',
      'green': '활성',
      'yellow': '비활성',
      'red': '정지'
    };
    return statusNames[status] || status;
  };

  const getGradeName = (grade: string) => {
    const gradeNames: Record<string, string> = {
      
      'silver': '실버',
      'gold': '골드',
      'premium': '프리미엄',
      'general': '일반',
      'excellent': '우수',
      'vip': 'VIP',
      'vvip': 'VVIP'
    };
    return gradeNames[grade] || grade;
  };

  const formatBirthDate = (birthDate: { month: number; year: number; day: number }) => {
    return `${birthDate.year}년 ${birthDate.month}월 ${birthDate.day}일`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleEditStart = () => {
    setEditStatus(user?.user.status || '');
    setEditGrade(user?.user.grade || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditStatus('');
    setEditGrade('');
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      
      // 상태 업데이트
      const statusResponse = await fetch(`/api/users/${user.user.user_id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus
        })
      });

      // 등급 업데이트
      const gradeResponse = await fetch(`/api/users/${user.user.user_id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          grade: editGrade
        })
      });

      if (statusResponse.ok && gradeResponse.ok) {
        // 사용자 정보 다시 로드
        await loadUserDetail();
        setIsEditing(false);
        alert('사용자 정보가 성공적으로 업데이트되었습니다.');
      } else {
        const statusError = await statusResponse.json().catch(() => ({}));
        const gradeError = await gradeResponse.json().catch(() => ({}));
        alert(`업데이트 실패: ${statusError.message || gradeError.message}`);
      }
    } catch (error) {
      console.error('사용자 정보 업데이트 오류:', error);
      alert('사용자 정보 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
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

  if (error || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">{error || '사용자를 찾을 수 없습니다.'}</div>
            <Button onClick={() => router.push('/user-management')}>목록 가기</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">사용자 상세 정보</h1>
                <p className="text-gray-600">사용자의 상세 정보를 확인할 수 있습니다.</p>
              </div>
              <button 
                onClick={() => router.push('/user-management')} 
                className="px-4 py-2 bg-white text-black text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                목록 가기
              </button>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">📋 기본 정보</h2>
              {!isEditing ? (
                <Button
                  onClick={handleEditStart}
                  variant="secondary"
                  size="sm"
                >
                  편집
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    size="sm"
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </Button>
                  <Button
                    onClick={handleEditCancel}
                    variant="secondary"
                    size="sm"
                    disabled={saving}
                  >
                    취소
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용자 ID</label>
                <p className="text-gray-900">{user.user.user_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <p className="text-gray-900">{user.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                <p className="text-gray-900">{formatDate(user.user.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                {isEditing ? (
                  <Select
                    value={editStatus}
                    onChange={setEditStatus}
                    options={[
                      { value: 'active', label: '활성' },
                      { value: 'inactive', label: '비활성' },
                      { value: 'suspended', label: '정지' },
                      { value: 'black', label: '블랙' },
                      { value: 'green', label: '활성 (Green)' },
                      { value: 'yellow', label: '비활성 (Yellow)' },
                      { value: 'red', label: '정지 (Red)' }
                    ]}
                    placeholder="상태 선택"
                  />
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.user.status)}`}>
                    {getStatusName(user.user.status)}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">등급</label>
                {isEditing ? (
                  <Select
                    value={editGrade}
                    onChange={setEditGrade}
                    options={[
                      { value: 'general', label: '일반' },
                      { value: 'silver', label: '실버' },
                      { value: 'gold', label: '골드' },
                      { value: 'premium', label: '프리미엄' },
                      { value: 'excellent', label: '우수' },
                      { value: 'vip', label: 'VIP' },
                      { value: 'vvip', label: 'VVIP' }
                    ]}
                    placeholder="등급 선택"
                  />
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(user.user.grade)}`}>
                    {getGradeName(user.user.grade)}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">포인트</label>
                <p className="text-2xl font-bold text-blue-600">{user.user.points.toLocaleString()} P</p>
              </div>
            </div>
          </div>

          {/* 프로필 정보 */}
          {user.user.has_profile && user.user.profile && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-purple-600 text-sm">👤</span>
                  </div>
                  프로필 정보
                </h2>
                {user.user.profile.photos && user.user.profile.photos.length > 0 && (
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    <PhotoIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">사진 보기</span>
                  </button>
                )}
              </div>
              {(() => {
                console.log('프로필 데이터 상세:', {
                  name: user.user.profile.name,
                  gender: user.user.profile.gender,
                  birth_date: user.user.profile.birth_date,
                  height: user.user.profile.height,
                  body_type: user.user.profile.body_type,
                  education: user.user.profile.education,
                  job: user.user.profile.job,
                  salary: user.user.profile.salary,
                  assets: user.user.profile.assets,
                  location: user.user.profile.location,
                  mbti: user.user.profile.mbti,
                  religion: user.user.profile.religion,
                  smoking: user.user.profile.smoking,
                  drinking: user.user.profile.drinking,
                  marriage_plan: user.user.profile.marriage_plan,
                  children_wish: user.user.profile.children_wish,
                  interests: user.user.profile.interests,
                  favorite_food: user.user.profile.favorite_food,
                  introduction: user.user.profile.introduction
                });
                return null;
              })()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <p className="text-gray-900">{user.user.profile.name || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                    <p className="text-gray-900">{user.user.profile.gender || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <p className="text-gray-900">
                      {user.user.profile.birth_date ? formatBirthDate(user.user.profile.birth_date) : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">키</label>
                    <p className="text-gray-900">{user.user.profile.height ? `${user.user.profile.height}cm` : 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">체형</label>
                    <p className="text-gray-900">{user.user.profile.body_type || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">학력</label>
                    <p className="text-gray-900">{user.user.profile.education || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">직업</label>
                    <p className="text-gray-900">{user.user.profile.job || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">연봉</label>
                    <p className="text-gray-900">{user.user.profile.salary ? `${user.user.profile.salary}만원` : 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">자산</label>
                    <p className="text-gray-900">{user.user.profile.assets || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                    <p className="text-gray-900">{user.user.profile.location || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* 추가 정보 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">MBTI</label>
                    <p className="text-gray-900">{user.user.profile.mbti || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">종교</label>
                    <p className="text-gray-900">{user.user.profile.religion || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">흡연</label>
                    <p className="text-gray-900">{user.user.profile.smoking || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">음주</label>
                    <p className="text-gray-900">{user.user.profile.drinking || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">결혼 계획</label>
                    <p className="text-gray-900">{user.user.profile.marriage_plan || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">자녀 희망</label>
                    <p className="text-gray-900">{user.user.profile.children_wish || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">관심사</label>
                    <p className="text-gray-900">{user.user.profile.interests ? user.user.profile.interests.join(', ') : 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">좋아하는 음식</label>
                    <p className="text-gray-900">{user.user.profile.favorite_food || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{user.user.profile.introduction || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* 이상형 정보 */}
          {user.user.has_preferences && user.user.preferences && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">💕 이상형 정보</h2>
              {(() => {
                console.log('이상형 데이터 상세:', user.user.preferences);
                return null;
              })()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">선호 성별</label>
                    <p className="text-gray-900">{user.user.preferences.preferred_gender || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">나이 범위</label>
                    <p className="text-gray-900">
                      {user.user.preferences.age_range 
                        ? `${user.user.preferences.age_range.min}세 ~ ${user.user.preferences.age_range.max}세`
                        : user.user.preferences.age_min && user.user.preferences.age_max
                        ? `${user.user.preferences.age_min}세 ~ ${user.user.preferences.age_max}세`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">키 범위</label>
                    <p className="text-gray-900">
                      {user.user.preferences.height_range
                        ? `${user.user.preferences.height_range.min}cm ~ ${user.user.preferences.height_range.max}cm`
                        : user.user.preferences.height_min && user.user.preferences.height_max
                        ? `${user.user.preferences.height_min}cm ~ ${user.user.preferences.height_max}cm`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">선호 지역</label>
                    <p className="text-gray-900">
                      {user.user.preferences.regions 
                        ? user.user.preferences.regions.map((region: any) => region.name || region).join(', ')
                        : user.user.preferences.preferred_locations 
                        ? user.user.preferences.preferred_locations.join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">선호 직업</label>
                    <p className="text-gray-900">
                      {user.user.preferences.job_types 
                        ? user.user.preferences.job_types.join(', ')
                        : user.user.preferences.preferred_jobs 
                        ? user.user.preferences.preferred_jobs.join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">선호 학력</label>
                    <p className="text-gray-900">
                      {user.user.preferences.education_levels 
                        ? user.user.preferences.education_levels.join(', ')
                        : user.user.preferences.preferred_education 
                        ? user.user.preferences.preferred_education.join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">선호 체형</label>
                    <p className="text-gray-900">
                      {user.user.preferences.body_types 
                        ? user.user.preferences.body_types.join(', ')
                        : user.user.preferences.preferred_body_types 
                        ? user.user.preferences.preferred_body_types.join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">선호 MBTI</label>
                    <p className="text-gray-900">
                      {user.user.preferences.mbti_types 
                        ? user.user.preferences.mbti_types.join(', ')
                        : user.user.preferences.preferred_mbti 
                        ? user.user.preferences.preferred_mbti.join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">결혼 계획</label>
                    <p className="text-gray-900">
                      {user.user.preferences.marriage_plan || 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">자녀 희망</label>
                    <p className="text-gray-900">
                      {user.user.preferences.children_desire || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 추가 정보 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">종교</label>
                    <p className="text-gray-900">
                      {user.user.preferences.religion || 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">흡연</label>
                    <p className="text-gray-900">
                      {user.user.preferences.smoking || 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">음주</label>
                    <p className="text-gray-900">
                      {user.user.preferences.drinking || 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">관심사</label>
                    <p className="text-gray-900">
                      {user.user.preferences.interests 
                        ? user.user.preferences.interests.join(', ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                    <p className="text-gray-900">
                      {user.user.preferences.priority || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}



                      {/* 히스토리 탭 */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('matching')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'matching'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    매칭 히스토리 ({user.matchingHistory.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    리뷰 히스토리 ({user.reviews.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('points')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'points'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    포인트 내역 ({user.pointHistory.length})
                  </button>
                </nav>
              </div>

            <div className="p-6">
              {activeTab === 'matching' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">매칭 히스토리</h3>
                  {user.matchingHistory.length > 0 ? (
                    <div className="space-y-4">
                      {user.matchingHistory.map((match) => (
                        <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-600">매칭 ID: {match.id}</p>
                              <p className="text-sm text-gray-600">상태: {match.status}</p>
                              <p className="text-sm text-gray-600">생성일: {formatDate(match.created_at)}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => router.push(`/match-detail/${match.id}`)}
                            >
                              상세보기
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">매칭 히스토리가 없습니다.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">리뷰 히스토리</h3>
                  {user.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {user.reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-600">
                                {review.user_id === user.user.user_id ? '작성한 리뷰' : '받은 리뷰'}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1 text-sm font-medium">{review.rating}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                              <p className="text-sm text-gray-600">작성일: {formatDate(review.created_at)}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => router.push(`/review-detail/${review.id}`)}
                            >
                              상세보기
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">리뷰 히스토리가 없습니다.</p>
                  )}
                </div>
              )}

              {activeTab === 'points' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">포인트 내역</h3>
                  {user.pointHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {user.pointHistory.map((point) => (
                            <tr key={point.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(point.created_at)}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {point.type}
                                </span>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                                <span className={point.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {point.amount >= 0 ? '+' : ''}{point.amount.toLocaleString()} P
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate" title={point.description}>
                                {point.description}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => router.push(`/point-detail/${point.id}`)}
                                >
                                  상세보기
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">포인트 내역이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 사진 모달 */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        size="lg"
      >
        <div className="p-0 max-w-2xl mx-auto">
          <div className="flex justify-end p-1">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {user.user.profile.photos && user.user.profile.photos.length > 0 ? (
            <>
              {/* 메인 이미지 영역 */}
              <div className="px-0 mb-1">
                <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={user.user.profile.photos[currentPhotoIndex]}
                    alt={`사용자 사진 ${currentPhotoIndex + 1}`}
                    className="w-full h-auto max-h-96 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzExMC40NTcgMTEwIDExOSAxMDEuNDU3IDExOSA5MUMxMTkgODAuNTQzIDExMC40NTcgNzIgMTAwIDcyQzg5LjU0MyA3MiA4MSA4MC41NDMgODEgOTFDODEgMTAxLjQ1NyA4OS41NDMgMTEwIDEwMCAxMTBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMDAgMTI4Qzc4LjM0MzEgMTI4IDYxIDExMC42NTcgNjEgODlDNjEgNjcuMzQzMSA3OC4zNDMxIDUwIDEwMCA1MEMxMjEuNjU3IDUwIDEzOSA2Ny4zNDMxIDEzOSA4OUMxMzkgMTEwLjY1NyAxMjEuNjU3IDEyOCAxMDAgMTI4WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K";
                    }}
                  />
                </div>
              </div>
              
              {/* 이미지 인디케이터 (동그라미) */}
              <div className="flex justify-center space-x-2 mb-1">
                {user.user.profile.photos.map((photo: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentPhotoIndex
                        ? 'bg-blue-500 scale-110'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              {/* 네비게이션 버튼 (여러 장일 때만) */}
              {user.user.profile.photos.length > 1 && (
                <div className="flex justify-between items-center px-2">
                  <button
                    onClick={() => setCurrentPhotoIndex(prev => 
                      prev > 0 ? prev - 1 : user.user.profile.photos.length - 1
                    )}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPhotoIndex(prev => 
                      prev < user.user.profile.photos.length - 1 ? prev + 1 : 0
                    )}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">등록된 사진이 없습니다.</p>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
} 