import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';

const dataService = new DataService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Manager 권한 확인 (Manager만 매칭을 관리할 수 있음)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Manager: 매칭 페어 목록 조회 시작');

    // DataService를 사용하여 매칭 페어 목록 조회
    const matchPairs = await dataService.getMatchPairs();
    
    if (!matchPairs || matchPairs.length === 0) {
      console.log('매칭 페어 데이터가 없습니다.');
      return res.status(200).json([]);
    }

    // 매칭 페어 데이터 가공
    const processedMatches = await Promise.all(matchPairs.map(async (match) => {
      // 사용자 이메일 조회
      let user1_email = 'N/A';
      let user2_email = 'N/A';
      
      try {
        const user1 = await dataService.getUserById(match.user1_id);
        const user2 = await dataService.getUserById(match.user2_id);
        
        if (user1) user1_email = user1.email;
        if (user2) user2_email = user2.email;
      } catch (error) {
        console.error('사용자 이메일 조회 실패:', error);
      }
      
      return {
        id: match.match_id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        user1_email,
        user2_email,
        status: match.status || 'pending',
        created_at: match.created_at,
        updated_at: match.updated_at
      };
    }));

    console.log('Manager: 매칭 페어 목록 조회 완료:', processedMatches.length, '개');

    // 쿼리 파라미터로 상태 조건 받기
    const { status } = req.query;

    let filteredMatches = processedMatches;
    if (status && status !== 'all') {
      filteredMatches = processedMatches.filter(match => match.status === status);
    }

    res.status(200).json(filteredMatches);
  } catch (error) {
    console.error('Manager: 매칭 페어 목록 조회 오류:', error);
    res.status(500).json({ 
      message: '매칭 페어 목록 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 