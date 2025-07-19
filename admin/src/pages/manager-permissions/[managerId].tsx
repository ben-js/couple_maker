import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Toast from '../../components/Toast';
import Button from '../../components/common/Button';
import { Manager } from '../../types/common';
import DataService from '../../lib/dataService';

interface CurrentUser {
  id: string;
  email: string;
  permissions: Record<string, Record<string, boolean>>;
}

export default function ManagerPermissions() {
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const router = useRouter();
  const { managerId } = router.query;
  const dataService = new DataService();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (managerId) {
      loadManager();
    }
  }, [managerId]);

  const loadManager = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('매니저 정보 로드 성공:', data);
        setManager(data);
      } else {
        console.error('매니저 정보 로드 실패:', response.status);
        showToast('매니저 정보를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error loading manager:', error);
      showToast('매니저 정보 로딩 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionsChange = async () => {
    if (!manager) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/managers/${manager.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: manager.permissions })
      });

      if (response.ok) {
        // 권한 변경 로그 기록
        try {
          const currentManagerId = 'admin'; // 임시로 admin으로 설정
          
          // 디버깅: 매니저 정보 확인
          console.log('🔍 매니저 정보 디버깅:', {
            id: manager.id,
            name: manager.name,
            email: manager.email,
            nameType: typeof manager.name,
            emailType: typeof manager.email
          });
          
          // 변경된 권한을 요약하여 로그에 기록
          const changedPermissions = Object.entries(manager.permissions || {}).map(([permission, actions]) => {
            const enabledActions = Object.entries(actions)
              .filter(([_, enabled]) => enabled)
              .map(([action, _]) => action === 'read' ? '조회' : action === 'write' ? '수정' : '삭제')
              .join(', ');
            return `${getPermissionText(permission)}: ${enabledActions || '없음'}`;
          }).join('; ');

          const logMessage = `권한 변경: ${manager.name || '알 수 없음'} (${manager.email || '알 수 없음'}) - ${changedPermissions}`;
          console.log('📝 로그 메시지:', logMessage);

          await dataService.logManagerAction(
            currentManagerId,
            'permission_change',
            manager.id,
            logMessage
          );
        } catch (logError) {
          console.error('권한 변경 로그 기록 실패:', logError);
          // 로그 기록 실패해도 권한 변경은 계속 진행
        }

        showToast('권한이 성공적으로 저장되었습니다.');
        setTimeout(() => {
          router.push('/manager-management');
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Permission change failed:', errorData);
        showToast(`권한 변경에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('Permissions change error:', error);
      showToast('권한 변경 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!confirm(`정말로 ${manager?.name} 매니저를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/managers/${manager?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('매니저가 성공적으로 삭제되었습니다.');
        setTimeout(() => {
          router.push('/manager-management');
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Manager deletion failed:', errorData);
        showToast(`매니저 삭제에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('Manager deletion error:', error);
      showToast('매니저 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'manager': return 'text-blue-600 bg-blue-100';
      case 'support': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'manager': return '매니저';
      case 'support': return '고객지원';
      default: return role;
    }
  };

  const getPermissionText = (permission: string) => {
    const permissionMap: Record<string, string> = {
      user_management: '사용자 관리',
      matching_management: '매칭 관리',
      review_management: '리뷰 관리',
      point_management: '포인트 관리',
      manager_management: '매니저 관리',
      manager_logs: '매니저 로그',
      admin_logs: '매니저 로그',
      dashboard: '대시보드'
    };
    return permissionMap[permission] || permission;
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

  if (!manager) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">매니저를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 - 데스크톱에서는 같은 라인, 모바일에서는 세로 배치 */}
          <div className="mb-6">
            {/* 데스크톱 레이아웃 */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">권한 설정</h1>
                <p className="text-gray-600">매니저의 권한을 설정할 수 있습니다.</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePermissionsChange}
                  disabled={saving}
                  variant="primary"
                  size="sm"
                >
                  {saving ? '저장 중...' : '권한 저장'}
                </Button>
                <Button
                  onClick={handleDeleteManager}
                  disabled={saving}
                  variant="danger"
                  size="sm"
                >
                  {saving ? '삭제 중...' : '매니저 삭제'}
                </Button>
                <Button
                  onClick={() => router.push('/manager-management')}
                  variant="secondary"
                  size="sm"
                >
                  목록 가기
                </Button>
              </div>
            </div>
            
            {/* 모바일 레이아웃 */}
            <div className="md:hidden">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">권한 설정</h1>
                <p className="text-gray-600">매니저의 권한을 설정할 수 있습니다.</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePermissionsChange}
                  disabled={saving}
                  variant="primary"
                  size="sm"
                >
                  {saving ? '저장 중...' : '권한 저장'}
                </Button>
                <Button
                  onClick={handleDeleteManager}
                  disabled={saving}
                  variant="danger"
                  size="sm"
                >
                  {saving ? '삭제 중...' : '매니저 삭제'}
                </Button>
                <Button
                  onClick={() => router.push('/manager-management')}
                  variant="secondary"
                  size="sm"
                >
                  목록 가기
                </Button>
              </div>
            </div>
          </div>

          {/* 매니저 정보 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-xl font-semibold text-gray-900">{manager.name}</h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(manager.role)}`}>
                      {getRoleText(manager.role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{manager.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 권한 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">권한 설정</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    // 모든 권한 활성화
                    const allPermissions = Object.keys(manager.permissions || {}).reduce((acc, permission) => {
                      acc[permission] = { read: true, write: true, delete: true };
                      return acc;
                    }, {} as Record<string, Record<string, boolean>>);
                    setManager(prev => prev ? { ...prev, permissions: allPermissions } : null);
                  }}
                  variant="success"
                  size="sm"
                >
                  전체 선택
                </Button>
                <Button
                  onClick={() => {
                    // 모든 권한 비활성화
                    const noPermissions = Object.keys(manager.permissions || {}).reduce((acc, permission) => {
                      acc[permission] = { read: false, write: false, delete: false };
                      return acc;
                    }, {} as Record<string, Record<string, boolean>>);
                    setManager(prev => prev ? { ...prev, permissions: noPermissions } : null);
                  }}
                  variant="danger"
                  size="sm"
                >
                  전체 해제
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Object.entries(manager.permissions || {}).map(([permission, actions]) => (
                <div key={permission} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{getPermissionText(permission)}</h4>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          // 해당 권한의 모든 액션 활성화
                          const updatedPermissions = {
                            ...manager.permissions,
                            [permission]: { read: true, write: true, delete: true }
                          };
                          setManager(prev => prev ? { ...prev, permissions: updatedPermissions } : null);
                        }}
                        variant="primary"
                        size="sm"
                      >
                        전체
                      </Button>
                      <Button
                        onClick={() => {
                          // 해당 권한의 모든 액션 비활성화
                          const updatedPermissions = {
                            ...manager.permissions,
                            [permission]: { read: false, write: false, delete: false }
                          };
                          setManager(prev => prev ? { ...prev, permissions: updatedPermissions } : null);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        해제
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(actions).map(([action, enabled]) => (
                      <label key={action} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-white cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => {
                            const updatedPermissions = {
                              ...manager.permissions,
                              [permission]: {
                                ...manager.permissions[permission],
                                [action]: e.target.checked
                              }
                            };
                            setManager(prev => prev ? {
                              ...prev,
                              permissions: updatedPermissions
                            } : null);
                          }}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-base font-medium text-gray-900">
                            {action === 'read' ? '조회' : action === 'write' ? '수정' : '삭제'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {action === 'read' ? '데이터 조회 권한' : action === 'write' ? '데이터 수정 권한' : '데이터 삭제 권한'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 권한 요약 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h4 className="font-medium text-blue-900 mb-4">권한 요약</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(manager.permissions || {}).map(([permission, actions]) => {
                  const enabledCount = Object.values(actions).filter((enabled: boolean) => enabled).length;
                  const totalCount = Object.keys(actions).length;
                  return (
                    <div key={permission} className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-blue-700">{getPermissionText(permission)}:</span>
                      <span className="font-medium text-blue-900">{enabledCount}/{totalCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
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