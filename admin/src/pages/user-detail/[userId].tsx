import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Modal } from '../../components/common/Modal';

interface User {
  id: string;
  email: string;
  profile: {
    name: string;
    age: number;
    gender: string;
    location: string;
    photos: string[];
    bio: string;
    idealType: {
      ageRange: string;
      location: string;
      personality: string[];
      interests: string[];
      appearance: string[];
    };
  };
  preferences: {
    ageRange: string;
    location: string;
    personality: string[];
    interests: string[];
    appearance: string[];
  };
  status: string;
  createdAt: string;
}

const UserDetailPage: React.FC = () => {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (index: number) => {
    setCurrentPhotoIndex(index);
    setPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setPhotoModalOpen(false);
  };

  const nextPhoto = () => {
    if (user && currentPhotoIndex < user.user.profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">사용자를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">사용자 상세 정보</h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              뒤로 가기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 프로필 정보 */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <p className="text-gray-900">{user.user.profile.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                    <p className="text-gray-900">{user.user.profile.age}세</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                    <p className="text-gray-900">{user.user.profile.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                    <p className="text-gray-900">{user.user.profile.location}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">소개</label>
                    <p className="text-gray-900">{user.user.profile.bio || '소개가 없습니다.'}</p>
                  </div>
                </div>
              </div>

              {/* 이상형 정보 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">이상형</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">나이대</label>
                    <p className="text-gray-900">{user.user.preferences.ageRange || '미설정'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                    <p className="text-gray-900">{user.user.preferences.location || '미설정'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성격</label>
                    <p className="text-gray-900">
                      {user.user.preferences.personality && user.user.preferences.personality.length > 0
                        ? user.user.preferences.personality.join(', ')
                        : '미설정'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">관심사</label>
                    <p className="text-gray-900">
                      {user.user.preferences.interests && user.user.preferences.interests.length > 0
                        ? user.user.preferences.interests.join(', ')
                        : '미설정'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">외모</label>
                    <p className="text-gray-900">
                      {user.user.preferences.appearance && user.user.preferences.appearance.length > 0
                        ? user.user.preferences.appearance.join(', ')
                        : '미설정'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 사진 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">사진</h2>
              <div className="space-y-4">
                {user.user.profile.photos && user.user.profile.photos.length > 0 ? (
                  user.user.profile.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group"
                      onClick={() => openPhotoModal(index)}
                    >
                      <img
                        src={photo}
                        alt={`사진 ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          클릭하여 확대
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">등록된 사진이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사진 모달 */}
      <Modal isOpen={photoModalOpen} onClose={closePhotoModal}>
        <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
          {/* 닫기 버튼 */}
          <button
            onClick={closePhotoModal}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
          >
            ✕
          </button>

          {/* 메인 이미지 */}
          <div className="relative">
            <img
              src={user.user.profile.photos[currentPhotoIndex]}
              alt={`사진 ${currentPhotoIndex + 1}`}
              className="w-full h-auto max-h-[70vh] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.jpg';
              }}
            />

            {/* 네비게이션 화살표 */}
            {user.user.profile.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                <button
                  onClick={nextPhoto}
                  disabled={currentPhotoIndex === user.user.profile.photos.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* 이미지 인디케이터 (동그라미) */}
          <div className="flex justify-center space-x-2 mb-1 mt-6">
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
        </div>
      </Modal>
    </Layout>
  );
};

export default UserDetailPage; 