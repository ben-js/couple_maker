// 1차 후보군 필터 함수 (정책 기반)
// 실제 DB 연동 함수는 프로젝트에 맞게 교체 필요
import dataService from '../dataService';

/**
 * 신청자와 정책에 맞는 추천 후보군을 반환
 * @param applicant 신청자(프로필, 이상형, 점수 등 포함)
 */
// 1차 필터 조건 타입 정의
interface FilterOptions {
  relaxAge?: boolean;
  relaxHeight?: boolean;
  relaxReligion?: boolean;
}

// 1차 필터 함수: 옵션에 따라 조건 완화 가능
export async function filterCandidates(applicant: any, options: FilterOptions = {}): Promise<any[]> {
  let users = await dataService.getUsersWithScoreAndProfile();
  let candidates = users.filter((u: any) => u.has_score && (u.status === 'green' || u.status === 'yellow') && !u.is_deleted);

  const pref = applicant.preferences;
  candidates = candidates.filter((c: any) => {
    // 성별 (반드시 다름)
    if (c.profile?.gender === applicant.profile?.gender) return false;

    // 나이 (age_range)
    if (
      pref.age_range &&
      !options.relaxAge &&
      (c.profile?.age < pref.age_range.min || c.profile?.age > pref.age_range.max)
    ) return false;
    // 완화: 나이 범위 ±2세 확장
    if (
      pref.age_range &&
      options.relaxAge &&
      (c.profile?.age < pref.age_range.min - 2 || c.profile?.age > pref.age_range.max + 2)
    ) return false;

    // 키 (height_range, 문자열 → 숫자 변환)
    if (
      pref.height_range &&
      !options.relaxHeight &&
      (Number(c.profile?.height) < pref.height_range.min || Number(c.profile?.height) > pref.height_range.max)
    ) return false;
    // 완화: 키 범위 ±5cm 확장
    if (
      pref.height_range &&
      options.relaxHeight &&
      (Number(c.profile?.height) < pref.height_range.min - 5 || Number(c.profile?.height) > pref.height_range.max + 5)
    ) return false;

    // 지역 (regions: [{region, district}], profile.region.region)
    if (
      pref.regions &&
      pref.regions.length > 0 &&
      !pref.regions.some((r: any) => r.region === c.profile?.region?.region)
    ) return false;

    // 종교
    if (
      pref.religion &&
      pref.religion !== '상관없음' &&
      !options.relaxReligion &&
      c.profile?.religion !== pref.religion
    ) return false;
    // 완화: 종교 무시 (상관없음 취급)
    // (options.relaxReligion이 true면 종교 조건 무시)

    return true;
  });

  // 매칭/거절 이력 필터 (정책 그대로 유지)
  const matchingRequests = await dataService.getMatchingRequests();
  const waitingUserIds = matchingRequests.filter((r: any) => r.status === 'waiting').map((r: any) => r.user_id);
  candidates = candidates.filter((c: any) => waitingUserIds.includes(c.user_id) || !matchingRequests.some((r: any) => r.user_id === c.user_id));

  const matchPairs = await dataService.getMatchPairs();
  candidates = candidates.filter((c: any) => {
    const hasHistory = matchPairs.some((p: any) =>
      (p.match_a_id === applicant.user_id && p.match_b_id === c.user_id) ||
      (p.match_b_id === applicant.user_id && p.match_a_id === c.user_id)
    );
    return !hasHistory;
  });

  const proposals = await dataService.getProposals();
  candidates = candidates.filter((c: any) => {
    const refused = proposals.some((p: any) => p.propose_user_id === applicant.user_id && p.recommended_user_id === c.user_id && p.status === 'refuse');
    return !refused;
  });

  return candidates;
}

// 조건 완화 함수: 나이, 키, 종교를 점진적으로 완화하며 후보를 찾음
export async function relaxFilterAndRetry(applicant: any, needed: number): Promise<any[]> {
  // 1. 나이 완화
  let candidates = await filterCandidates(applicant, { relaxAge: true });
  if (candidates.length >= needed) return candidates.slice(0, needed);

  // 2. 키 완화
  candidates = await filterCandidates(applicant, { relaxAge: true, relaxHeight: true });
  if (candidates.length >= needed) return candidates.slice(0, needed);

  // 3. 종교 완화
  candidates = await filterCandidates(applicant, { relaxAge: true, relaxHeight: true, relaxReligion: true });
  if (candidates.length >= needed) return candidates.slice(0, needed);

  // 4. 그래도 부족하면 가능한 만큼만 반환
  return candidates;
} 