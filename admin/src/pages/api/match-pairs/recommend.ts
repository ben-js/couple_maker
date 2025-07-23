import type { NextApiRequest, NextApiResponse } from 'next';
import { getMatchingRecommendations } from '../../../lib/matching';
import { UserProfile, MatchingRequest, Recommendation } from '../../../types/matching';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ recommendations: Recommendation[] } | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { candidates, request } = req.body as {
      candidates: UserProfile[];
      request: MatchingRequest;
    };
    if (!candidates || !request) {
      return res.status(400).json({ error: 'Missing candidates or request' });
    }
    const recommendations = await getMatchingRecommendations(candidates, request);
    return res.status(200).json({ recommendations });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
} 