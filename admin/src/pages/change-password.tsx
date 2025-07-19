import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Toast from '../components/Toast';

interface CurrentUser {
  id: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
}

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Errors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function ChangePassword() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Errors>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // 개발 중에는 토큰만 확인하고 사용자 정보는 기본값 사용
      if (process.env.NODE_ENV === 'development') {
        setCurrentUser({
          id: 'manager_1752927754902_jdt96co74',
          email: 'ben.js@datesense.app',
          name: 'Ben Johnson',
          role: 'admin'
        });
        setLoading(false);
        return;
      }

      // 프로덕션에서는 실제 인증 확인
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        localStorage.removeItem('adminToken');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '새 비밀번호는 최소 6자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호 확인을 입력해주세요.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        showToast('비밀번호가 성공적으로 변경되었습니다.');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({});
        router.push('/dashboard');
      } else {
        const error = await response.json();
        showToast(`비밀번호 변경 실패: ${error.message}`, 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToast('비밀번호 변경 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 실시간 유효성 검사
    if (errors[name as keyof Errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                비밀번호 변경
              </h2>
              <p className="text-sm text-gray-600">
                안전한 비밀번호로 변경해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 현재 비밀번호 */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.currentPassword ? 'border-red-500' : ''
                  }`}
                  placeholder="현재 비밀번호를 입력하세요"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.newPassword ? 'border-red-500' : ''
                  }`}
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  {submitting ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          </div>
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