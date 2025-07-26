import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../../lib/dataService';
import { verifyToken } from '../../../../lib/auth';

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

    // Manager 권한 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    const { date_address } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: '매칭 ID가 필요합니다.' });
    }

    if (!date_address || typeof date_address !== 'string') {
      return res.status(400).json({ message: '데이트 주소가 필요합니다.' });
    }

    console.log('Manager: 데이트 주소 업데이트 시작:', { id, date_address });

    // 매칭 페어 조회
    const matchPairs = await dataService.getMatchPairs();
    const matchPair = matchPairs.find(match => match.match_id === id);

    if (!matchPair) {
      return res.status(404).json({ message: '매칭을 찾을 수 없습니다.' });
    }

    // 양쪽 MatchingRequests의 date_address 업데이트
    try {
      await dataService.updateMatchingRequestDateAddress(matchPair.match_a_id, date_address);
      await dataService.updateMatchingRequestDateAddress(matchPair.match_b_id, date_address);
      
      console.log('✅ 양쪽 MatchingRequests date_address 업데이트 완료');
    } catch (updateError) {
      console.error('❌ MatchingRequests 업데이트 실패:', updateError);
      return res.status(500).json({ 
        message: '데이트 주소 업데이트 중 오류가 발생했습니다.',
        error: updateError instanceof Error ? updateError.message : 'Unknown error'
      });
    }

    // 매니저 로그 기록
    try {
      await dataService.logManagerAction(
        managerId,
        'date_address_update',
        id,
        `데이트 주소 업데이트: ${date_address}`
      );
      console.log('매니저 로그 기록 완료');
    } catch (logError) {
      console.error('매니저 로그 기록 실패:', logError);
      // 로그 기록 실패는 전체 요청을 실패시키지 않음
    }

    console.log('Manager: 데이트 주소 업데이트 완료:', { id, date_address });

    res.status(200).json({
      success: true,
      message: '데이트 주소가 업데이트되었습니다.',
      data: {
        match_id: id,
        date_address
      }
    });
  } catch (error) {
    console.error('Manager: 데이트 주소 업데이트 오류:', error);
    res.status(500).json({ 
      message: '데이트 주소 업데이트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 