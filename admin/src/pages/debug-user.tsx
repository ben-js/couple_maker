import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function DebugUser() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setTokenInfo(payload);
        } catch (error) {
          console.error('토큰 디코딩 실패:', error);
        }
      }
    }
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다.</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">사용자 정보 디버깅</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext 사용자 정보 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">AuthContext 사용자 정보</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* JWT 토큰 정보 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">JWT 토큰 정보</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </div>

          {/* 로컬 스토리지 토큰 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">로컬 스토리지 토큰</h2>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <p><strong>토큰 존재:</strong> {localStorage.getItem('adminToken') ? '있음' : '없음'}</p>
              <p><strong>토큰 길이:</strong> {localStorage.getItem('adminToken')?.length || 0}</p>
            </div>
          </div>

          {/* 매니저 정보 API 테스트 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">매니저 정보 API 테스트</h2>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('adminToken');
                  const payload = JSON.parse(atob(token!.split('.')[1]));
                  const managerId = payload.userId;
                  
                  console.log('🔍 테스트 - 매니저 ID:', managerId);
                  
                  const response = await fetch(`/api/admin/managers/${managerId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('✅ 테스트 - 매니저 정보:', data);
                    alert(`매니저 정보 로드 성공!\n이름: ${data.name}\n이메일: ${data.email}`);
                  } else {
                    console.log('❌ 테스트 - 매니저 정보 로드 실패:', response.status);
                    alert(`매니저 정보 로드 실패: ${response.status}`);
                  }
                } catch (error) {
                  console.error('❌ 테스트 - 오류:', error);
                  alert(`오류 발생: ${error}`);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              매니저 정보 가져오기 테스트
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
} 