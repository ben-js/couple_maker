import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';
import { User } from '../../../types/dataService';
import { dynamodb } from '../../../lib/dataService';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const dataService = new DataService();

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

    console.log('Manager: 사용자 목록 조회 시작');

    // DataService를 사용하여 사용자 목록 조회
    const users = await dataService.getUsers();
    // Scores 테이블 전체 Scan 후 user_id별 점수 존재 여부 집계
    const scoresResult = await dynamodb.send(new ScanCommand({ TableName: 'Scores', ProjectionExpression: 'user_id' }));
    const scoredUserIds = new Set((scoresResult.Items || []).map(item => item.user_id));
    
    if (!users || users.length === 0) {
      console.log('사용자 데이터가 없습니다.');
      return res.status(200).json([]);
    }

    console.log(`원본 사용자 데이터: ${users.length}명`);
    
    // 중복 이메일 검사
    const emailCounts: { [key: string]: number } = {};
    users.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });
    
    const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn('⚠️ 중복 이메일 발견:', duplicates);
    }

    // 사용자 데이터 가공
    const processedUsers = users.map(user => {
      let name = '';
      let role = 'customer_support';
      let email = user.email || '';
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
        email: email,
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

    console.log('Manager: 사용자 목록 조회 완료:', processedUsers.length, '명');

    res.status(200).json(processedUsers);
  } catch (error) {
    console.error('Manager: 사용자 목록 조회 오류:', error);
    res.status(500).json({ 
      message: '사용자 목록 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 