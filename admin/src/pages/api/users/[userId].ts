import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';
import { verifyToken } from '../../../lib/auth';

const dataService = new DataService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API 호출 시작:', req.method, req.url);
  console.log('쿼리 파라미터:', req.query);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 토큰 검증 - 개발 중 임시 우회
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('토큰 존재 여부:', !!token);
    
    // 개발 중에는 토큰 검증을 완전히 우회
    console.log('개발 중 토큰 검증 우회');
    
    const { userId } = req.query;
    console.log('요청된 userId:', userId);
    
    if (!userId || typeof userId !== 'string') {
      console.log('userId가 유효하지 않음:', userId);
      return res.status(400).json({ success: false, message: '사용자 ID가 필요합니다.' });
    }

    // 사용자 정보 조회
    console.log('DataService.getUserById 호출 시작');
    const user = await dataService.getUserById(userId);
    console.log('사용자 조회 결과:', !!user);
    console.log('사용자 데이터:', user);
    
    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자 매칭 히스토리 조회
    const matchingHistory = await dataService.getMatchingHistory();
    const userMatchingHistory = matchingHistory.filter(
      match => match.user1_id === userId || match.user2_id === userId
    );

    // 사용자 리뷰 조회
    const reviews = await dataService.getReviews();
    const userReviews = reviews.filter(review => review.user_id === userId);

    // 사용자 포인트 히스토리 조회
    const pointHistory = await dataService.getPointHistory();
    const userPointHistory = pointHistory.filter(point => point.user_id === userId);

    // 사용자 상태 히스토리 조회
    const statusHistory = await dataService.getUserStatusHistory();
    const userStatusHistory = statusHistory.filter(status => status.user_id === userId);

    // 사용자 프로필 조회
    const userProfile = await dataService.getUserProfile(userId);
    console.log('사용자 프로필:', userProfile);

    // 사용자 선호도 조회
    const userPreferences = await dataService.getUserPreferences(userId);
    console.log('사용자 선호도:', userPreferences);

    // 응답 데이터 구성
    const responseData = {
      user: {
        user_id: user.user_id,
        email: user.email,
        status: user.status === 'green' ? 'active' : 
                user.status === 'yellow' ? 'inactive' : 
                user.status === 'red' ? 'suspended' : 
                user.status === 'black' ? 'black' : 'active',
        grade: user.grade || 'general',
        points: user.points || 0,
        created_at: user.created_at,
        updated_at: user.updated_at,
        has_profile: user.has_profile || false,
        has_preferences: user.has_preferences || false,
        is_verified: user.is_verified || false,
        is_deleted: user.is_deleted || false,
        profile: userProfile, // 프로필 정보 추가
        preferences: userPreferences // 선호도 정보 추가
      },
      matchingHistory: userMatchingHistory.map(match => ({
        id: match.id,
        user1_id: match.user1_id,
        user2_id: match.user2_id,
        status: match.status,
        created_at: match.created_at,
        updated_at: match.updated_at
      })),
      reviews: userReviews.map(review => ({
        id: review.id,
        user_id: review.user_id,
        target_user_id: review.target_user_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      })),
      pointHistory: userPointHistory.map(point => ({
        id: point.id,
        user_id: point.user_id,
        amount: point.amount,
        type: point.type,
        description: point.description,
        created_at: point.created_at
      })),
      statusHistory: userStatusHistory.map(status => ({
        id: status.id,
        user_id: status.user_id,
        status: status.status,
        reason: status.reason,
        created_at: status.created_at
      }))
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('사용자 상세 정보 조회 오류:', error);
    console.error('오류 상세 정보:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '사용자 정보를 불러올 수 없습니다.',
      error: error.message
    });
  }
} 