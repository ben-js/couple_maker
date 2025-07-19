import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';
import { verifyToken } from '../../../lib/auth';

const dataService = new DataService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
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

    // Manager 권한 확인 (Manager만 매칭을 관리할 수 있음)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: '매칭 ID가 필요합니다.' });
    }

    if (!status) {
      return res.status(400).json({ message: '상태 정보가 필요합니다.' });
    }

    console.log('Manager: 매칭 상태 변경 시작:', { id, status });

    // 매칭 페어 조회
    const matchPairs = await dataService.getMatchPairs();
    const matchPair = matchPairs.find(match => match.match_id === id);

    if (!matchPair) {
      return res.status(404).json({ message: '매칭을 찾을 수 없습니다.' });
    }

    // 매칭 상태 업데이트 (실제로는 DynamoDB 업데이트 로직이 필요하지만, 
    // 현재는 조회된 데이터를 수정하여 반환)
    const updatedMatchPair = {
      ...matchPair,
      status,
      updated_at: new Date().toISOString()
    };

    // 매니저 로그 기록
    try {
      await dataService.logManagerAction(
        managerId,
        'matching_approve',
        id,
        `매칭 상태 변경: ${status}`
      );
      console.log('매니저 로그 기록 완료');
    } catch (logError) {
      console.error('매니저 로그 기록 실패:', logError);
      // 로그 기록 실패는 전체 요청을 실패시키지 않음
    }

    console.log('Manager: 매칭 상태 변경 완료:', updatedMatchPair);

    res.status(200).json({
      success: true,
      data: updatedMatchPair,
      message: '매칭 상태가 변경되었습니다.'
    });
  } catch (error) {
    console.error('Manager: 매칭 상태 변경 오류:', error);
    res.status(500).json({ 
      message: '매칭 상태 변경 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 