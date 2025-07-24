import { NextApiRequest, NextApiResponse } from 'next';
import dataService from '../../../lib/dataService';

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RecentActivity[] | { message: string; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 개발 환경에서는 토큰 검증 완화
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    console.log('최근 활동 데이터 조회 시작');

    // DataService를 사용하여 최근 활동 조회
    const activities = await dataService.getRecentActivities(10);

    console.log('최근 활동 데이터:', activities.length, '개');

    res.status(200).json(activities);
  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    res.status(500).json({ 
      message: '최근 활동 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 