import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';
import { DashboardStats } from '../../../types/dataService';

const dataService = new DataService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { message: string; error?: string }>
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

    console.log('대시보드 통계 데이터 조회 시작');

    // DataService를 사용하여 통계 데이터 조회
    const stats = await dataService.getDashboardStats();

    console.log('대시보드 통계 데이터:', stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    res.status(500).json({ 
      message: '대시보드 통계 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 