import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserScore } from '../../../../lib/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ score: any } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const score = await getUserScore(userId);
    return res.status(200).json({ score });
  } catch (error) {
    console.error('현재 점수 조회 API 오류:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 