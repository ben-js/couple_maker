import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../../../config/aws';

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

interface Manager {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Manager | { message: string; error?: string }>
) {
  const { managerId } = req.query;

  if (!managerId || typeof managerId !== 'string') {
    return res.status(400).json({ message: 'Manager ID is required' });
  }

  try {
    // 개발 환경에서는 토큰 검증 완화
    if (process.env.NODE_ENV === 'production') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    if (req.method === 'GET') {
      console.log(`매니저 ${managerId} 조회 시작`);

      // 실제 DynamoDB 조회 (개발/프로덕션 모두)
      const params = {
        TableName: 'ManagerUsers', // 실제 테이블명 사용
        Key: { id: managerId }
      };

      const result = await dynamodb.send(new GetCommand(params));
      
      if (!result.Item) {
        console.log(`매니저 ${managerId}를 찾을 수 없습니다.`);
        return res.status(404).json({ message: 'Manager not found' });
      }

      // 매니저 데이터 정리
      const manager = {
        id: result.Item.id || result.Item.manager_id || '',
        email: result.Item.email || '',
        name: result.Item.name || '',
        role: result.Item.role || 'manager',
        created_at: result.Item.createdAt || result.Item.created_at || new Date().toISOString(),
        updated_at: result.Item.updatedAt || result.Item.updated_at || new Date().toISOString()
      };

      console.log(`매니저 ${managerId} 조회 완료`);
      res.status(200).json(manager);

    } else if (req.method === 'PATCH') {
      console.log(`매니저 ${managerId} 업데이트 시작`);

      // 실제 DynamoDB 업데이트 (개발/프로덕션 모두)
      const updateParams: any = {
        TableName: 'ManagerUsers', // 실제 테이블명 사용
        Key: { id: managerId },
        UpdateExpression: 'SET updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': new Date().toISOString()
        }
      };

      // 요청 본문에서 업데이트할 필드들 추가
      const updateFields = req.body;
      if (updateFields.name) {
        updateParams.UpdateExpression += ', name = :name';
        updateParams.ExpressionAttributeValues[':name'] = updateFields.name;
      }
      if (updateFields.email) {
        updateParams.UpdateExpression += ', email = :email';
        updateParams.ExpressionAttributeValues[':email'] = updateFields.email;
      }
      if (updateFields.role) {
        updateParams.UpdateExpression += ', role = :role';
        updateParams.ExpressionAttributeValues[':role'] = updateFields.role;
      }

      await dynamodb.send(new UpdateCommand(updateParams));

      // 업데이트된 데이터 조회
      const getParams = {
        TableName: 'ManagerUsers', // 실제 테이블명 사용
        Key: { id: managerId }
      };

      const result = await dynamodb.send(new GetCommand(getParams));
      
      if (!result.Item) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      // 매니저 데이터 정리
      const manager = {
        id: result.Item.id || result.Item.manager_id || '',
        email: result.Item.email || '',
        name: result.Item.name || '',
        role: result.Item.role || 'manager',
        created_at: result.Item.createdAt || result.Item.created_at || new Date().toISOString(),
        updated_at: result.Item.updatedAt || result.Item.updated_at || new Date().toISOString()
      };

      console.log(`매니저 ${managerId} 업데이트 완료`);
      res.status(200).json(manager);

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('매니저 조회/업데이트 오류:', error);
    res.status(500).json({ 
      message: '매니저 조회/업데이트 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 