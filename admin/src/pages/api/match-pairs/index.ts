import { NextApiRequest, NextApiResponse } from 'next';
import dataService from '../../../lib/dataService';

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

    const { requestId } = req.query;

    // requestId가 있으면 특정 MatchPair 조회
    if (requestId) {
      console.log('Manager: 특정 MatchPair 조회 시작 - requestId:', requestId);
      
      try {
        const matchPair = await dataService.getMatchPairByRequestId(requestId as string);
        
        if (!matchPair) {
          return res.status(404).json({ message: 'MatchPair not found' });
        }
        
        try {
          const user1 = await dataService.getUserById(matchPair.match_a_user_id);
          const user2 = await dataService.getUserById(matchPair.match_b_user_id);
        } catch (error) {
          console.error('사용자 이메일 조회 실패:', error);
        }

        const processedMatch = {
          match_id: matchPair.match_id,
          match_a_user_id: matchPair.match_a_user_id,
          match_b_user_id: matchPair.match_b_user_id,
          match_a_id: matchPair.match_a_id,
          match_b_id: matchPair.match_b_id,
          confirm_proposed: matchPair.confirm_proposed,
          created_at: matchPair.created_at,
          updated_at: matchPair.updated_at
        };

        console.log('Manager: 특정 MatchPair 조회 완료:', processedMatch);
        return res.status(200).json({ matchPair: processedMatch });
      } catch (error) {
        console.error('Manager: 특정 MatchPair 조회 오류:', error);
        return res.status(500).json({ 
          message: 'MatchPair 조회 중 오류가 발생했습니다.',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
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
             return {
         id: match.match_id,
         user1_id: match.match_a_user_id,
         user2_id: match.match_b_user_id,
         confirm_proposed: match.confirm_proposed,
         created_at: match.created_at,
         updated_at: match.updated_at
       };
    }));

    console.log('Manager: 매칭 페어 목록 조회 완료:', processedMatches.length, '개');

    // 쿼리 파라미터로 상태 조건 받기
    const { status } = req.query;

    let filteredMatches = processedMatches;
    if (status && status !== 'all') {
      filteredMatches = processedMatches.filter(match => {
        if (status === 'matched') return match.confirm_proposed;
        if (status === 'pending') return !match.confirm_proposed;
        return true;
      });
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