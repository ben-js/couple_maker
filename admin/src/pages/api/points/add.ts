import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../../../config/aws';
import DataService from '../../../lib/dataService';
import { verifyToken } from '../../../lib/auth';

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);
const dataService = new DataService();

interface AddPointsRequest {
  userId: string;
  points: number;
  reason: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string; error?: string }>
) {
  if (req.method !== 'POST') {
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

    // Manager 권한 확인 (Manager만 포인트를 관리할 수 있음)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, points, reason }: AddPointsRequest = req.body;

    if (!userId || !points || !reason) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    if (points <= 0) {
      return res.status(400).json({ message: '포인트는 0보다 커야 합니다.' });
    }

    console.log('Manager: 포인트 추가 시작:', { userId, points, reason });

    // 사용자 정보 조회
    const userParams = {
      TableName: 'Users',
      Key: { user_id: userId }
    };

    const userResult = await dynamodb.send(new GetCommand(userParams));
    
    if (!userResult.Item) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const currentPoints = userResult.Item.points || 0;
    const newBalance = currentPoints + points;

    // 포인트 히스토리 추가
    const historyId = `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const historyParams = {
      TableName: 'PointHistory',
      Item: {
        id: historyId,
        user_id: userId,
        amount: points,
        type: 'manager_add',
        description: reason,
        balance_after: newBalance,
        created_at: new Date().toISOString()
      }
    };

    // 사용자 포인트 업데이트
    const updateParams = {
      TableName: 'Users',
      Key: { user_id: userId },
      UpdateExpression: 'SET points = :points, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':points': newBalance,
        ':updated_at': new Date().toISOString()
      }
    };

    // 트랜잭션으로 처리
    await Promise.all([
      dynamodb.send(new PutCommand(historyParams)),
      dynamodb.send(new UpdateCommand(updateParams))
    ]);

    // 매니저 로그 기록
    try {
      await dataService.logManagerAction(
        managerId,
        'point_adjust',
        userId,
        `포인트 추가: +${points}P (사유: ${reason})`
      );
      console.log('매니저 로그 기록 완료');
    } catch (logError) {
      console.error('매니저 로그 기록 실패:', logError);
      // 로그 기록 실패는 전체 요청을 실패시키지 않음
    }

    console.log(`Manager: 포인트 추가 완료: 사용자 ${userId}에게 ${points}포인트 추가 (사유: ${reason})`);

    res.status(200).json({ message: '포인트가 성공적으로 추가되었습니다.' });
  } catch (error) {
    console.error('Manager: 포인트 추가 오류:', error);
    res.status(500).json({ 
      message: '포인트 추가 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 