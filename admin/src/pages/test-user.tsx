import { useState } from 'react';
import Layout from '../components/Layout';

export default function TestUser() {
  const [userId, setUserId] = useState('user_1752848979014_du41gk7je');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testUserAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('테스트 API 호출 시작:', userId);
      
      const response = await fetch(`/api/test-user/${userId}`);
      console.log('API 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      setResult(data);
    } catch (error) {
      console.error('테스트 API 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const testOriginalAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      console.log('토큰:', token ? '존재' : '없음');
      
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('원본 API 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('원본 API 응답 데이터:', data);
      
      setResult(data);
    } catch (error) {
      console.error('원본 API 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">사용자 조회 테스트</h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="사용자 ID를 입력하세요"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={testUserAPI}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? '테스트 중...' : '테스트 API 호출 (토큰 없음)'}
              </button>
              
              <button
                onClick={testOriginalAPI}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '테스트 중...' : '원본 API 호출 (토큰 있음)'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-medium">오류</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">응답 결과</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 