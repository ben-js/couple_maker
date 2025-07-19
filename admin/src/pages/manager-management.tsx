import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
import { Manager } from '../types/common';

interface CurrentUser {
  id: string;
  email: string;
  permissions: Record<string, Record<string, boolean>>;
}

interface NewManager {
  name: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  permissions: Record<string, Record<string, boolean>>;
}

export default function ManagerManagement() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [newManager, setNewManager] = useState<NewManager>({
    name: '',
    email: '',
    role: 'manager',
    password: '',
    confirmPassword: '',
    permissions: getDefaultPermissions('manager')
  });
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    console.log('매니저 관리 페이지 로드 시작');
    loadManagers();
  }, []);

  console.log('매니저 관리 페이지 렌더링, loading:', loading, 'managers length:', managers.length);


  const loadManagers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/managers', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('매니저 목록 로드 성공:', data.length, '명');
        console.log('매니저 데이터 상세:', data);
        setManagers(data);
        if (isRefresh) {
          showToast('데이터가 새로고침되었습니다.');
        }
      } else {
        console.error('매니저 목록 로드 실패:', response.status);
        if (isRefresh) {
          showToast('데이터 새로고침에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      if (isRefresh) {
        showToast('데이터 새로고침 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleAddManager = async () => {
    if (!newManager.name || !newManager.email || !newManager.password || !newManager.confirmPassword) {
      showToast('모든 필드를 입력해주세요.', 'error');
      return;
    }

    if (newManager.password !== newManager.confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    if (newManager.password.length < 6) {
      showToast('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const managerData = {
        name: newManager.name,
        email: newManager.email,
        password: newManager.password,
        role: newManager.role
      };
      
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(managerData)
      });

      if (response.ok) {
        showToast('매니저가 추가되었습니다.');
        setShowAddModal(false);
        setNewManager({ 
          name: '', 
          email: '', 
          role: 'manager', 
          password: '',
          confirmPassword: '',
          permissions: getDefaultPermissions('manager')
        });
        loadManagers(true);
      } else {
        const errorData = await response.json();
        showToast(errorData.message || '매니저 추가에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Add manager error:', error);
      showToast('매니저 추가 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('정말로 이 매니저를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('매니저가 삭제되었습니다.');
        loadManagers(true);
      } else {
        showToast('매니저 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Delete manager error:', error);
      showToast('매니저 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleRoleChange = async (managerId: string, newRole: string) => {
    if (!confirm(`매니저 역할을 '${newRole}'로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        showToast('매니저 역할이 변경되었습니다.');
        loadManagers(true);
      } else {
        showToast('역할 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Role change error:', error);
      showToast('역할 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const handlePermissionsChange = async (managerId: string, permissions: Record<string, Record<string, boolean>>) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.simulated 
          ? '권한이 변경되었습니다. (시뮬레이션 모드)' 
          : '권한이 변경되었습니다.';
        showToast(message);
        loadManagers(true);
      } else {
        const errorData = await response.json();
        console.error('Permission change failed:', errorData);
        showToast(`권한 변경에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('Permissions change error:', error);
      showToast('권한 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const openPermissionsModal = (manager: Manager) => {
    // 권한 설정 페이지로 이동
    router.push(`/manager-permissions/${manager.id}`);
  };

  function getDefaultPermissions(role: string): Record<string, Record<string, boolean>> {
    const basePermissions = {
      user_management: { read: false, write: false, delete: false },
      matching_management: { read: false, write: false, delete: false },
      review_management: { read: false, write: false, delete: false },
      point_management: { read: false, write: false, delete: false },
      manager_management: { read: false, write: false, delete: false },
      manager_logs: { read: false, write: false, delete: false },
      dashboard: { read: false, write: false, delete: false }
    };

    switch (role) {
      case 'admin':
        return Object.keys(basePermissions).reduce((acc, key) => {
          acc[key] = { read: true, write: true, delete: true };
          return acc;
        }, {} as Record<string, Record<string, boolean>>);
      case 'manager':
        return {
          ...basePermissions,
          user_management: { read: true, write: true, delete: false },
          matching_management: { read: true, write: true, delete: false },
          review_management: { read: true, write: true, delete: false },
          dashboard: { read: true, write: false, delete: false }
        };
      case 'support':
        return {
          ...basePermissions,
          user_management: { read: true, write: false, delete: false },
          matching_management: { read: true, write: false, delete: false },
          review_management: { read: true, write: false, delete: false },
          dashboard: { read: true, write: false, delete: false }
        };
      default:
        return basePermissions;
    }
  }

  const handleRoleChangeInAddModal = (newRole: string) => {
    setNewManager(prev => ({
      ...prev,
      role: newRole,
      permissions: getDefaultPermissions(newRole)
    }));
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

  const hasPermission = (permission: string, action: string = 'read') => {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions[permission]?.[action] || false;
  };

  const filteredManagers = managers.filter(manager => {
    return roleFilter === 'all' || manager.role === roleFilter;
  });

  const columns = [
    { key: 'email', header: '이메일', width: 'w-48' },
    { key: 'name', header: '이름', width: 'w-24' },
    {
      key: 'role',
      header: '역할',
      width: 'w-24',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(value)}`}>
          {getRoleText(value)}
        </span>
      )
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-20',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
        }`}>
          {value === 'active' ? '활성' : '비활성'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: '생성일',
      width: 'w-32',
      render: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('ko-KR');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      key: 'actions',
      header: '작업',
      width: 'w-20',
      render: (_: any, manager: Manager) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => openPermissionsModal(manager)}
          className="w-full text-xs px-2 py-1"
        >
          권한
        </Button>
      )
    }
  ];

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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">매니저 관리</h1>
              <p className="text-gray-600">매니저 계정을 관리하고 권한을 설정할 수 있습니다.</p>
            </div>
            {(hasPermission('manager_management', 'write') || process.env.NODE_ENV === 'development') && (
              <Button onClick={() => setShowAddModal(true)}>
                매니저 추가
              </Button>
            )}
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="역할 필터"
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  { value: 'all', label: '전체' },
                  { value: 'admin', label: '관리자' },
                  { value: 'manager', label: '매니저' },
                  { value: 'support', label: '고객지원' }
                ]}
              />
              <div className="flex items-end">
                <Button
                  onClick={() => loadManagers(true)}
                  disabled={refreshing}
                  className="w-full"
                >
                  {refreshing ? '새로고침 중...' : '새로고침'}
                </Button>
              </div>
            </div>
          </div>

          {/* 매니저 테이블 */}
          <Table
            title="매니저 목록"
            data={filteredManagers}
            columns={columns}
            loading={loading}
            emptyMessage="매니저가 없습니다."
            maxHeight="max-h-[600px]"
          />
        </div>
      </div>

      {/* 매니저 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="매니저 추가"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="이름"
            value={newManager.name}
            onChange={(e) => setNewManager(prev => ({ ...prev, name: e.target.value }))}
            placeholder="매니저 이름"
            required
          />
          <Input
            label="이메일"
            type="email"
            value={newManager.email}
            onChange={(e) => setNewManager(prev => ({ ...prev, email: e.target.value }))}
            placeholder="매니저 이메일"
            required
          />
          <Input
            label="비밀번호"
            type="password"
            value={newManager.password}
            onChange={(e) => setNewManager(prev => ({ ...prev, password: e.target.value }))}
            placeholder="비밀번호 (최소 6자)"
            required
          />
          <Input
            label="비밀번호 확인"
            type="password"
            value={newManager.confirmPassword}
            onChange={(e) => setNewManager(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
          {newManager.password && newManager.confirmPassword && newManager.password !== newManager.confirmPassword && (
            <div className="text-red-600 text-sm">
              비밀번호가 일치하지 않습니다.
            </div>
          )}
          <Select
            label="역할"
            value={newManager.role}
            onChange={handleRoleChangeInAddModal}
            options={[
              { value: 'admin', label: '관리자' },
              { value: 'manager', label: '매니저' },
              { value: 'support', label: '고객지원' }
            ]}
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              취소
            </Button>
            <Button 
              onClick={handleAddManager}
              disabled={
                !newManager.name || 
                !newManager.email || 
                !newManager.password || 
                !newManager.confirmPassword ||
                newManager.password !== newManager.confirmPassword ||
                newManager.password.length < 6
              }
            >
              추가
            </Button>
          </div>
        </div>
      </Modal>

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