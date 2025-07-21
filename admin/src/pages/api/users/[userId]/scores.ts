import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserScoreHistory } from '../../../../lib/dataService';
import { ScoreResult } from '../../../../types/score';
import { saveUserScore } from '../../../../lib/dataService';
import DataService from '../../../../lib/dataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ scores: ScoreResult[] } | { saved?: ScoreResult, error?: string }>
) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }
  if (req.method === 'GET') {
    try {
      const scores = await getUserScoreHistory(userId);
      return res.status(200).json({ scores });
    } catch (error) {
      console.error('점수 이력 조회 API 오류:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { faceScoreInput, summary, personality, job, education, economics } = req.body;
      if (!summary) {
        return res.status(400).json({ error: 'Invalid input' });
      }
      // faceScoreInput(5점 만점) → 100점 환산
      const faceScore = faceScoreInput ? Number(faceScoreInput) * 20 : 0;
      // 프로필/이상형 정보는 실제 서비스에서는 DB에서 불러와야 함(여기선 생략)
      // appearance 계산 (정책대로)
      // 예시: appearance = 얼굴*0.5 + ... (여기선 클라이언트에서 계산된 값 사용)
      const appearance = req.body.appearance ?? 0;
      const scoreInput = { appearance, personality, job, education, economics };
      await saveUserScore(userId, scoreInput, 'admin', summary);
      // 매니저 활동 로그에도 기록
      const ds = new DataService();
      await ds.logManagerAction('admin', 'score_write', userId, `faceScoreInput(5점): ${faceScoreInput}, appearance: ${appearance}, summary: ${summary}`);
      // 저장 후 최신 점수 이력 반환
      const scores = await getUserScoreHistory(userId);
      return res.status(200).json({ scores });
    } catch (error) {
      console.error('점수 저장 API 오류:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
} 