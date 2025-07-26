import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
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
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

interface MatchingRequestDetail {
  request_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  matched_user_id?: string;
}

// 안전하게 photos 배열 변환 함수
function toPhotoArray(photos: any): string[] {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === 'string') {
    try {
      // JSON 배열 문자열이면 파싱, 아니면 쉼표로 분리
      if (photos.trim().startsWith('[')) return JSON.parse(photos);
      return photos.split(',').map((s) => s.trim()).filter(Boolean);
    } catch {
      return photos.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

// 점수 카드 스타일 컴포넌트 추가
function renderScoreCards(scoreObj: any) {
  if (!scoreObj) return null;
  // const grade = getGradeByScore(scoreObj); // 등급 제거
  const items = [
    { key: 'appearance', label: '외모', emoji: '😍', bg: 'bg-blue-50', value: scoreObj.appearance },
    { key: 'personality', label: '성격', emoji: '💡', bg: 'bg-green-50', value: scoreObj.personality },
    { key: 'job', label: '직업', emoji: '💼', bg: 'bg-purple-50', value: scoreObj.job },
    { key: 'education', label: '학력', emoji: '🎓', bg: 'bg-yellow-50', value: scoreObj.education },
    { key: 'economics', label: '경제력', emoji: '💰', bg: 'bg-pink-50', value: scoreObj.economics },
    { key: 'grade', label: '등급', emoji: '🏅', bg: 'bg-gray-50', value: scoreObj.average_grade || '-' },
  ];
  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {items.map(item => (
        <div key={item.key} className={`flex flex-col items-center w-32 py-4 rounded-xl ${item.bg}`} style={{minWidth:'120px'}}>
          <div className="text-2xl mb-1">{item.emoji}</div>
          <div className="text-sm text-gray-500 mb-1">{item.label}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{item.value ?? '-'}</div>
          {/* 등급(grade) 영역 제거 */}
        </div>
      ))}
    </div>
  );
}

// 레이더 차트 색상 동적 함수
function getRadarChartOptions(userObj: any) {
  let gender = userObj?.profile?.gender || userObj?.gender;
  gender = gender?.toString().trim().replaceAll(' ', '').toLowerCase();
  const isFemale = gender === '여';
  const color = isFemale ? 'rgba(239, 68, 68, 1)' : 'rgba(37, 99, 235, 1)'; // 빨강/파랑
  const bgColor = isFemale ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.2)';
  console.log('gender:', gender, 'isFemale:', isFemale, 'color:', color, 'bgColor:', bgColor);
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { color: '#222', stepSize: 20 },
        pointLabels: { color: '#888', font: { size: 16 } },
        grid: { color: '#e5e7eb' },
      },
    },
    elements: {
      line: { borderColor: color, backgroundColor: bgColor, borderWidth: 2 },
      point: { backgroundColor: color, borderColor: '#fff', radius: 5 },
    },
  };
}

