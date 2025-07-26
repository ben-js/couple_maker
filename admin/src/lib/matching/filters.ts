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
  excludeRecommendedIds?: Set<string>; // 이미 추천된 유저 ID 목록
  excludeProposedIds?: Set<string>; // 이미 제안된 유저 ID 목록
}

// 1차 필터 함수: 옵션에 따라 조건 완화 가능
export async function filterCandidates(applicant: any, options: FilterOptions = {}): Promise<any[]> {
  let users = await dataService.getUsersWithScoreAndProfile();
  console.log(`🔍 전체 사용자 수: ${users.length}`);
  
  let candidates = users.filter((u: any) => u.has_score && (u.status === 'green' || u.status === 'yellow') && !u.is_deleted);
  console.log(`🔍 기본 필터 후 후보 수: ${candidates.length}`);

  // 성능 최적화: 가장 제외 효과가 큰 조건들을 먼저 처리
  // 1. 이미 추천된 유저 제외 (Set 조회 - O(1), 제외 효과 매우 높음)
  if (options.excludeRecommendedIds && options.excludeRecommendedIds.size > 0) {
    const beforeCount = candidates.length;
    candidates = candidates.filter((c: any) => !options.excludeRecommendedIds!.has(c.user_id));
    console.log(`🔍 이미 추천된 유저 제외: ${beforeCount} → ${candidates.length} (제외: ${beforeCount - candidates.length})`);
  }

  // 2. 이미 제안된 유저 제외 (Set 조회 - O(1), 제외 효과 높음)
  if (options.excludeProposedIds && options.excludeProposedIds.size > 0) {
    const beforeCount = candidates.length;
    candidates = candidates.filter((c: any) => !options.excludeProposedIds!.has(c.user_id));
    console.log(`🔍 이미 제안된 유저 제외: ${beforeCount} → ${candidates.length} (제외: ${beforeCount - candidates.length})`);
  }

  // 3. 성별 필터 (단순 비교 O(1), 제외 효과 매우 높음 - 약 50% 제외)
  const beforeCount = candidates.length;
  candidates = candidates.filter((c: any) => c.profile?.gender !== applicant.profile?.gender);
  console.log(`🔍 성별 필터: ${beforeCount} → ${candidates.length} (제외: ${beforeCount - candidates.length})`);
  console.log(`🔍 신청자 성별: ${applicant.profile?.gender}, 후보 성별들: ${candidates.map(c => c.profile?.gender).slice(0, 5)}`);

  const pref = applicant.preferences;
  
  candidates = candidates.filter((c: any) => {
    // 4. 나이 필터 (숫자 비교 O(1), 제외 효과 높음)
    const candidateAge = c.profile?.birth_date?.year ? new Date().getFullYear() - c.profile.birth_date.year : null;
    
    if (
      pref.age_range &&
      candidateAge &&
      !options.relaxAge &&
      (candidateAge < pref.age_range.min || candidateAge > pref.age_range.max)
    ) {
      return false;
    }
    // 완화: 나이 범위 ±3세 확장 (기존 ±2에서 증가)
    if (
      pref.age_range &&
      candidateAge &&
      options.relaxAge &&
      (candidateAge < pref.age_range.min - 3 || candidateAge > pref.age_range.max + 3)
    ) {
      return false;
    }

    // 5. 키 필터 (숫자 비교 O(1), 제외 효과 중간)
    let candidateHeight = null;
    if (c.profile?.height) {
      if (typeof c.profile.height === 'string') {
        candidateHeight = parseInt(c.profile.height.replace('cm', ''));
      } else if (typeof c.profile.height === 'number') {
        candidateHeight = c.profile.height;
      }
    }
    
    if (
      pref.height_range &&
      candidateHeight &&
      !options.relaxHeight &&
      (candidateHeight < pref.height_range.min || candidateHeight > pref.height_range.max)
    ) {
      return false;
    }
    // 완화: 키 범위 ±5cm 확장
    if (
      pref.height_range &&
      candidateHeight &&
      options.relaxHeight &&
      (candidateHeight < pref.height_range.min - 5 || candidateHeight > pref.height_range.max + 5)
    ) {
      return false;
    }

    // 6. 지역 필터 (배열 검색 O(n), 제외 효과 중간)
    if (
      pref.regions &&
      pref.regions.length > 0
    ) {
      // regions가 객체 배열인지 문자열 배열인지 확인
      const candidateRegion = c.profile?.region?.region;
      const isRegionMatch = pref.regions.some((region: any) => {
        if (typeof region === 'string') {
          return region === candidateRegion;
        } else if (region && typeof region === 'object' && region.region) {
          return region.region === candidateRegion;
        }
        return false;
      });
      
      if (!isRegionMatch) {
        return false;
      }
    }

    // 7. 종교 필터 (문자열 비교 O(1), 제외 효과 낮음)
    if (
      pref.religion &&
      pref.religion !== '상관없음' &&
      !options.relaxReligion &&
      c.profile?.religion !== pref.religion
    ) {
      return false;
    }

    return true;
  });

  // 성능 최적화: DB 조회가 필요한 조건을 마지막에 처리 (가장 비용이 높음)
  // 8. 매칭/거절 이력 필터 (DB 조회 - O(n))
  const matchingRequests = await dataService.getMatchingRequests();
  // 대기 중인 매칭 요청이 있는 사용자는 제외 (이미 매칭 대기 중이므로)
  const waitingUserIds = matchingRequests.filter((r: any) => r.status === 'waiting').map((r: any) => r.user_id);
  candidates = candidates.filter((c: any) => !waitingUserIds.includes(c.user_id));

  const matchPairs = await dataService.getMatchPairs();
  candidates = candidates.filter((c: any) => {
    const hasHistory = matchPairs.some((p: any) =>
      (p.match_a_user_id === applicant.user_id && p.match_b_user_id === c.user_id) ||
      (p.match_b_user_id === applicant.user_id && p.match_a_user_id === c.user_id)
    );
    return !hasHistory;
  });

  const proposals = await dataService.getProposals();
  candidates = candidates.filter((c: any) => {
    const refused = proposals.some((p: any) => p.target_id === applicant.user_id && p.propose_user_id === c.user_id && p.status === 'refuse');
    return !refused;
  });

  return candidates;
}

// 조건 완화 함수: 나이, 키, 종교를 점진적으로 완화하며 후보를 찾음
export async function relaxFilterAndRetry(applicant: any, needed: number, excludeRecommendedIds?: Set<string>, excludeProposedIds?: Set<string>): Promise<any[]> {
  // 1. 나이 완화 (±3세)
  let candidates = await filterCandidates(applicant, { relaxAge: true, excludeRecommendedIds, excludeProposedIds });
  if (candidates.length >= needed) return candidates.slice(0, needed);

  // 2. 키 완화 (±5cm)
  candidates = await filterCandidates(applicant, { relaxAge: true, relaxHeight: true, excludeRecommendedIds, excludeProposedIds });
  if (candidates.length >= needed) return candidates.slice(0, needed);

  // 3. 종교 완화 (무시)
  candidates = await filterCandidates(applicant, { relaxAge: true, relaxHeight: true, relaxReligion: true, excludeRecommendedIds, excludeProposedIds });
  if (candidates.length >= needed) return candidates.slice(0, needed);

  // 4. 그래도 부족하면 가능한 만큼만 반환
  return candidates;
} 