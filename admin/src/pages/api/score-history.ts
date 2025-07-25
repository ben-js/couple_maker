import type { NextApiRequest, NextApiResponse } from 'next';
import { dynamodb } from '../../lib/dataService';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }
  try {
    // Scores 테이블에서 점수 데이터 조회 (ScoreHistory 대신)
    const result = await dynamodb.send(new QueryCommand({
      TableName: 'Scores',
      KeyConditionExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false, // 최신 데이터부터
    }));
    
    // Scores 테이블의 데이터를 ScoreHistory 형식으로 변환
    const scoreHistoryItems = result.Items?.map(score => ({
      ...score,
      // ScoreHistory 테이블과 호환되도록 필드 매핑
      face_score: score.appearance, // 외모 점수를 얼굴 점수로 매핑
      reason: score.summary || '최초 입력',
      manager_id: score.scorer || 'system'
    })) || [];
    
    res.status(200).json({ items: scoreHistoryItems });
  } catch (e) {
    console.error('Score history fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch score history' });
  }
} 