export default function MatchingDetail() {
  const router = useRouter();
  const { requestId } = router.query;
  const { user: authUser } = useAuth();
  const [request, setRequest] = useState<MatchingRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); // 신청자
  const [matchedUser, setMatchedUser] = useState<any>(null); // 매칭 상대
  const [activeTab, setActiveTab] = useState<'score'|'profile'|'ideal'>('score');
  const [rightTab, setRightTab] = useState<'score'|'profile'|'ideal'>('score');
  const [showRecommend, setShowRecommend] = useState(() => {
    // 매칭된 유저가 없으면 추천 후보 목록을 바로 보여줌
    return false;
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCandidate, setModalCandidate] = useState<any>(null);
  // 상태: 사진 인덱스 (각각)
  const [userPhotoIdx, setUserPhotoIdx] = useState(0);
  const [matchedPhotoIdx, setMatchedPhotoIdx] = useState(0);
  const [modalPhotoIdx, setModalPhotoIdx] = useState(0);
  // 상태 추가
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [pendingProposal, setPendingProposal] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]); // 제안 이력 추가
  const [dateAddress, setDateAddress] = useState('');
  const [updatingDateAddress, setUpdatingDateAddress] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!requestId) return;
    // 매칭 요청 정보 fetch
    fetch(`/api/matching-requests/${requestId}`)
      .then(res => res.json())
      .then((data: MatchingRequestDetail) => {
        setRequest(data);
        // 신청자 정보 fetch
        fetch(`/api/users/${data.user_id}`)
          .then(res => res.json())
          .then(res => setUser(res.data?.user || null));
        
        // 매칭 상대 정보 fetch - matched_user_id가 있거나 status가 matched인 경우
        const fetchMatchedUser = async () => {
          let matchedUserId = data.matched_user_id;
          
          // matched_user_id가 없고 MatchPairs에서 confirm_proposed가 true인 경우 찾기
          if (!matchedUserId) {
            try {
              const token = localStorage.getItem('adminToken');
              const matchPairRes = await fetch(`/api/match-pairs?requestId=${requestId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              const matchPairData = await matchPairRes.json();
              if (matchPairData.matchPair && matchPairData.matchPair.confirm_proposed) {
                // 현재 사용자가 match_a_user_id인지 match_b_user_id인지 확인
                if (matchPairData.matchPair.match_a_user_id === data.user_id) {
                  matchedUserId = matchPairData.matchPair.match_b_user_id;
                } else if (matchPairData.matchPair.match_b_user_id === data.user_id) {
                  matchedUserId = matchPairData.matchPair.match_a_user_id;
                }
              }
            } catch (error) {
              console.error('MatchPairs 조회 실패:', error);
            }
          }
          
          if (matchedUserId) {
            try {
              const userRes = await fetch(`/api/users/${matchedUserId}`);
              const userData = await userRes.json();
              setMatchedUser(userData.data?.user || null);
              setShowRecommend(false); // 매칭된 유저가 있으면 추천 후보 목록 숨김
            } catch (error) {
              console.error('매칭된 유저 정보 조회 실패:', error);
              setShowRecommend(true);
            }
          } else {
            setShowRecommend(true); // 매칭된 유저가 없으면 추천 후보 목록 바로 표시
          }
        };
        
        fetchMatchedUser();
        setLoading(false);
      });
  }, [requestId]);

  // 추천 후보 fetch/표시 + proposals fetch
  useEffect(() => {
    if (!requestId || !showRecommend || !user?.user_id) return;
    const fetchData = async () => {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const [recRes, propRes] = await Promise.all([
        fetch(`/api/match-pairs/recommend?requestId=${requestId}`, { headers }),
        fetch(`/api/proposals?userId=${user.user_id}`, { headers }),
      ]);
      const recData = await recRes.json();
      const propData = await propRes.json();
      
      setRecommendations(recData.recommendations || []);
      setProposals(propData.proposals || []); // 제안 이력 저장
      // pending 상태 proposal이 있으면 저장
      const pending = (propData.proposals || []).find((p: any) => p.status === 'pending');
      setPendingProposal(pending || null);
    };
    fetchData();
  }, [requestId, showRecommend, user?.user_id]);

  // 점수 차트 데이터 생성 함수
  const getRadarChartData = (userObj: any) => {
    const score = userObj?.score || userObj?.scores || userObj;
    if (!score) return null;
    let gender = userObj?.profile?.gender || userObj?.gender;
    gender = gender?.toString().trim().replaceAll(' ', '').toLowerCase();
    const isFemale = gender === '여';
    const color = isFemale ? 'rgba(239, 68, 68, 1)' : 'rgba(37, 99, 235, 1)';
    const bgColor = isFemale ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.2)';
    return {
      labels: ['외모', '성격', '직업', '학력', '경제력'],
      datasets: [
        {
          label: '점수',
          data: [
            score.appearance ?? 0,
            score.personality ?? 0,
            score.job ?? 0,
            score.education ?? 0,
            score.economics ?? 0,
          ],
          backgroundColor: bgColor,
          borderColor: color,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointRadius: 5,
        },
      ],
    };
  };

  // 추천 후보 fetch/표시
  const handleRecommend = async () => {
    try {
      setLoadingRecommend(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/match-pairs/recommend', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      const allRecs = data.recommendations || [];
      const newRecsCount = data.newRecommendationsCount || 0;
      
      if (newRecsCount === 0) {
        showToast('더이상 추천할 사람이 없습니다.', 'info');
      } else {
        // 전체 추천 목록으로 상태 업데이트 (중복 제거 및 정렬은 API에서 처리됨)
        setRecommendations(allRecs);
        showToast(`${newRecsCount}명을 추천합니다.`, 'success');
      }
      setShowRecommend(true); // 추천 후보 목록 표시
    } catch (e) {
      console.error('추천 에러:', e);
      showToast('추천 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoadingRecommend(false);
    }
  };

  const handleMatch = async (candidate: any) => {
    if (!candidate || !user) return;
    
    try {
      const response = await fetch(`/api/match-pairs/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestId: requestId,
          candidateId: candidate.user_id
        })
      });

      if (response.ok) {
        showToast('매칭이 성공적으로 완료되었습니다.', 'success');
        // 매칭된 사용자 정보 다시 로드
        window.location.reload();
        setShowRecommend(false);
      } else {
        const error = await response.json();
        showToast(error.message || '매칭 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('매칭 오류:', error);
      showToast('매칭 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleUpdateDateAddress = async () => {
    if (!dateAddress.trim()) {
      showToast('데이트 주소를 입력해주세요.', 'error');
      return;
    }

    setUpdatingDateAddress(true);
    try {
      // 매칭 페어 ID 찾기
      const matchPairsResponse = await fetch('/api/match-pairs');
      if (!matchPairsResponse.ok) {
        throw new Error('매칭 페어 정보를 가져올 수 없습니다.');
      }
      
      const matchPairs = await matchPairsResponse.json();
      const matchPair = matchPairs.find((mp: any) => 
        mp.match_a_id === requestId || mp.match_b_id === requestId
      );

      if (!matchPair) {
        showToast('매칭 페어를 찾을 수 없습니다.', 'error');
        return;
      }

      const response = await fetch(`/api/match-pairs/${matchPair.match_id}/date-address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ date_address: dateAddress })
      });

      if (response.ok) {
        showToast('데이트 주소가 업데이트되었습니다.', 'success');
        setDateAddress('');
        // 데이터 새로고침
        window.location.reload();
      } else {
        const error = await response.json();
        showToast(error.message || '데이트 주소 업데이트 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('데이트 주소 업데이트 오류:', error);
      showToast('데이트 주소 업데이트 중 오류가 발생했습니다.', 'error');
    } finally {
      setUpdatingDateAddress(false);
    }
  };

  // 탭별 내용 렌더링 함수 (user-detail 스타일 참고)
  function renderProfileTab(userObj: any) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-left">
          <div><span className="font-bold text-gray-600 mb-1 block">성별</span><span className="text-gray-800">{userObj?.profile?.gender ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">나이</span><span className="text-gray-800">{userObj?.profile?.birth_date ? (new Date().getFullYear() - userObj.profile.birth_date.year) : '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">직업</span><span className="text-gray-800">{userObj?.profile?.job ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">학력</span><span className="text-gray-800">{userObj?.profile?.education ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">키</span><span className="text-gray-800">{userObj?.profile?.height ?? '-'}cm</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">자산</span><span className="text-gray-800">{userObj?.profile?.asset ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">연봉</span><span className="text-gray-800">{userObj?.profile?.salary ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">MBTI</span><span className="text-gray-800">{userObj?.profile?.mbti ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">종교</span><span className="text-gray-800">{userObj?.profile?.religion ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">지역</span><span className="text-gray-800">{userObj?.profile?.region?.region} {userObj?.profile?.region?.district}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">흡연</span><span className="text-gray-800">{userObj?.profile?.smoking ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">음주</span><span className="text-gray-800">{userObj?.profile?.drinking ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">자녀 희망</span><span className="text-gray-800">{userObj?.profile?.children_desire ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">관심사</span><span className="text-gray-800">{userObj?.profile?.interests?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">체형</span><span className="text-gray-800">{userObj?.profile?.body_type ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">좋아하는 음식</span><span className="text-gray-800">{userObj?.profile?.favorite_foods?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">결혼 계획</span><span className="text-gray-800">{userObj?.profile?.marriage_plans ?? '-'}</span></div>
          <div className="md:col-span-2"><span className="font-bold text-gray-600 mb-1 block">자기소개</span><span className="text-gray-800">{userObj?.profile?.introduction ?? '-'}</span></div>
        </div>
      </div>
    );
  }
     function renderIdealTab(userObj: any) {
     if (!userObj) return <div className="p-6 text-gray-500">사용자 정보가 없습니다.</div>;
     const pref = userObj?.preferences || userObj?.preference || {};
     
     // 안전한 배열 변환 함수
     const safeJoin = (arr: any, separator = ', ') => {
       if (!arr) return '-';
       if (Array.isArray(arr)) return arr.join(separator);
       if (typeof arr === 'string') return arr;
       return '-';
     };
     
     // 안전한 지역 변환 함수
     const safeRegions = (regions: any) => {
       if (!regions) return '-';
       if (Array.isArray(regions)) {
         return regions.map((r: any) => {
           if (typeof r === 'object' && r.region) {
             return `${r.region} ${r.district || ''}`;
           }
           return r;
         }).join(', ');
       }
       return '-';
     };
     
     return (
       <div className="p-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-left">
           <div><span className="font-bold text-gray-600 mb-1 block">선호 지역</span><span className="text-gray-800">{safeRegions(pref?.regions)}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">나이 범위</span><span className="text-gray-800">{pref?.age_range ? `${pref.age_range.min}~${pref.age_range.max}` : '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">키 범위</span><span className="text-gray-800">{pref?.height_range ? `${pref.height_range.min}~${pref.height_range.max}` : '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">직업군</span><span className="text-gray-800">{safeJoin(pref?.job_types)}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">체형</span><span className="text-gray-800">{safeJoin(pref?.body_types)}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">MBTI</span><span className="text-gray-800">{safeJoin(pref?.mbti_types)}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">학력</span><span className="text-gray-800">{safeJoin(pref?.education_levels)}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">결혼 계획</span><span className="text-gray-800">{pref?.marriage_plan ?? '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">종교</span><span className="text-gray-800">{pref?.religion ?? '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">흡연</span><span className="text-gray-800">{pref?.smoking ?? '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">음주</span><span className="text-gray-800">{pref?.drinking ?? '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">관심사</span><span className="text-gray-800">{safeJoin(pref?.interests)}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">자녀 희망</span><span className="text-gray-800">{pref?.children_desire ?? '-'}</span></div>
           <div><span className="font-bold text-gray-600 mb-1 block">우선순위</span><span className="text-gray-800">{Array.isArray(pref?.priority) ? pref.priority.join(' > ') : pref?.priority?.split(',').join(' > ') ?? '-'}</span></div>
         </div>
       </div>
     );
   }

  if (loading || !request || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  // 상단: 매칭 상태 정보 - user-detail 스타일로
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 상단: 매칭 상태 정보 - user-detail 스타일로 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">매칭 상세 정보</h1>
                <p className="text-gray-600">매칭 요청의 상세 정보를 확인할 수 있습니다.</p>
              </div>
              <button 
                onClick={() => router.push('/matching-management')} 
                className="px-4 py-2 bg-white text-black text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                목록 가기
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">📋 매칭 요청 정보</h2>
              <Button
                onClick={handleRecommend}
                disabled={loadingRecommend || !!matchedUser}
                className={`ml-4 inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-3 py-1.5 text-sm cursor-pointer text-xs ${
                  matchedUser 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {loadingRecommend ? '추천 중...' : matchedUser ? '매칭 완료' : '추천'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">신청자 이름</label>
                <p className="text-gray-900">{user?.profile?.name || user?.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' : request.status === 'matched' ? 'bg-green-100 text-green-700' : request.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{request.status === 'waiting' ? '대기중' : request.status === 'matched' ? '매칭됨' : request.status === 'confirmed' ? '확정됨' : request.status}</span>
              </div>
              {matchedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">매칭된 상대</label>
                  <p className="text-gray-900">{matchedUser?.profile?.name || matchedUser?.email}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수정일</label>
                <p className="text-gray-900">{new Date(request.updated_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>

            {/* confirmed 상태일 때 date_address 입력 UI */}
            {request.status === 'confirmed' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📍 데이트 주소 입력</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={dateAddress}
                    onChange={(e) => setDateAddress(e.target.value)}
                    placeholder="예: 서울 강남구 강남대로 396"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleUpdateDateAddress}
                    disabled={updatingDateAddress || !dateAddress.trim()}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      updatingDateAddress || !dateAddress.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {updatingDateAddress ? '업데이트 중...' : '주소 입력'}
                  </Button>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  구체적인 데이트 장소 주소를 입력해주세요. (예: 서울 강남구 강남대로 396)
                </p>
              </div>
            )}
          </div>

          {/* 하단 2단 */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* 왼쪽: 신청자 */}
            <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6 mb-6">
              {/* 상단 이름 */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold text-gray-900">{user?.profile?.name || user?.email}</div>
                {/* 오른쪽은 버튼이지만 왼쪽은 비움(정렬용) */}
                <div style={{width: '180px'}}></div>
              </div>
              {/* 사진, 탭, 점수, 프로필, 이상형 */}
              <div className="flex flex-col items-center mb-4">
                {(() => {
                  const photoArr = toPhotoArray(user?.profile?.photos);
                  return photoArr.length > 0 ? (
                    <>
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 flex flex-col items-center">
                        <img src={photoArr[userPhotoIdx]} alt="프로필 사진" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex justify-center space-x-2 mb-1 mt-3">
                        {photoArr.map((_, idx) => (
                          <button
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${userPhotoIdx === idx ? 'bg-blue-500 scale-110' : 'bg-gray-300'}`}
                            onClick={() => setUserPhotoIdx(idx)}
                            aria-label={`사진 ${idx+1}번 보기`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-gray-200 flex items-center justify-center mb-2">사진 없음</div>
                  );
                })()}
              </div>
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button onClick={() => setActiveTab('score')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab==='score' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>점수</button>
                  <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab==='profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>프로필</button>
                  <button onClick={() => setActiveTab('ideal')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab==='ideal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>이상형</button>
                </nav>
              </div>
              {activeTab === 'score' && (
                <>
                  {/* 레이더 차트 먼저 */}
                  <div>
                    {getRadarChartData(user) ? (
                      <Radar data={getRadarChartData(user)} options={getRadarChartOptions(user)} height={250} />
                    ) : (
                      <div className="text-gray-500 text-center py-8">점수 데이터가 없습니다.</div>
                    )}
                  </div>
                                     {/* 점수 카드 아래 */}
                   {renderScoreCards(user?.score || user?.scores || user)}
                </>
              )}
              {activeTab === 'profile' && renderProfileTab(user)}
              {activeTab === 'ideal' && renderIdealTab(user)}
            </div>

            {/* 오른쪽: 매칭 상대 or 추천 */}
            <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6 mb-6">
              {matchedUser ? (
                <>
                  {/* 상단 이름 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold text-gray-900">{matchedUser?.profile?.name || matchedUser?.email}</div>
                    <div className="text-sm text-green-600 font-medium">매칭된 상대</div>
                  </div>
                  {/* 사진, 탭, 점수, 프로필, 이상형 */}
                  <div className="flex flex-col items-center mb-4">
                    {(() => {
                      const photoArr = toPhotoArray(matchedUser?.profile?.photos);
                      return photoArr.length > 0 ? (
                        <>
                          <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 flex flex-col items-center">
                            <img src={photoArr[matchedPhotoIdx]} alt="프로필 사진" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex justify-center space-x-2 mb-1 mt-3">
                            {photoArr.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${matchedPhotoIdx === idx ? 'bg-blue-500 scale-110' : 'bg-gray-300'}`}
                                onClick={() => setMatchedPhotoIdx(idx)}
                                aria-label={`사진 ${idx+1}번 보기`}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-gray-200 flex items-center justify-center mb-2">사진 없음</div>
                      );
                    })()}
                  </div>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                      <button onClick={() => setRightTab('score')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='score' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>점수</button>
                      <button onClick={() => setRightTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>프로필</button>
                      <button onClick={() => setRightTab('ideal')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='ideal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>이상형</button>
                    </nav>
                  </div>
                  {rightTab === 'score' && (
                    <>
                      {/* 레이더 차트 먼저 */}
                      <div>
                        {getRadarChartData(matchedUser) ? (
                          <Radar data={getRadarChartData(matchedUser)} options={getRadarChartOptions(matchedUser)} height={250} />
                        ) : (
                          <div className="text-gray-500 text-center py-8">점수 데이터가 없습니다.</div>
                        )}
                      </div>
                      {/* 점수 카드 아래 */}
                      {renderScoreCards(matchedUser?.score || matchedUser?.scores || matchedUser)}
                    </>
                  )}
                  {rightTab === 'profile' && renderProfileTab(matchedUser)}
                  {rightTab === 'ideal' && renderIdealTab(matchedUser)}
                </>
              ) : selectedCandidate ? (
                <>
                  {/* 상단 이름+버튼 한 줄 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold text-gray-900">{selectedCandidate?.profile?.name || selectedCandidate?.email}</div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        className="h-7 py-0 text-sm align-middle bg-blue-500 text-white rounded-lg px-3 font-bold hover:bg-blue-600 transition-colors"
                        onClick={() => handleMatch(selectedCandidate)}
                      >
                        매칭
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 py-0 ml-2 text-sm align-middle border border-gray-300 bg-white text-black rounded-lg px-3 font-bold hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedCandidate(null)}
                      >
                        후보목록
                      </Button>
                    </div>
                  </div>
                  {/* 사진, 탭, 점수, 프로필, 이상형 */}
                  <div className="flex flex-col items-center mb-4">
                    {(() => {
                      const photoArr = toPhotoArray(selectedCandidate?.profile?.photos);
                      return photoArr.length > 0 ? (
                        <>
                          <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 flex flex-col items-center">
                            <img src={photoArr[modalPhotoIdx]} alt="프로필 사진" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex justify-center space-x-2 mb-1 mt-3">
                            {photoArr.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${modalPhotoIdx === idx ? 'bg-blue-500 scale-110' : 'bg-gray-300'}`}
                                onClick={() => setModalPhotoIdx(idx)}
                                aria-label={`사진 ${idx+1}번 보기`}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-gray-200 flex items-center justify-center mb-2">사진 없음</div>
                      );
                    })()}
                  </div>
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                      <button onClick={() => setRightTab('score')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='score' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>점수</button>
                      <button onClick={() => setRightTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>프로필</button>
                      <button onClick={() => setRightTab('ideal')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='ideal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>이상형</button>
                    </nav>
                  </div>
                  {rightTab === 'score' && (
                    <>
                      {/* 레이더 차트 먼저 */}
                      <div>
                        {getRadarChartData(selectedCandidate) ? (
                          <Radar data={getRadarChartData(selectedCandidate)} options={getRadarChartOptions(selectedCandidate)} height={250} />
                        ) : (
                          <div className="text-gray-500 text-center py-8">점수 데이터가 없습니다.</div>
                        )}
                      </div>
                                             {/* 점수 카드 아래 */}
                       {renderScoreCards(selectedCandidate?.score || selectedCandidate?.scores || selectedCandidate)}
                    </>
                  )}
                  {rightTab === 'profile' && renderProfileTab(selectedCandidate)}
                  {rightTab === 'ideal' && renderIdealTab(selectedCandidate)}
                </>
              ) : (
                <>
                  {showRecommend && !matchedUser && (
                    <>
                      <div className="font-bold text-xl text-gray-900 mb-4">추천 후보 목록</div>
                      {pendingProposal ? (
                        <div className="mb-4 text-center text-blue-500 font-semibold">고객에게 소개팅 제안 중입니다.</div>
                      ) : null}
                      <div className={pendingProposal ? 'opacity-50 pointer-events-none' : ''}>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead>
                            <tr>
                              <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-3 text-left">이름</th>
                              <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-3 text-left">등급</th>
                              <th className="bg-gray-50 text-gray-700 font-semibold px-6 py-3 text-left">상세</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recommendations.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-center text-gray-400 py-12">추천 후보가 없습니다.</td>
                              </tr>
                            ) : (
                              recommendations.map((rec, i) => {
                                const name = rec.profile?.name;
                                const grade = rec.score?.average_grade;
                                
                                // 이미 제안된 사용자인지 확인 (Proposals 테이블 기준)
                                const isAlreadyProposed = proposals.some((p: any) => 
                                  p.target_id === user?.user_id && 
                                  p.propose_user_id === rec.user_id && 
                                  p.status !== 'refused'
                                );
                                
                                // 등급 뱃지 색상
                                const gradeColor = {
                                  S: 'bg-yellow-400 text-black',
                                  A: 'bg-blue-400 text-white',
                                  B: 'bg-green-400 text-white',
                                  C: 'bg-gray-300 text-black',
                                  D: 'bg-orange-300 text-black',
                                  E: 'bg-pink-200 text-black',
                                  F: 'bg-gray-200 text-black',
                                  '-': 'bg-gray-100 text-gray-400',
                                }[grade] || 'bg-gray-100 text-gray-400';
                                
                                return (
                                  <tr key={rec.user_id || `rec-${i}`} className={`border-b ${isAlreadyProposed ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-3">
                                      <div className="flex items-center space-x-3">
                                        <span className={`font-semibold ${isAlreadyProposed ? 'text-gray-500' : 'text-gray-900'}`}>
                                          {name}
                                          {isAlreadyProposed && <span className="ml-2 text-xs text-gray-400">(이미 제안됨)</span>}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${gradeColor}`}>{grade}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <Button 
                                        size="sm" 
                                        className={`h-7 py-0 ml-2 text-sm align-middle border border-gray-300 rounded-lg px-3 font-bold transition-colors ${
                                          isAlreadyProposed || pendingProposal
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-black hover:bg-gray-50'
                                        }`}
                                        onClick={() => !isAlreadyProposed && !pendingProposal && setSelectedCandidate(rec)}
                                        disabled={isAlreadyProposed || pendingProposal}
                                      >
                                        {isAlreadyProposed ? '제안됨' : pendingProposal ? '대기중' : '보기'}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}