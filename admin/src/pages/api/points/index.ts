import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../../../config/aws';

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

interface PointHistoryRecord {
  id?: string;
  point_history_id?: string;
  user_id: string;
  amount?: number;
  points?: number;
  type?: string;
  description?: string;
  reason?: string;
  balance_after?: number;
  balance?: number;
  created_at?: string;
  createdAt?: string;
}

interface PointHistoryWithUser {
  id: string;
  user_id: string;
  user_email: string;
  points: number;
  type: string;
  reason: string;
  balance_after: number;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PointHistoryWithUser[] | { message: string; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Manager 권한 확인 (Manager만 포인트를 관리할 수 있음)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Manager: 포인트 히스토리 조회 시작');

    // 포인트 히스토리 조회
    const params = {
      TableName: 'PointHistory',
      Limit: 100 // 최대 100개
    };

    const result = await dynamodb.send(new ScanCommand(params));
    
    if (!result.Items) {
      return res.status(200).json([]);
    }

    // 사용자 정보와 함께 포인트 히스토리 구성
    const pointHistoryWithUsers = await Promise.all(
      result.Items.map(async (pointRecord: any) => {
        try {
          // 사용자 정보 조회
          const userParams = {
            TableName: 'Users',
            Key: { user_id: pointRecord.user_id }
          };
          const userResult = await dynamodb.send(new GetCommand(userParams));
          
          return {
            id: pointRecord.id || pointRecord.point_history_id || '',
            user_id: pointRecord.user_id,
            user_email: userResult.Item?.email || '알 수 없음',
            points: pointRecord.amount || pointRecord.points || 0,
            type: pointRecord.type || '기타',
            reason: pointRecord.description || pointRecord.reason || '',
            balance_after: pointRecord.balance_after || pointRecord.balance || 0,
            createdAt: pointRecord.created_at || pointRecord.createdAt || new Date().toISOString()
          };
        } catch (error) {
          console.error('사용자 정보 조회 실패:', error);
          return {
            id: pointRecord.id || pointRecord.point_history_id || '',
            user_id: pointRecord.user_id,
            user_email: '알 수 없음',
            points: pointRecord.amount || pointRecord.points || 0,
            type: pointRecord.type || '기타',
            reason: pointRecord.description || pointRecord.reason || '',
            balance_after: pointRecord.balance_after || pointRecord.balance || 0,
            createdAt: pointRecord.created_at || pointRecord.createdAt || new Date().toISOString()
          };
        }
      })
    );

    // 날짜순 정렬 (최신순)
    pointHistoryWithUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('Manager: 포인트 히스토리 조회 완료:', pointHistoryWithUsers.length, '개');

    res.status(200).json(pointHistoryWithUsers);
  } catch (error) {
    console.error('Manager: 포인트 히스토리 조회 오류:', error);
    res.status(500).json({ 
      message: '포인트 히스토리 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 