import { NextApiRequest, NextApiResponse } from 'next';
import dataService from '../../../lib/dataService';
import { User } from '../../../types/dataService';
import { dynamodb } from '../../../lib/dataService';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | { message: string; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Manager 권한 확인 (Manager만 User를 관리할 수 있음)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // DataService를 사용하여 사용자 목록 조회
    const users = await dataService.getUsersWithScoreAndProfile();
    // Scores 테이블 전체 Scan 후 user_id별 점수 존재 여부 집계
    const scoresResult = await dynamodb.send(new ScanCommand({ TableName: 'Scores', ProjectionExpression: 'user_id' }));
    const scoredUserIds = new Set((scoresResult.Items || []).map(item => item.user_id));
    
    if (!users || users.length === 0) {
      return res.status(200).json([]);
    }

    // 쿼리 파라미터로 검색 조건 받기
    const { email, status, grade, score } = req.query;

    // 사용자 데이터 가공
    let processedUsers = users.map(user => {
      let name = '';
      let role = 'customer_support';
      let emailVal = user.email || '';
      if (user.email) {
        const emailName = user.email.split('@')[0];
        name = emailName.includes('.') 
          ? emailName.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
          : emailName.charAt(0).toUpperCase() + emailName.slice(1);
        if (user.email.includes('manager')) {
          role = 'manager';
        } else if (user.email.includes('admin') || user.email.includes('datesense.app')) {
          role = 'admin';
        }
      }
      return {
        user_id: user.user_id,
        email: emailVal,
        name: name,
        role: role,
        status: user.status === 'green' ? 'active' : user.status === 'yellow' ? 'inactive' : user.status === 'red' ? 'suspended' : user.status === 'black' ? 'black' : 'active',
        grade: user.grade || 'general',
        points: user.points || 0,
        created_at: user.created_at,
        updated_at: user.updated_at,
        has_profile: user.has_profile || false,
        has_preferences: user.has_preferences || false,
        is_verified: user.is_verified || false,
        is_deleted: user.is_deleted || false,
        has_score: scoredUserIds.has(user.user_id), // 점수 작성 여부
      };
    });

    // email, status, grade로 필터링
    if (email) {
      processedUsers = processedUsers.filter(user => user.email && user.email.toLowerCase().includes((email as string).toLowerCase()));
    }
    if (status && status !== 'all') {
      processedUsers = processedUsers.filter(user => user.status === status);
    }
    if (grade && grade !== 'all') {
      processedUsers = processedUsers.filter(user => user.grade === grade);
    }
    // 점수입력 필터
    if (score === 'scored') {
      processedUsers = processedUsers.filter(user => user.has_score === true);
    } else if (score === 'not_scored') {
      processedUsers = processedUsers.filter(user => user.has_score === false);
    }

    // created_at 기준 내림차순 정렬
    processedUsers.sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    res.status(200).json(processedUsers);
  } catch (error) {
    res.status(500).json({ 
      message: '사용자 목록 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 