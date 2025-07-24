import type { NextApiRequest, NextApiResponse } from 'next';
import { recommendCandidates } from '../../../lib/matching/recommendation';
import AWS from 'aws-sdk';
import dataService, { getUserScore } from '../../../lib/dataService';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'MatchingRecommendations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ recommendations: any[] } | { error: string }>
) {
  if (req.method === 'GET') {
    // GET: MatchingRecommendations에서 requestId로 조회
    const { requestId } = req.query;
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Missing requestId' });
    }
    try {
      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'request_id = :rid',
        ExpressionAttributeValues: { ':rid': requestId },
      };
      const result = await dynamodb.query(params).promise();
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
      return res.status(200).json({ recommendations });
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

    const recommendations = await recommendCandidates(requestId);
    return res.status(200).json({ recommendations });
  } catch (error: any) {
    console.error('추천 API 에러:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 