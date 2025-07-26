import { filterCandidates, relaxFilterAndRetry } from './filters';
import { splitCandidatesByGrade, getGradeByScore } from './grade';
import { scoreCandidates } from './score';
import { rankAndSelect } from './tieBreaker';
import { saveRecommendations } from './save';
import dataService, { getUserScore } from '../dataService';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from '../dataService';

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

    // 1.5. 이미 추천된 유저 조회 (직접 DynamoDB 접근)
    let prevResult: any[] = [];
    try {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: 'MatchingRecommendations',
          KeyConditionExpression: 'request_id = :rid',
          ExpressionAttributeValues: { ':rid': requestId },
        })
      );
      prevResult = result.Items || [];
    } catch (error) {
      console.error('Error getting existing recommendations:', error);
    }
    
    const alreadyRecommendedIds = new Set<string>(prevResult.map((item: any) => item.recommended_user_id));
    
    // 기존 추천 데이터에서 최대 recommendation_count 찾기
    const existingRecommendations = prevResult;
    const maxRecommendationCount = existingRecommendations.length > 0 
      ? Math.max(...existingRecommendations.map((item: any) => item.recommendation_count || 1))
      : 0;
    const nextBatchCount = maxRecommendationCount + 1;

    // 1.6. 이미 제안된 유저 조회 (Proposals 테이블)
    const proposals = await dataService.getProposals();
    console.log(`🔍 전체 proposals:`, proposals);
    
    const alreadyProposedIds = new Set(
      proposals
        .filter((p: any) => ['pending', 'accepted', 'refused'].includes(p.status))
        .map((p: any) => p.target_id)
    );
    
    console.log(`🔍 필터링된 proposals:`, proposals.filter((p: any) => ['pending', 'accepted', 'refused'].includes(p.status)));
    console.log(`🔍 applicant.user_id:`, applicant.user_id);
    console.log(`🔍 alreadyProposedIds:`, Array.from(alreadyProposedIds));

    // 2. 1차 필터 (모든 제외 조건 포함)
    let candidates = await filterCandidates(applicant, { 
      excludeRecommendedIds: alreadyRecommendedIds as Set<string>,
      excludeProposedIds: alreadyProposedIds as Set<string>
    });
    
    console.log(`🔍 필터링 결과:`, {
      alreadyRecommendedIds: Array.from(alreadyRecommendedIds),
      alreadyProposedIds: Array.from(alreadyProposedIds),
      filteredCandidates: candidates.map(c => c.user_id),
      filteredCount: candidates.length
    });

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

    console.log(`📊 rankAndSelect 결과:`, {
      upper: { input: scoredUpper.length, output: finalUpper.length },
      same: { input: scoredSame.length, output: finalSame.length },
      lower: { input: scoredLower.length, output: finalLower.length },
      total: finalUpper.length + finalSame.length + finalLower.length
    });

    // 6. 합치기 (실제 점수 기반으로 등급 계산)
    let recommendations = [
      ...finalUpper.map(c => ({ ...c, grade: getGradeByScore(c.score?.average) })),
      ...finalSame.map(c => ({ ...c, grade: getGradeByScore(c.score?.average) })),
      ...finalLower.map(c => ({ ...c, grade: getGradeByScore(c.score?.average) }))
    ];

    // 7. 인원 부족 시 조건 완화
    if (recommendations.length < 10) {
      const more = await relaxFilterAndRetry(applicant, 10 - recommendations.length, alreadyRecommendedIds as Set<string>, alreadyProposedIds as Set<string>);
      // 추가 후보들도 점수 계산을 거치도록 수정
      const scoredMore = scoreCandidates(applicant, more);
      
      // 기존 recommendations와의 중복 제거
      const existingUserIds = new Set(recommendations.map(r => r.user_id));
      const additionalRecommendations = scoredMore
        .filter(c => !existingUserIds.has(c.user_id))
        .map(c => ({ 
          ...c, 
          grade: getGradeByScore(c.score?.average),
          recommendation_count: nextBatchCount
        })); // 실제 점수 기반 등급 + 배치 번호
      
      recommendations = [...recommendations, ...additionalRecommendations];
    }

    // 7.5. recommendation_count 설정 (새로운 배치 번호)
    recommendations = recommendations.map(rec => ({
      ...rec,
      recommendation_count: nextBatchCount
    }));

    // 7.6. compatibility_score 확인 및 로깅
    console.log(`🔍 compatibility_score 확인:`, recommendations.map(r => ({
      user_id: r.user_id,
      grade: r.grade,
      compatibility_score: r.compatibility_score,
      has_compatibility_score: r.compatibility_score !== undefined && r.compatibility_score !== null
    })));

    // 8. recommendation_count별로 그룹화한 후 각 그룹 내에서 등급별 정렬
    console.log(`🔍 정렬 전 recommendations:`, recommendations.map(r => ({
      user_id: r.user_id,
      grade: r.grade,
      compatibility_score: r.compatibility_score
    })));
    
    recommendations = recommendations.sort((a, b) => {
      // 1차: recommendation_count 오름차순 (이미 같은 배치이므로 모두 같은 값)
      const countDiff = (a.recommendation_count || 1) - (b.recommendation_count || 1);
      if (countDiff !== 0) {
        return countDiff;
      }
      
      // 2차: 같은 recommendation_count 내에서 등급별 정렬
      const gradeOrder = { 'S': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7 };
      const gradeDiff = gradeOrder[a.grade] - gradeOrder[b.grade];
      
      console.log(`🔍 정렬 비교:`, {
        a: { user_id: a.user_id, grade: a.grade, score: a.compatibility_score, order: gradeOrder[a.grade] },
        b: { user_id: b.user_id, grade: b.grade, score: b.compatibility_score, order: gradeOrder[b.grade] },
        gradeDiff,
        result: gradeDiff !== 0 ? gradeDiff : b.compatibility_score - a.compatibility_score
      });
      
      if (gradeDiff !== 0) {
        return gradeDiff; // 등급이 다르면 등급 순서대로
      }
      
      // 3차: 등급이 같으면 compatibility_score 내림차순
      return b.compatibility_score - a.compatibility_score;
    });
    
    console.log(`🔍 정렬 후 recommendations:`, recommendations.map(r => ({
      user_id: r.user_id,
      grade: r.grade,
      compatibility_score: r.compatibility_score
    })));

    console.log(`📊 추천 결과:`, {
      requestId,
      newRecommendationsCount: recommendations.length,
      existingRecommendedCount: alreadyRecommendedIds.size,
      totalRecommendations: recommendations.length + alreadyRecommendedIds.size,
      newUserIds: recommendations.map(r => r.user_id),
      existingUserIds: Array.from(alreadyRecommendedIds),
      overlap: recommendations.filter(r => alreadyRecommendedIds.has(r.user_id)).map(r => r.user_id)
    });

    // 9. 저장 전 정렬된 순서 확인
    console.log(`💾 saveRecommendations 호출 전 정렬된 순서:`, recommendations.map((r, idx) => ({
      index: idx,
      user_id: r.user_id,
      grade: r.grade,
      compatibility_score: r.compatibility_score,
      recommendation_count: r.recommendation_count
    })));

    // 9. 저장 (append 모드로 기존 추천은 카운트만 증가, 새로운 추천은 추가)
    await saveRecommendations(requestId, recommendations, true); // append 모드

    return recommendations || [];
  } catch (e: any) {
    return [];
  }
} 