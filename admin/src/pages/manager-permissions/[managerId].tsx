import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: {
    userManagement: boolean;
    managerManagement: boolean;
    matchingManagement: boolean;
    pointManagement: boolean;
    reviewManagement: boolean;
    logView: boolean;
  };
}

const ManagerPermissionsPage: React.FC = () => {
  const router = useRouter();
  const { managerId } = router.query;
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (managerId) {
      fetchManager();
    }
  }, [managerId]);

  const fetchManager = async () => {
    try {
      const response = await fetch(`/api/admin/managers/${managerId}`);
      if (response.ok) {
        const data = await response.json();
        setManager(data);
      }
    } catch (error) {
      console.error('매니저 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    if (manager) {
      setManager({
        ...manager,
        permissions: {
          ...manager.permissions,
          [permission]: value,
        },
      });
    }
  };

  const handleSave = async () => {
    if (!manager) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: manager.permissions,
        }),
      });

      if (response.ok) {
        alert('권한이 저장되었습니다.');
      } else {
        alert('권한 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('권한 저장 실패:', error);
      alert('권한 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 매니저를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/managers/${managerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('매니저가 삭제되었습니다.');
        router.push('/manager-management');
      } else {
        alert('매니저 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('매니저 삭제 실패:', error);
      alert('매니저 삭제에 실패했습니다.');
    }
  };

  const handleBack = () => {
    router.push('/manager-management');
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

  if (!manager) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">매니저를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">권한 설정</h1>
              <p className="text-gray-600">매니저의 권한을 설정할 수 있습니다.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? '저장 중...' : '권한 저장'}
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                매니저 삭제
              </Button>
              <Button
                onClick={handleBack}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                목록 가기
              </Button>
            </div>
          </div>
        </div>

        {/* 매니저 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">매니저 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <p className="text-gray-900">{manager.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <p className="text-gray-900">{manager.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할
              </label>
              <p className="text-gray-900">{manager.role}</p>
            </div>
          </div>
        </div>

        {/* 권한 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">권한 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">사용자 관리</h3>
                <p className="text-sm text-gray-600">사용자 정보 조회 및 관리</p>
              </div>
              <Select
                value={manager.permissions.userManagement ? 'true' : 'false'}
                onChange={(value) => handlePermissionChange('userManagement', value === 'true')}
                options={[
                  { value: 'true', label: '허용' },
                  { value: 'false', label: '거부' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">매니저 관리</h3>
                <p className="text-sm text-gray-600">다른 매니저 정보 조회 및 관리</p>
              </div>
              <Select
                value={manager.permissions.managerManagement ? 'true' : 'false'}
                onChange={(value) => handlePermissionChange('managerManagement', value === 'true')}
                options={[
                  { value: 'true', label: '허용' },
                  { value: 'false', label: '거부' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">매칭 관리</h3>
                <p className="text-sm text-gray-600">매칭 정보 조회 및 관리</p>
              </div>
              <Select
                value={manager.permissions.matchingManagement ? 'true' : 'false'}
                onChange={(value) => handlePermissionChange('matchingManagement', value === 'true')}
                options={[
                  { value: 'true', label: '허용' },
                  { value: 'false', label: '거부' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">포인트 관리</h3>
                <p className="text-sm text-gray-600">포인트 정보 조회 및 관리</p>
              </div>
              <Select
                value={manager.permissions.pointManagement ? 'true' : 'false'}
                onChange={(value) => handlePermissionChange('pointManagement', value === 'true')}
                options={[
                  { value: 'true', label: '허용' },
                  { value: 'false', label: '거부' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">리뷰 관리</h3>
                <p className="text-sm text-gray-600">리뷰 정보 조회 및 관리</p>
              </div>
              <Select
                value={manager.permissions.reviewManagement ? 'true' : 'false'}
                onChange={(value) => handlePermissionChange('reviewManagement', value === 'true')}
                options={[
                  { value: 'true', label: '허용' },
                  { value: 'false', label: '거부' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">로그 조회</h3>
                <p className="text-sm text-gray-600">시스템 로그 조회</p>
              </div>
              <Select
                value={manager.permissions.logView ? 'true' : 'false'}
                onChange={(value) => handlePermissionChange('logView', value === 'true')}
                options={[
                  { value: 'true', label: '허용' },
                  { value: 'false', label: '거부' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManagerPermissionsPage; 