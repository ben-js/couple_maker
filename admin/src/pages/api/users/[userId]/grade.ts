import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../../lib/dataService';
import { verifyToken } from '../../../../lib/auth';

const dataService = new DataService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message: string } | { message: string; error?: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 토큰에서 매니저 정보 가져오기
    const token = req.headers.authorization?.replace('Bearer ', '');
    let managerId = 'unknown';
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        managerId = decoded.id || 'unknown';
      }
    }

    // 개발 환경에서는 토큰 검증 완화
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    const { userId } = req.query;
    const { grade } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '사용자 ID가 필요합니다.' });
    }

    if (!grade) {
      return res.status(400).json({ message: '등급 값이 필요합니다.' });
    }

    console.log('사용자 등급 변경:', userId, '->', grade);

    // DataService를 사용하여 사용자 등급 업데이트
    const updatedUser = await dataService.updateUserGrade(userId, grade);

    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 매니저 로그 기록
    try {
      await dataService.logManagerAction(
        managerId,
        'grade_change',
        userId,
        `사용자 등급 변경: ${grade}`
      );
      console.log('매니저 로그 기록 완료');
    } catch (logError) {
      console.error('매니저 로그 기록 실패:', logError);
      // 로그 기록 실패는 전체 요청을 실패시키지 않음
    }

    console.log('사용자 등급 변경 완료:', updatedUser);

    res.status(200).json({ 
      success: true, 
      message: '사용자 등급이 성공적으로 변경되었습니다.' 
    });
  } catch (error) {
    console.error('사용자 등급 변경 오류:', error);
    res.status(500).json({ 
      message: '사용자 등급 변경 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 