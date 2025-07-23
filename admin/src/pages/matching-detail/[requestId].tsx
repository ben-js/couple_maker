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

export default function MatchingDetail() {
  const router = useRouter();
  const { requestId } = router.query;
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
        // 매칭 상대 정보 fetch(있으면)
        if (data.matched_user_id) {
          fetch(`/api/users/${data.matched_user_id}`)
            .then(res => res.json())
            .then(res => setMatchedUser(res.data?.user || null));
        } else {
          setShowRecommend(true); // 매칭된 유저가 없으면 추천 후보 목록 바로 표시
        }
        setLoading(false);
      });
  }, [requestId]);

  // 점수 차트 데이터 생성 함수
  const getRadarChartData = (userObj: any) => userObj?.scores ? {
    labels: ['외모', '성격', '직업', '학력', '경제력'],
    datasets: [
      {
        label: '점수',
        data: [
          userObj.scores.appearance ?? 0,
          userObj.scores.personality ?? 0,
          userObj.scores.job ?? 0,
          userObj.scores.education ?? 0,
          userObj.scores.economics ?? 0,
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

  // 추천 후보 fetch/표시
  const handleRecommend = async () => {
    setLoadingRecommend(true);
    setShowRecommend(true);
    // 전체 유저 목록 fetch (토큰 포함)
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('/api/users', { headers });
    const users = await res.json();
    const userList = Array.isArray(users) ? users : Array.isArray(users.data) ? users.data : [];
    // 신청자 본인/이미 매칭된 유저 제외
    const filtered = userList.filter((u: any) => u.user_id !== request?.user_id && u.user_id !== request?.matched_user_id);
    setCandidates(filtered);
    console.log('candidates:', filtered);
    // 추천 API 호출
    const recRes = await fetch('/api/match-pairs/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        candidates: filtered.map((u: any) => ({
          userId: u.user_id,
          gender: u.profile?.gender,
          age: u.profile?.birth_date ? (new Date().getFullYear() - u.profile.birth_date.year) : 0,
          region: u.profile?.region?.region,
          height: u.profile?.height,
          status: u.status,
          isDeleted: u.is_deleted,
          hasScore: !!u.scores,
          score: u.scores,
        })),
        request: {
          requestId: request?.request_id,
          userId: request?.user_id,
          preferences: user?.preferences,
        }
      })
    });
    const recData = await recRes.json();
    console.log('recommendations:', recData.recommendations); // 추천 결과도 콘솔에 출력
    setRecommendations(recData.recommendations || []);
    setLoadingRecommend(false);
  };

  // 후보가 MatchingRequests(대기중)인지 확인
  const isCandidateWaiting = (candidateId: string) => {
    // 실제로는 MatchingRequests 테이블에서 status가 waiting인지 확인해야 함
    return candidates.find((c: any) => c.user_id === candidateId && c.status === 'waiting');
  };

  // 모달 내 선택 버튼 클릭 핸들러
  const handleSelectCandidate = async () => {
    if (!modalCandidate) return;
    if (isCandidateWaiting(modalCandidate.user_id)) {
      // TODO: 매칭 성사 API 호출 (MatchPairs/MatchingRequests 상태 변경)
      alert('매칭 신청자이므로 매칭 성사 처리(추후 구현)');
      setModalOpen(false);
      return;
    }
    // Propose 테이블에 제안 등록
    await fetch('/api/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: request?.user_id,
        toUserId: modalCandidate.user_id,
        requestId: request?.request_id,
        managerId: 'manager', // 실제 매니저 정보로 대체
      })
    });
    alert('Propose 테이블에 제안이 등록되었습니다.');
    setModalOpen(false);
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
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-left">
          <div><span className="font-bold text-gray-600 mb-1 block">선호 지역</span><span className="text-gray-800">{userObj?.preferences?.regions?.map((r:any) => `${r.region} ${r.district}`).join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">나이 범위</span><span className="text-gray-800">{userObj?.preferences?.age_range ? `${userObj.preferences.age_range.min}~${userObj.preferences.age_range.max}` : '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">키 범위</span><span className="text-gray-800">{userObj?.preferences?.height_range ? `${userObj.preferences.height_range.min}~${userObj.preferences.height_range.max}` : '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">직업군</span><span className="text-gray-800">{userObj?.preferences?.job_types?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">체형</span><span className="text-gray-800">{userObj?.preferences?.body_types?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">MBTI</span><span className="text-gray-800">{userObj?.preferences?.mbti_types?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">학력</span><span className="text-gray-800">{userObj?.preferences?.education_levels?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">결혼 계획</span><span className="text-gray-800">{userObj?.preferences?.marriage_plan ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">선호 성별</span><span className="text-gray-800">{userObj?.preferences?.preferred_gender ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">종교</span><span className="text-gray-800">{userObj?.preferences?.religion ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">흡연</span><span className="text-gray-800">{userObj?.preferences?.smoking ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">음주</span><span className="text-gray-800">{userObj?.preferences?.drinking ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">관심사</span><span className="text-gray-800">{userObj?.preferences?.interests?.join(', ') ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">자녀 희망</span><span className="text-gray-800">{userObj?.preferences?.children_desire ?? '-'}</span></div>
          <div><span className="font-bold text-gray-600 mb-1 block">우선순위</span><span className="text-gray-800">{Array.isArray(userObj?.preferences?.priority) ? userObj.preferences.priority.join(' > ') : userObj?.preferences?.priority?.split(',').join(' > ') ?? '-'}</span></div>
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
                disabled={loadingRecommend}
                className="ml-4"
              >
                {loadingRecommend ? '추천 중...' : '추천'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">신청자 이름</label>
                <p className="text-gray-900">{user?.profile?.name || user?.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' : request.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{request.status === 'waiting' ? '대기중' : request.status === 'matched' ? '매칭됨' : request.status}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수정일</label>
                <p className="text-gray-900">{new Date(request.updated_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
          </div>

          {/* 하단 2단 */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* 왼쪽: 신청자 */}
            <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col items-center mb-4">
                {/* 신청자 프로필 사진 */}
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
              {/* 탭 스타일 user-detail과 동일하게 */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button onClick={() => setActiveTab('score')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab==='score' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>점수</button>
                  <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab==='profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>프로필</button>
                  <button onClick={() => setActiveTab('ideal')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab==='ideal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>이상형</button>
                </nav>
              </div>
              {activeTab === 'score' && (
                <div>
                  {getRadarChartData(user) ? (
                    <Radar data={getRadarChartData(user)} options={{responsive:true,plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{color:'#222',stepSize:20},pointLabels:{color:'#888',font:{size:16}},grid:{color:'#e5e7eb'}}}}} height={250} />
                  ) : (
                    <div className="text-gray-500 text-center py-8">점수 데이터가 없습니다.</div>
                  )}
                </div>
              )}
              {activeTab === 'profile' && renderProfileTab(user)}
              {activeTab === 'ideal' && renderIdealTab(user)}
            </div>

            {/* 오른쪽: 매칭 상대 or 추천 */}
            <div className="w-full md:w-1/2 bg-white rounded-lg shadow p-6 mb-6">
              {request.matched_user_id && matchedUser ? (
                <>
                  <div className="flex flex-col items-center mb-4">
                    {/* 매칭상대 프로필 사진 */}
                    {(() => {
                      const photoArr = toPhotoArray(matchedUser?.profile?.photos);
                      return photoArr.length > 0 ? (
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 flex flex-col items-center">
                          <img src={photoArr[matchedPhotoIdx]} alt="프로필 사진" className="w-full h-full object-cover" />
                          {photoArr.length > 1 && (
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
                          )}
                        </div>
                      ) : (
                        <div className="w-full aspect-square rounded-xl bg-gray-200 flex items-center justify-center mb-2">사진 없음</div>
                      );
                    })()}
                    <div className="text-lg font-semibold">{matchedUser?.profile?.name || matchedUser?.email}</div>
                  </div>
                  {/* 탭 스타일 user-detail과 동일하게 */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                      <button onClick={() => setRightTab('score')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='score' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>점수</button>
                      <button onClick={() => setRightTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>프로필</button>
                      <button onClick={() => setRightTab('ideal')} className={`py-4 px-1 border-b-2 font-medium text-sm ${rightTab==='ideal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>이상형</button>
                    </nav>
                  </div>
                  {rightTab === 'score' && (
                    <div>
                      {getRadarChartData(matchedUser) ? (
                        <Radar data={getRadarChartData(matchedUser)} options={{responsive:true,plugins:{legend:{display:false}},scales:{r:{min:0,max:100,ticks:{color:'#222',stepSize:20},pointLabels:{color:'#888',font:{size:16}},grid:{color:'#e5e7eb'}}}}} height={250} />
                      ) : (
                        <div className="text-gray-500 text-center py-8">점수 데이터가 없습니다.</div>
                      )}
                    </div>
                  )}
                  {rightTab === 'profile' && renderProfileTab(matchedUser)}
                  {rightTab === 'ideal' && renderIdealTab(matchedUser)}
                </>
              ) : (
                <>
                  {showRecommend && (
                    <>
                      <div className="font-bold text-xl text-gray-900 mb-4">추천 후보 목록</div>
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
                              const candidate = candidates.find((c:any) => c.user_id === rec.userId);
                              return (
                                <tr key={rec.userId} className="border-b">
                                  <td className="px-6 py-3">{candidate?.profile?.name || candidate?.email || rec.userId}</td>
                                  <td className="px-6 py-3">{candidate?.grade || '-'}</td>
                                  <td className="px-6 py-3">
                                    <Button size="sm" onClick={() => { setModalCandidate(candidate); setModalOpen(true); }}>
                                      자세히 보기
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
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