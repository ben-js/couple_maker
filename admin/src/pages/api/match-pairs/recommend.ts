import type { NextApiRequest, NextApiResponse } from 'next';
import { recommendCandidates } from '../../../lib/matching/recommendation';
import dataService, { getUserScore } from '../../../lib/dataService';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from '../../../lib/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ recommendations: any[]; newRecommendationsCount?: number } | { error: string }>
) {
  if (req.method === 'GET') {
    // GET: MatchingRecommendations에서 requestId로 조회
    const { requestId } = req.query;
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Missing requestId' });
    }
    try {
      // 직접 DynamoDB 접근
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: 'MatchingRecommendations',
          KeyConditionExpression: 'request_id = :rid',
          ExpressionAttributeValues: { ':rid': requestId },
        })
      );
      const items = result.Items || [];
      
      const userIds = items.map((item: any) => item.recommended_user_id);
      const users = await dataService.getUsersWithProfilesByIds(userIds);
      // score 정보도 병합
      const scores = await Promise.all(userIds.map(id => getUserScore(id)));
      const scoreMap = Object.fromEntries(scores.map((s, i) => [userIds[i], s]));
      const userMap = Object.fromEntries(users.map((u: any) => [u.user_id, u]));
      const recommendations = items.map((item: any) => ({
        ...item,
        ...userMap[item.recommended_user_id],
        score: scoreMap[item.recommended_user_id],
        preferences: userMap[item.recommended_user_id]?.preferences, // 명시적으로 포함
      }));
      // recommendation_count별로 그룹화한 후 각 그룹 내에서 등급별 정렬
      const sortedRecommendations = recommendations.sort((a: any, b: any) => {
        // 1차: recommendation_count 오름차순
        const countDiff = (a.recommendation_count || 1) - (b.recommendation_count || 1);
        if (countDiff !== 0) {
          return countDiff;
        }
        // 2차: 같은 recommendation_count 내에서 등급별 정렬
        const gradeOrder = { 'S': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7 };
        const gradeA = a.score?.average_grade || 'C';
        const gradeB = b.score?.average_grade || 'C';
        const gradeDiff = gradeOrder[gradeA] - gradeOrder[gradeB];
        if (gradeDiff !== 0) {
          return gradeDiff; // 등급이 다르면 등급 순서대로
        }
        // 3차: 등급이 같으면 compatibility_score 내림차순
        return (b.compatibility_score || 0) - (a.compatibility_score || 0);
      });
      return res.status(200).json({ recommendations: sortedRecommendations });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }
    // 1. 기존 추천된 유저 목록 조회 (직접 DynamoDB 접근)
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
    // 2. 추천 알고리즘 실행 (내부적으로 이미 추천된 유저는 제외하고 새로 추천된 유저만 DB에 append)
    const newRecommendations = await recommendCandidates(requestId);
    // 3. 새로 추천된 유저만 반환
    const newUserIds = newRecommendations.map((rec: any) => rec.user_id);
    // 실제로 DB에 append된 유저만 반환 (혹시라도 race condition 방지)
    const trulyNewUserIds = newUserIds.filter((id: string) => !alreadyRecommendedIds.has(id));
    if (trulyNewUserIds.length === 0) {
      return res.status(200).json({ recommendations: [] });
    }
    // 4. 기존 추천과 새로운 추천을 합쳐서 정렬
    const allUserIds = [...Array.from(alreadyRecommendedIds), ...trulyNewUserIds];
    const allUsers = await dataService.getUsersWithProfilesByIds(allUserIds);
    const allScores = await Promise.all(allUserIds.map(id => getUserScore(id)));
    const allScoreMap = Object.fromEntries(allScores.map((s, i) => [allUserIds[i], s]));
    const allUserMap = Object.fromEntries(allUsers.map((u: any) => [u.user_id, u]));
    // 기존 추천 데이터 구성
    const existingRecommendations = prevResult.map((item: any) => ({
      ...item,
      ...allUserMap[item.recommended_user_id],
      score: allScoreMap[item.recommended_user_id],
      preferences: allUserMap[item.recommended_user_id]?.preferences,
    }));
    // 새로운 추천 데이터 구성
    const newRecommendationsData = trulyNewUserIds.map((userId: string) => {
      const newRec = newRecommendations.find((rec: any) => rec.user_id === userId);
      return {
        ...allUserMap[userId],
        score: allScoreMap[userId],
        preferences: allUserMap[userId]?.preferences,
        user_id: userId,
        ...newRec,
        grade: newRec?.grade || 'C'
      };
    });
    
    // 새로운 추천을 올바른 순서로 정렬 (GET과 동일한 로직)
    const sortedNewRecommendations = newRecommendationsData.sort((a: any, b: any) => {
      // 1차: recommendation_count 오름차순
      const countDiff = (a.recommendation_count || 1) - (b.recommendation_count || 1);
      if (countDiff !== 0) {
        return countDiff;
      }
      // 2차: 같은 recommendation_count 내에서 등급별 정렬
      const gradeOrder = { 'S': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7 };
      const gradeA = a.score?.average_grade || 'C';
      const gradeB = b.score?.average_grade || 'C';
      const gradeDiff = gradeOrder[gradeA] - gradeOrder[gradeB];
      if (gradeDiff !== 0) {
        return gradeDiff; // 등급이 다르면 등급 순서대로
      }
      // 3차: 등급이 같으면 compatibility_score 내림차순
      return (b.compatibility_score || 0) - (a.compatibility_score || 0);
    });
    
    // 전체 추천 목록 구성 (기존 + 새로운 추천)
    const allRecommendations = [...existingRecommendations, ...sortedNewRecommendations];
    
    // 전체 목록을 올바른 순서로 정렬
    const sortedAllRecommendations = allRecommendations.sort((a: any, b: any) => {
      // 1차: recommendation_count 오름차순
      const countDiff = (a.recommendation_count || 1) - (b.recommendation_count || 1);
      if (countDiff !== 0) {
        return countDiff;
      }
      // 2차: 같은 recommendation_count 내에서 등급별 정렬
      const gradeOrder = { 'S': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7 };
      const gradeA = a.score?.average_grade || 'C';
      const gradeB = b.score?.average_grade || 'C';
      const gradeDiff = gradeOrder[gradeA] - gradeOrder[gradeB];
      if (gradeDiff !== 0) {
        return gradeDiff; // 등급이 다르면 등급 순서대로
      }
      // 3차: 등급이 같으면 compatibility_score 내림차순
      return (b.compatibility_score || 0) - (a.compatibility_score || 0);
    });
    
    // 전체 추천 목록과 새로 추가된 추천 수를 함께 반환
    return res.status(200).json({ 
      recommendations: sortedAllRecommendations,
      newRecommendationsCount: sortedNewRecommendations.length 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 