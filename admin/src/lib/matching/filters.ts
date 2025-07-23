import { UserProfile, MatchingRequest } from '../../types/matching';

/**
 * 매칭 후보군 필터링 함수 (정책 기반)
 * 1. 점수 없는 유저 제외
 * 2. 상태(green/yellow)만 허용
 * 3. 탈퇴/삭제 유저 제외
 * 4. 이상형 조건(나이, 지역, 키, 직업, 학력, MBTI, 흡연, 음주, 종교, 자녀희망 등) 필터링
 * 5. 제외/중복(거절, 블랙리스트, 이미 매칭된 유저 등) 필터링
 */
export function filterCandidates(
  candidates: UserProfile[],
  request: MatchingRequest
): UserProfile[] {
  // 1. 점수 없는 유저 제외
  let filtered = candidates.filter((c) => c.hasScore);

  // 2. 상태(green/yellow)만 허용
  filtered = filtered.filter((c) => c.status === 'green' || c.status === 'yellow');

  // 3. 탈퇴/삭제 유저 제외
  filtered = filtered.filter((c) => !c.isDeleted);

  // 4. 이상형 조건 필터링 (score-policy.md 기반)
  if (request.preferences) {
    const p = request.preferences;
    // 나이
    if (p.age_range) {
      filtered = filtered.filter((c) => {
        const age = c.age;
        return age >= p.age_range.min && age <= p.age_range.max;
      });
    }
    // 키 (숫자)
    if (p.height_range) {
      filtered = filtered.filter((c) => {
        const h = c.height;
        return h >= parseInt(p.height_range.min) && h <= parseInt(p.height_range.max);
      });
    }
    // 지역 (하나라도 포함되면 통과, region은 문자열)
    if (p.regions && p.regions.length > 0) {
      filtered = filtered.filter((c) =>
        p.regions.some((r) => c.region === r.region)
      );
    }
    // profile 정보가 있을 때만 아래 조건 적용
    filtered = filtered.filter((c) => {
      const profile = (c as any).profile;
      if (!profile) return true;
      // 직업
      if (p.job_types && p.job_types.length > 0 && profile.job) {
        if (!p.job_types.includes(profile.job)) return false;
      }
      // 학력
      if (p.education_levels && p.education_levels.length > 0 && profile.education) {
        if (!p.education_levels.includes(profile.education)) return false;
      }
      // 바디타입
      if (p.body_types && p.body_types.length > 0 && profile.body_type) {
        if (!p.body_types.includes(profile.body_type)) return false;
      }
      // MBTI
      if (p.mbti_types && p.mbti_types.length > 0 && profile.mbti) {
        if (!p.mbti_types.includes(profile.mbti)) return false;
      }
      // 흡연
      if (p.smoking && p.smoking !== '상관없음' && profile.smoking) {
        if (profile.smoking !== p.smoking) return false;
      }
      // 음주
      if (p.drinking && p.drinking !== '상관없음' && profile.drinking) {
        if (profile.drinking !== p.drinking) return false;
      }
      // 종교
      if (p.religion && p.religion !== '상관없음' && profile.religion) {
        if (profile.religion !== p.religion) return false;
      }
      // 자녀희망
      if (p.children_desire && p.children_desire !== '상관없음' && profile.children_desire) {
        if (profile.children_desire !== p.children_desire) return false;
      }
      // 결혼계획
      if (p.marriage_plan && p.marriage_plan !== '미정' && profile.marriage_plans) {
        if (profile.marriage_plans !== p.marriage_plan) return false;
      }
      // interests (하나라도 포함되면 통과)
      if (p.interests && p.interests.length > 0 && profile.interests) {
        if (!profile.interests.some((i: string) => p.interests.includes(i))) return false;
      }
      return true;
    });
  }

  // 5. 제외/중복 조건(거절 이력, 블랙리스트, 이미 매칭된 유저 등)
  const excludedUserIds: string[] = request.preferences?.excludedUserIds || [];
  const matchedUserIds: string[] = request.preferences?.matchedUserIds || [];
  if (excludedUserIds.length > 0) {
    filtered = filtered.filter((c) => !excludedUserIds.includes(c.userId));
  }
  if (matchedUserIds.length > 0) {
    filtered = filtered.filter((c) => !matchedUserIds.includes(c.userId));
  }

  return filtered;
} 