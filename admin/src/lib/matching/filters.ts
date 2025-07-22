import { UserProfile, MatchingRequest } from '../../types/matching';

/**
 * 매칭 후보군 필터링 함수
 * 1. 점수 없는 유저 제외
 * 2. 상태(green/yellow)만 허용
 * 3. 탈퇴/삭제 유저 제외
 * 4. 이상형 조건(나이, 지역, 키 등) 필터링
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

  // 4. 이상형 조건 필터링 (나이, 지역, 키 등)
  if (request.preferences) {
    const { minAge, maxAge, region, minHeight, maxHeight } = request.preferences;
    if (minAge !== undefined && maxAge !== undefined) {
      filtered = filtered.filter((c) => c.age >= minAge && c.age <= maxAge);
    }
    if (region) {
      filtered = filtered.filter((c) => c.region === region);
    }
    if (minHeight !== undefined && maxHeight !== undefined) {
      filtered = filtered.filter((c) => c.height >= minHeight && c.height <= maxHeight);
    }
    // ... 기타 조건 추가 가능
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