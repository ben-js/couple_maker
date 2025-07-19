import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  UsersIcon, 
  HeartIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalPoints: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface ChartDataItem {
  name: string;
  가입수: number;
  매칭요청수: number;
  매칭수: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    totalPoints: 0,
    totalRevenue: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    console.log('대시보드 통계 로드 시작');
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/dashboard/stats', {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        console.log('대시보드 통계 로드 성공:', data);
        setStats(data);
      } else {
        console.error('대시보드 통계 로드 실패:', response.status);
        showToast('통계 데이터를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      showToast('통계 데이터 로딩 중 오류가 발생했습니다.', 'error');
    } finally {
      // 통계 데이터 로드 완료 시 로딩 해제
      console.log('대시보드 통계 로드 완료, 로딩 해제');
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    console.log('대시보드 최근 활동 로드 시작');
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/dashboard/activities', {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        console.log('대시보드 최근 활동 로드 성공:', data);
        setRecentActivities(data);
      } else {
        console.error('대시보드 최근 활동 로드 실패:', response.status);
        showToast('최근 활동을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('최근 활동 로딩 중 오류가 발생했습니다.', 'error');
    } finally {
      // 최근 활동 로드 완료 시 로딩 해제
      console.log('대시보드 최근 활동 로드 완료, 로딩 해제');
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/dashboard/chart-data?period=${selectedPeriod}`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      } else {
        showToast('차트 데이터를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      showToast('차트 데이터 로딩 중 오류가 발생했습니다.', 'error');
    }
  };

  useEffect(() => {
    // 데이터 로드 시작
    loadStats();
    loadRecentActivities();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  useEffect(() => {
    loadChartData();
  }, [selectedPeriod]); // selectedPeriod 변경 시에만 차트 데이터 로드

  // Chart.js 형식으로 데이터 변환
  const getChartData = () => {
    if (!chartData || chartData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    return {
      labels: chartData.map(item => item.name),
      datasets: [
        {
          label: '가입수',
          data: chartData.map(item => item.가입수),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: '매칭요청수',
          data: chartData.map(item => item.매칭요청수),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: '매칭수',
          data: chartData.map(item => item.매칭수),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return '최근 7일';
      case '30d': return '최근 30일';
      case '90d': return '최근 90일';
      default: return '최근 7일';
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.period-dropdown')) {
        setShowPeriodDropdown(false);
      }
    };

    if (showPeriodDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPeriodDropdown]);

  console.log('대시보드 렌더링, loading:', loading, 'stats:', stats, 'recentActivities:', recentActivities.length);

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
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              대시보드
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Date Sense 관리자 패널에 오신 것을 환영합니다.
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 사용자</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalUsers || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <HeartIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 매칭</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalMatches || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 포인트</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalPoints || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 수익</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₩{(stats.totalRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">활성 사용자</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.activeUsers || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">사용자 활동</h3>
                
                {/* 이미지 스타일 셀렉트 박스 */}
                <div className="relative period-dropdown">
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>{getPeriodLabel(selectedPeriod)}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {showPeriodDropdown && (
                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedPeriod('7d');
                            setShowPeriodDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            selectedPeriod === '7d' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          최근 7일
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPeriod('30d');
                            setShowPeriodDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            selectedPeriod === '30d' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          최근 30일
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPeriod('90d');
                            setShowPeriodDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            selectedPeriod === '90d' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          최근 90일
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 실제 차트 */}
              <div className="h-64">
                {chartData && chartData.length > 0 ? (
                  <Bar
                    data={getChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    차트 데이터를 불러오는 중...
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">최근 활동</h3>
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 