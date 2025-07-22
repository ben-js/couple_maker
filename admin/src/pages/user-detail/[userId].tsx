import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { ScoreResult } from '../../types/score';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
import Layout from '../../components/Layout'; // Added missing import
import Button from '../../components/common/Button';
import { calculateAppearanceScore, calculatePersonalityScore, calculateJobScore, calculateEducationScore, calculateEconomicsScore } from '../../lib/score';
import { ScoreInput } from '../../types/score';
import Select from '../../components/common/Select';
import { User } from '../../types';
import Input from '../../components/common/Input';
import { PhotoIcon, UserCircleIcon, HeartIcon, SparklesIcon, UserGroupIcon, CakeIcon, StarIcon } from '@heroicons/react/24/outline';
import { normalizeJob, parseSalary, parseAsset } from '../../lib/score/scoreMappings';
import Modal from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

// --- 유틸 함수 직접 정의 (linter 에러 방지) ---
function formatDate(dateString: string) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('ko-KR');
}

function getStatusName(status: string) {
  const statusNames: Record<string, string> = {
    'active': '활성',
    'inactive': '비활성',
    'suspended': '정지',
    'black': '블랙',
    'green': '활성',
    'yellow': '비활성',
    'red': '정지',
  };
  return statusNames[status] || status;
}

function getGradeName(grade: string) {
  const gradeNames: Record<string, string> = {
    'silver': '실버',
    'gold': '골드',
    'premium': '프리미엄',
    'general': '일반',
    'excellent': '우수',
    'vip': 'VIP',
    'vvip': 'VVIP',
  };
  return gradeNames[grade] || grade;
}

function StarRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex">
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const half = starValue - 0.5;
        return (
          <span key={i} className="relative w-7 h-7">
            {/* 왼쪽(0.5점) 클릭 */}
            <button
              type="button"
              className="absolute left-0 top-0 w-1/2 h-full z-10"
              onClick={() => onChange(half)}
              aria-label={`${half}점`}
              style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
            />
            {/* 오른쪽(1점) 클릭 */}
            <button
              type="button"
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              onClick={() => onChange(starValue)}
              aria-label={`${starValue}점`}
              style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
            />
            {/* 별 SVG (채워진 부분) */}
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full"
              fill={value >= starValue ? '#facc15' : value >= half ? 'url(#half-gradient)' : 'none'}
              stroke="#d1d5db"
            >
              <defs>
                <linearGradient id="half-gradient">
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <polygon
                points="12,2 15,9 22,9 17,14 18,21 12,17 6,21 7,14 2,9 9,9"
                strokeWidth="2"
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

export default function UserDetail() {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [scores, setScores] = useState<ScoreResult[]>([]);
  const [matchingHistory, setMatchingHistory] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]); // 리뷰 이력 상태 추가
  const [reviews, setReviews] = useState<any[]>([]);
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'ideal' | 'scoreHistory' | 'statusHistory' | 'matchingHistory' | 'reviewHistory' | 'pointHistory'>('profile');
  const [scoreForm, setScoreForm] = useState({
    faceScore: '', // 얼굴 점수만 입력
    summary: '',
  });
  const [autoScore, setAutoScore] = useState<any | null>(null);
  const [savingScore, setSavingScore] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const { showToast } = useToast();
  const { user: managerUser } = useAuth();
  const fetchScoreHistoryRef = useRef<() => Promise<void>>();

  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([
        loadUserDetail(),
        loadStatusHistory()
      ]).finally(() => setLoading(false));
    }
  }, [userId]);

  // 점수 이력이 없고, 프로필/이상형 데이터가 있으면 자동 계산
  useEffect(() => {
    if (profile && preferences) {
      let faceScoreNum = Number(scoreForm.faceScore);
      if (isNaN(faceScoreNum)) faceScoreNum = 0;
      const input: ScoreInput = {
        gender: profile.gender,
        faceScore: faceScoreNum > 5 ? faceScoreNum : faceScoreNum * 20,
        height: Number(profile.height),
        bodyType: profile.body_type,
        age: profile.birth_date ? (new Date().getFullYear() - profile.birth_date.year) : 30,
        personalityPriority: preferences?.priority_personality || 1,
        valuePriority: preferences?.priority_value || 1,
        isSmoker: profile.smoking === '흡연',
        hobby: profile.interests?.[0] || '',
        wantChild: profile.children_desire === '자녀 희망',
        mbti: profile.mbti,
        job: normalizeJob(profile.job),
        salary: parseSalary(profile.salary),
        education: profile.education,
        asset: parseAsset(profile.asset),
      };
      console.log('점수계산 input(useEffect):', input);
      const appearance = calculateAppearanceScore(input);
      const personality = calculatePersonalityScore(input);
      const job = calculateJobScore(input);
      const education = calculateEducationScore(input);
      const economics = calculateEconomicsScore(input);
      setAutoScore({ appearance, personality, job, education, economics });
    }
  }, [profile, preferences]);

  // 점수 이력 조회
  useEffect(() => {
    async function fetchScoreHistory() {
      if (!userId) return;
      const res = await fetch(`/api/score-history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setScoreHistory(data.items || []);
      }
    }
    fetchScoreHistoryRef.current = fetchScoreHistory;
    fetchScoreHistory();
  }, [userId]);

  // 각 이력 조회 useEffect 추가
  useEffect(() => {
    async function fetchMatchingHistory() {
      if (!userId) return;
      const res = await fetch(`/api/users/${userId}/matching-history`);
      if (res.ok) {
        const data = await res.json();
        setMatchingHistory(data.items || []);
      }
    }
    fetchMatchingHistory();
  }, [userId]);
  useEffect(() => {
    async function fetchReviewHistory() {
      if (!userId) return;
      const res = await fetch(`/api/users/${userId}/review-history`);
      if (res.ok) {
        const data = await res.json();
        setReviewHistory(data.items || []);
      }
    }
    fetchReviewHistory();
  }, [userId]);
  useEffect(() => {
    async function fetchPointHistory() {
      if (!userId) return;
      const res = await fetch(`/api/users/${userId}/point-history`);
      if (res.ok) {
        const data = await res.json();
        setPointHistory(data.items || []);
      }
    }
    fetchPointHistory();
  }, [userId]);

  // 프로필/이상형 데이터도 불러오기
  const loadUserDetail = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const result = await res.json();
        setUser(result.data.user);
        setMatchingHistory(result.data.matchingHistory || []);
        setReviews(result.data.reviews || []);
        setPointHistory(result.data.pointHistory || []);
        setProfile(result.data.user.profile || null);
        setPreferences(result.data.user.preferences || null);
      }
    } catch (e) {
      setUser(null);
    }
  };

  // 상태/등급 히스토리 불러오기
  const loadStatusHistory = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/status-history`);
      if (res.ok) {
        const result = await res.json();
        setStatusHistory(result.history || []);
      }
    } catch (e) {
      setStatusHistory([]);
    }
  };

  // scoreHistory에서 최신 점수 추출
  const latestScoreData = scoreHistory && scoreHistory.length > 0 ? scoreHistory[0] : null;
  const radarChartData = latestScoreData ? {
    labels: ['외모', '성격', '직업', '학력', '경제력'],
    datasets: [
      {
        label: '점수',
        data: [
          latestScoreData.appearance ?? 0,
          latestScoreData.personality ?? 0,
          latestScoreData.job ?? 0,
          latestScoreData.education ?? 0,
          latestScoreData.economics ?? 0,
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointRadius: 5,
      },
    ],
  } : null;

  // 점수 입력/수정 핸들러
  const handleScoreInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScoreForm(prev => {
      const updated = { ...prev, [name]: value };
      // 얼굴 점수 입력 시 자동 계산 트리거
      if (name === 'faceScore') {
        let faceScoreNum = Number(value);
        if (!isNaN(faceScoreNum) && faceScoreNum > 0) {
          // 최신값으로 자동 계산
          let input: ScoreInput = {
            gender: profile?.gender || '남',
            faceScore: faceScoreNum > 5 ? faceScoreNum : faceScoreNum * 20,
            height: Number(profile?.height) || 0,
            bodyType: profile?.body_type || '',
            age: profile?.birth_date ? (new Date().getFullYear() - profile.birth_date.year) : 30,
            personalityPriority: preferences?.priority_personality || 1,
            valuePriority: preferences?.priority_value || 1,
            isSmoker: profile?.smoking === '흡연',
            hobby: profile?.interests?.[0] || '',
            wantChild: profile?.children_desire === '자녀 희망',
            mbti: profile?.mbti || '',
            job: normalizeJob(profile?.job || ''),
            salary: parseSalary(profile?.salary || 0),
            education: profile?.education || '',
            asset: parseAsset(profile?.asset || 0),
          };
          setAutoScore({
            appearance: calculateAppearanceScore(input),
            personality: calculatePersonalityScore(input),
            job: calculateJobScore(input),
            education: calculateEducationScore(input),
            economics: calculateEconomicsScore(input),
          });
        }
      }
      return updated;
    });
  };

  // 자동 계산 핸들러
  const handleAutoScore = () => {
    if (!profile) return;
    let faceScoreNum = Number(scoreForm.faceScore);
    if (isNaN(faceScoreNum) || faceScoreNum === 0) {
      alert('얼굴점수를 입력해 주세요!');
      return;
    }
    const input: ScoreInput = {
      gender: profile.gender,
      faceScore: faceScoreNum > 5 ? faceScoreNum : faceScoreNum * 20,
      height: Number(profile.height),
      bodyType: profile.body_type,
      age: profile.birth_date ? (new Date().getFullYear() - profile.birth_date.year) : 30,
      personalityPriority: preferences?.priority_personality || 1,
      valuePriority: preferences?.priority_value || 1,
      isSmoker: profile.smoking === '흡연',
      hobby: profile.interests?.[0] || '',
      wantChild: profile.children_desire === '자녀 희망',
      mbti: profile.mbti,
      job: normalizeJob(profile.job),
      salary: parseSalary(profile.salary),
      education: profile.education,
      asset: parseAsset(profile.asset),
    };
    console.log('점수계산 input(handleAutoScore):', input);
    const appearance = calculateAppearanceScore(input);
    const personality = calculatePersonalityScore(input);
    const job = calculateJobScore(input);
    const education = calculateEducationScore(input);
    const economics = calculateEconomicsScore(input);
    setAutoScore({ appearance, personality, job, education, economics });
  };

  // 점수 저장 핸들러
  const handleSaveScore = async () => {
    if (!user || !autoScore) return;
    let faceScoreNum = Number(scoreForm.faceScore);
    if (isNaN(faceScoreNum) || faceScoreNum === 0) {
      alert('얼굴점수를 입력해 주세요!');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setSavingScore(true);
    try {
      await fetch(`/api/users/${userId}/scores`, {
        method: 'PUT', // 반드시 PUT이어야 함
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceScoreInput: scoreForm.faceScore, // 5점 만점 원본값
          summary: scoreForm.summary,
          // appearance 계산 시 faceScore를 100점 환산해서 넘김
          appearance: calculateAppearanceScore({
            ...profile,
            ...preferences,
            faceScore: Number(scoreForm.faceScore) * 20,
            height: Number(profile?.height) || 0,
            bodyType: profile?.body_type || '',
            age: profile?.birth_date ? (new Date().getFullYear() - profile.birth_date.year) : 30,
          }),
          personality: autoScore.personality,
          job: autoScore.job,
          education: autoScore.education,
          economics: autoScore.economics,
          managerName: managerUser?.name || managerUser?.email || 'unknown',
        })
      });
      setScoreForm({ faceScore: '', summary: '' });
      setAutoScore(null);
      await loadUserDetail();
      if (fetchScoreHistoryRef.current) await fetchScoreHistoryRef.current(); // 점수 이력 즉시 갱신
      showToast('저장이 완료되었습니다.', 'success');
    } finally {
      setSavingScore(false);
    }
  };

  const handleEditStart = () => {
    setEditStatus(user?.status || '');
    setEditGrade(user?.grade || '');
    setIsEditing(true);
  };
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditStatus('');
    setEditGrade('');
  };
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 상태/등급 업데이트 API 호출 예시
      await fetch(`/api/users/${user.user_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus })
      });
      await fetch(`/api/users/${user.user_id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: editGrade })
      });
      setIsEditing(false);
      await loadUserDetail();
    } finally {
      setSaving(false);
    }
  };

  // 카드 점수 표시용 객체: 저장된 점수(user.scores) 우선, 없으면 autoScore
  const displayScore = user?.scores || autoScore;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 사용자 상세 타이틀 */}
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
          {/* 기본 정보 카드 (필드명 실제값 적용) */}
          {user && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">📋 기본 정보</h2>
                {!isEditing ? (
                  <Button
                    onClick={handleEditStart}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <p className="text-gray-900">{profile.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                  <p className="text-gray-900">{formatDate(user.created_at)}</p>
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusName(user.status) === '활성' ? 'bg-green-100 text-green-700' : getStatusName(user.status) === '비활성' ? 'bg-yellow-100 text-yellow-700' : getStatusName(user.status) === '정지' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {getStatusName(user.status)}
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeName(user.grade) === 'VIP' ? 'bg-orange-100 text-orange-700' : getGradeName(user.grade) === '실버' ? 'bg-gray-100 text-gray-700' : getGradeName(user.grade) === '골드' ? 'bg-yellow-100 text-yellow-700' : getGradeName(user.grade) === '프리미엄' ? 'bg-purple-100 text-purple-700' : getGradeName(user.grade) === '우수' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {getGradeName(user.grade)}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">포인트</label>
                  <p className="text-2xl font-bold text-blue-600">{user.points?.toLocaleString()} P</p>
                </div>
              </div>
            </div>
          )}

          {/* 점수 카드 */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">점수 이력 및 프로필 사진</h3>
            </div>
            {/* RadarChart + 프로필 사진을 항상 나란히 */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              <div className="w-full md:w-1/2 flex flex-col items-center">
                {profile && Array.isArray(profile.photos) && profile.photos.length > 0 ? (
                  <>
                    <img
                      src={profile.photos[currentPhotoIndex]}
                      alt={`사용자 사진 ${currentPhotoIndex + 1}`}
                      className="w-full h-auto max-h-96 object-contain bg-white rounded-xl shadow"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzExMC40NTcgMTEwIDExOSAxMDEuNDU3IDExOSA5MUMxMTkgODAuNTQzIDExMC40NTcgNzIgMTAwIDcyQzg5LjU0MyA3MiA4MSA4MC41NDMgODEgOTFDODEgMTAxLjQ1NyA4OS41NDMgMTEwIDEwMCAxMTBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xMDAgMTI4Qzc4LjM0MzEgMTI4IDYxIDExMC42NTcgNjEgODlDNjEgNjcuMzQzMSA3OC4zNDMxIDUwIDEwMCA1MEMxMjEuNjU3IDUwIDEzOSA2Ny4zNDMxIDEzOSA4OUMxMzkgMTEwLjY1NyAxMjEuNjU3IDEyOCAxMDAgMTI4WiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K";
                      }}
                    />
                    {/* 이미지 인디케이터 (동그라미) */}
                    <div className="flex justify-center space-x-2 mb-1 mt-3">
                      {profile.photos.map((photo: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 bg-blue-500 ${index === currentPhotoIndex ? 'scale-110' : 'opacity-40'}`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <PhotoIcon className="mx-auto h-32 w-32 text-gray-300" />
                )}
              </div>
              <div className="w-full md:w-1/2">
                {radarChartData ? (
                  <Radar
                    data={radarChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true },
                      },
                      scales: {
                        r: {
                          min: 0,
                          max: 100,
                          ticks: { color: '#222', stepSize: 20 },
                          pointLabels: { color: '#888', font: { size: 16 } },
                          grid: { color: '#e5e7eb' },
                        },
                      },
                    }}
                    height={300}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-4">점수 데이터가 없습니다.</p>
                )}
              </div>
            </div>
            {/* 점수 입력/수정 카드형 폼 */}
            <div className="rounded-lg p-4">
              <div className="flex gap-2 mb-6 w-full items-center">
                {/* 별점 + 점수 + 메모/사유 + 저장 */}
                <div className="flex items-center flex-1 min-w-0 whitespace-nowrap">
                  <StarRating value={scoreForm.faceScore} onChange={v => setScoreForm(f => ({ ...f, faceScore: v }))} />
                  <span className="ml-4 mr-2 text-gray-500">
                    {Number(scoreForm.faceScore) > 0 ? scoreForm.faceScore : <span className="invisible">0</span>} / 5점
                  </span>
                  <div className="flex w-full max-w-[600px] ml-4"> {/* 5점과 인풋박스 사이 마진 */}
                    <Input
                      name="summary"
                      value={scoreForm.summary}
                      onChange={handleScoreInput}
                      placeholder="메모/사유를 작성해주세요"
                      className="rounded-l-md rounded-r-none border border-gray-300 border-r-0 focus:ring-blue-500 focus:border-blue-500 w-full py-2 text-sm bg-white text-black" // 배경 흰색, 텍스트 검정
                    />
                    <Button
                      onClick={handleSaveScore}
                      disabled={savingScore || !autoScore || !scoreForm.faceScore || !scoreForm.summary}
                      className="rounded-r-md rounded-l-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 border border-blue-600 border-l-0 transition-colors whitespace-nowrap"
                    >
                      {savingScore ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center">😃<div className="text-sm text-gray-700">외모</div><div className="text-xl font-bold text-black">{displayScore?.appearance ?? '-'}</div></div>
                <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">💡<div className="text-sm text-gray-700">성격</div><div className="text-xl font-bold text-black">{displayScore?.personality ?? '-'}</div></div>
                <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">💼<div className="text-sm text-gray-700">직업</div><div className="text-xl font-bold text-black">{displayScore?.job ?? '-'}</div></div>
                <div className="bg-yellow-50 rounded-lg p-4 flex flex-col items-center">🎓<div className="text-sm text-gray-700">학력</div><div className="text-xl font-bold text-black">{displayScore?.education ?? '-'}</div></div>
                <div className="bg-pink-50 rounded-lg p-4 flex flex-col items-center">💰<div className="text-sm text-gray-700">경제력</div><div className="text-xl font-bold text-black">{displayScore?.economics ?? '-'}</div></div>
              </div>
              {/* 기존 점수 저장 버튼 제거 */}
            </div>
          </div>

          {/* 히스토리 탭 */}
          <div className="bg-white rounded-lg shadow">
            {/* 탭 UI */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>프로필</button>
                <button onClick={() => setActiveTab('ideal')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ideal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>이상형</button>
                <button onClick={() => setActiveTab('scoreHistory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scoreHistory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>점수 이력 ({scoreHistory.length})</button>
                <button onClick={() => setActiveTab('statusHistory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'statusHistory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>상태/등급 이력 ({statusHistory.length})</button>
                <button onClick={() => setActiveTab('matchingHistory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'matchingHistory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>매칭 이력 ({matchingHistory.length})</button>
                <button onClick={() => setActiveTab('reviewHistory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviewHistory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>리뷰 이력 ({reviewHistory.length})</button>
                <button onClick={() => setActiveTab('pointHistory')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pointHistory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>포인트 이력 ({pointHistory.length})</button>
              </nav>
            </div>
            {/* 탭별 렌더링 */}
            {activeTab === 'profile' && (
              <div className="p-8 pl-8">
                <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-left">
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">성별</span><span className="text-gray-800">{profile?.gender ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">나이</span><span className="text-gray-800">{profile?.birth_date ? (new Date().getFullYear() - profile.birth_date.year) : '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">직업</span><span className="text-gray-800">{profile?.job ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">학력</span><span className="text-gray-800">{profile?.education ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">키</span><span className="text-gray-800">{profile?.height ?? '-'}cm</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">자산</span><span className="text-gray-800">{profile?.asset ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">연봉</span><span className="text-gray-800">{profile?.salary ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">MBTI</span><span className="text-gray-800">{profile?.mbti ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">종교</span><span className="text-gray-800">{profile?.religion ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">지역</span><span className="text-gray-800">{profile?.region?.region} {profile?.region?.district}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">흡연</span><span className="text-gray-800">{profile?.smoking ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">음주</span><span className="text-gray-800">{profile?.drinking ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">자녀 희망</span><span className="text-gray-800">{profile?.children_desire ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">관심사</span><span className="text-gray-800">{profile?.interests?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">체형</span><span className="text-gray-800">{profile?.body_type ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">좋아하는 음식</span><span className="text-gray-800">{profile?.favorite_foods?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">결혼 계획</span><span className="text-gray-800">{profile?.marriage_plans ?? '-'}</span></div>
                  <div className="flex flex-col col-span-3"><span className="font-bold text-gray-600 mb-1">자기소개</span><span className="text-gray-800">{profile?.introduction ?? '-'}</span></div>
                </div>
              </div>
            )}
            {activeTab === 'ideal' && (
              <div className="p-8 pl-8">
                <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-left">
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">선호 지역</span><span className="text-gray-800">{preferences?.regions?.map(r => `${r.region} ${r.district}`).join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">추가 지역</span><span className="text-gray-800">{preferences?.locations?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">나이 범위</span><span className="text-gray-800">{preferences?.age_range ? `${preferences.age_range.min}~${preferences.age_range.max}` : '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">키 범위</span><span className="text-gray-800">{preferences?.height_range ? `${preferences.height_range.min}~${preferences.height_range.max}` : '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">직업군</span><span className="text-gray-800">{preferences?.job_types?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">체형</span><span className="text-gray-800">{preferences?.body_types?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">MBTI</span><span className="text-gray-800">{preferences?.mbti_types?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">학력</span><span className="text-gray-800">{preferences?.education_levels?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">결혼 계획</span><span className="text-gray-800">{preferences?.marriage_plan ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">선호 성별</span><span className="text-gray-800">{preferences?.preferred_gender ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">종교</span><span className="text-gray-800">{preferences?.religion ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">흡연</span><span className="text-gray-800">{preferences?.smoking ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">음주</span><span className="text-gray-800">{preferences?.drinking ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">관심사</span><span className="text-gray-800">{preferences?.interests?.join(', ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">우선순위</span><span className="text-gray-800">{Array.isArray(preferences?.priority)
  ? preferences.priority.join(' > ')
  : preferences?.priority?.split(',').join(' > ') ?? '-'}</span></div>
                  <div className="flex flex-col"><span className="font-bold text-gray-600 mb-1">자녀 희망</span><span className="text-gray-800">{preferences?.children_desire ?? '-'}</span></div>
                </div>
              </div>
            )}
            {activeTab === 'scoreHistory' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">점수 이력</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">얼굴</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">외모</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">성격</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">직업</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">학력</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">경제력</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">평균</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">관리자</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scoreHistory.map((s, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.created_at ? s.created_at.slice(0, 10) : '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.face_score ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.appearance ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.personality ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.job ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.education ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.economics ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.average ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.averageGrade ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.reason ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.manager_id ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'statusHistory' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">상태/등급 이력</h3>
                {statusHistory.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사유</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statusHistory.map((h, i) => (
                        <tr key={i}>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{h.timestamp ? h.timestamp.slice(0, 10) : '-'}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{h.status ?? '-'}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{h.grade ?? '-'}</td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{h.reason ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-4">상태/등급 이력이 없습니다.</p>
                )}
              </div>
            )}
            {activeTab === 'matchingHistory' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">매칭 이력</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">매칭ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">상대ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matchingHistory.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{m.created_at ? m.created_at.slice(0, 10) : '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{m.match_id ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{m.partner_id ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{m.status ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'reviewHistory' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">리뷰 이력</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">리뷰ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">내용</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviewHistory.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{r.created_at ? r.created_at.slice(0, 10) : '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{r.review_id ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{r.content ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{r.rating ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === 'pointHistory' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">포인트 이력</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">포인트</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pointHistory.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.created_at ? p.created_at.slice(0, 10) : '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.amount ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.type ?? '-'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.description ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 사진 모달 ... */}
        </div>
      </div>
      {showConfirmModal && (
        <Modal isOpen={true} onClose={() => setShowConfirmModal(false)}>
          <div className="p-6 text-center">
            <div className="mb-4 text-lg font-semibold text-black">점수를 입력하시겠습니까?</div>
            <div className="flex justify-center gap-4 mt-6">
              <Button onClick={handleConfirmSave} className="bg-blue-600 text-white px-6 py-2 rounded">예</Button>
              <Button onClick={() => setShowConfirmModal(false)} className="bg-gray-300 text-gray-700 px-6 py-2 rounded">아니오</Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
} 