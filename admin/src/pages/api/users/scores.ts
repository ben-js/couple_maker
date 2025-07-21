import type { NextApiRequest, NextApiResponse } from 'next';
import { ScoreInput } from '../../../types/score';
import { saveUserScore } from '../../../lib/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: boolean } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { userId, score, scorer, summary } = req.body as { userId: string; score: ScoreInput; scorer?: string; summary?: string };
    if (!userId || !score) {
      return res.status(400).json({ error: 'Missing userId or score' });
    }
    await saveUserScore(userId, score, scorer || 'manager', summary || '');
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('점수 저장 API 오류:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 