import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';

const dataService = new DataService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('테스트 API 호출 시작:', req.method, req.url);
  console.log('쿼리 파라미터:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    console.log('요청된 userId:', userId);
    
    if (!userId || typeof userId !== 'string') {
      console.log('userId가 유효하지 않음:', userId);
      return res.status(400).json({ success: false, message: '사용자 ID가 필요합니다.' });
    }

    // 사용자 정보 조회 (토큰 검증 없이)
    console.log('DataService.getUserById 호출 시작');
    const user = await dataService.getUserById(userId);
    console.log('사용자 조회 결과:', !!user);
    console.log('사용자 데이터:', user);
    
    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 간단한 응답 데이터
    const responseData = {
      user: {
        user_id: user.user_id,
        email: user.email,
        status: user.status,
        grade: user.grade || 'general',
        points: user.points || 0,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('테스트 사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 불러올 수 없습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
} 