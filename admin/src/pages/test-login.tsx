import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function TestLogin() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

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

  const testManagerInfo = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setTestResult('토큰이 없습니다.');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const managerId = payload.userId || payload.id || 'admin';
      
      setTestResult(`테스트 시작...\n매니저 ID: ${managerId}\n`);
      
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(prev => prev + `\n✅ 성공!\n이름: ${data.name}\n이메일: ${data.email}\n역할: ${data.role}`);
      } else {
        const errorText = await response.text();
        setTestResult(prev => prev + `\n❌ 실패 (${response.status})\n${errorText}`);
      }
    } catch (error) {
      setTestResult(prev => prev + `\n❌ 오류: ${error}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">로그인 테스트</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 인증 상태 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">인증 상태</h2>
            <div className="space-y-2">
              <p><strong>로그인 상태:</strong> {isAuthenticated ? '로그인됨' : '로그아웃됨'}</p>
              <p><strong>로딩 상태:</strong> {loading ? '로딩 중' : '완료'}</p>
            </div>
          </div>

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

          {/* 테스트 결과 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">매니저 정보 테스트</h2>
            <button
              onClick={testManagerInfo}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
            >
              매니저 정보 가져오기 테스트
            </button>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {testResult || '테스트를 실행해주세요.'}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
} 