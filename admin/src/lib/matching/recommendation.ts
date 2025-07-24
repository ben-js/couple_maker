import { filterCandidates, relaxFilterAndRetry } from './filters';
import { splitCandidatesByGrade } from './grade';
import { scoreCandidates } from './score';
import { rankAndSelect } from './tieBreaker';
import { saveRecommendations } from './save';
import dataService, { getUserScore } from '../dataService';

// 신청자 정보 조회 함수(실제 구현)
async function getApplicantWithProfileAndPreference(requestId: string) {
  // MatchingRequests에서 신청자 user_id 조회
  const matchingRequests = await dataService.getMatchingRequests();
  const request = matchingRequests.find((r: any) => r.request_id === requestId);
  if (!request) throw new Error('신청자 정보 없음');
  const user = await dataService.getUserById(request.user_id);
  const profile = await dataService.getProfile(request.user_id);
  const preferences = await dataService.getPreferences(request.user_id);
  const score = await getUserScore(request.user_id);
  return {
    ...user,
    profile,
    preferences,
    score_average: score?.average,
    scores: {
      외모: score?.appearanceGrade,
      직업: score?.jobGrade,
      성격: score?.personalityGrade,
      학력: score?.educationGrade,
      경제력: score?.economicsGrade,
    },
    user_id: request.user_id,
  };
}

export async function recommendCandidates(requestId: string) {
  try {
    // 1. 신청자 정보 조회
    const applicant = await getApplicantWithProfileAndPreference(requestId);

    // 2. 1차 필터
    let candidates = await filterCandidates(applicant);

    // 3. 등급별 분류
    const { upper, same, lower } = splitCandidatesByGrade(applicant, candidates);

    // 4. 점수 계산
    const scoredUpper = scoreCandidates(applicant, upper);
    const scoredSame = scoreCandidates(applicant, same);
    const scoredLower = scoreCandidates(applicant, lower);

    // 5. 정렬 및 추출
    const finalUpper = rankAndSelect(scoredUpper, 3);
    const finalSame = rankAndSelect(scoredSame, 4);
    const finalLower = rankAndSelect(scoredLower, 3);

    // 6. 합치기
    let recommendations = [...finalUpper, ...finalSame, ...finalLower];

    // 7. 인원 부족 시 조건 완화
    if (recommendations.length < 10) {
      const more = await relaxFilterAndRetry(applicant, 10 - recommendations.length);
      recommendations = [...recommendations, ...more];
    }

    // 8. 저장
    await saveRecommendations(requestId, recommendations);

    return recommendations || [];
  } catch (e: any) {
    console.error('추천 알고리즘 에러:', e);
    return [];
  }
} 