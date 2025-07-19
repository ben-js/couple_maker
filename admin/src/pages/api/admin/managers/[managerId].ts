import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../../../../config/aws';
import DataService from '../../../../lib/dataService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'dev_jwt_secret_key_here'; // login.ts와 동일한 시크릿 키

function getDefaultPermissions(role: string): Record<string, Record<string, boolean>> {
  const basePermissions = {
    user_management: { read: false, write: false, delete: false },
    matching_management: { read: false, write: false, delete: false },
    review_management: { read: false, write: false, delete: false },
    point_management: { read: false, write: false, delete: false },
    manager_management: { read: false, write: false, delete: false },
    manager_logs: { read: false, write: false, delete: false },
    dashboard: { read: false, write: false, delete: false }
  };

  switch (role) {
    case 'admin':
      return Object.keys(basePermissions).reduce((acc, key) => {
        acc[key] = { read: true, write: true, delete: true };
        return acc;
      }, {} as Record<string, Record<string, boolean>>);
    case 'manager':
      return {
        ...basePermissions,
        user_management: { read: true, write: true, delete: false },
        matching_management: { read: true, write: true, delete: false },
        point_management: { read: true, write: true, delete: false },
        manager_logs: { read: false, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false }
      };
    case 'support':
      return {
        ...basePermissions,
        user_management: { read: true, write: false, delete: false },
        matching_management: { read: true, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false }
      };
    default:
      return basePermissions;
  }
}

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);
const dataService = new DataService();

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
    // 개발 환경에서는 권한 검증 완화
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 개발 환경: 권한 검증 건너뜀');
    } else {
      // Admin 권한 확인 (admin 역할을 가진 Manager만 접근 가능)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    if (req.method === 'GET') {
      console.log(`Admin: 매니저 ${managerId} 조회 시작`);

      const params = {
        TableName: 'Managers',
        Key: { id: managerId }
      };

      const result = await dynamodb.send(new GetCommand(params));
      
      if (!result.Item) {
        console.log(`매니저 ${managerId}를 찾을 수 없습니다.`);
        return res.status(404).json({ message: 'Manager not found' });
      }

      const manager = {
        id: result.Item.id || '',
        email: result.Item.email || '',
        name: result.Item.name || '',
        role: result.Item.role || 'manager',
        status: result.Item.status || 'active',
        permissions: result.Item.permissions || getDefaultPermissions(result.Item.role || 'manager'),
        created_at: result.Item.createdAt || result.Item.created_at || new Date().toISOString(),
        updated_at: result.Item.updatedAt || result.Item.updated_at || new Date().toISOString()
      };

      console.log(`Admin: 매니저 ${managerId} 조회 완료`);
      res.status(200).json(manager);

    } else if (req.method === 'PATCH') {
      console.log(`Admin: 매니저 ${managerId} 업데이트 시작`);

      // 권한 검증 (자신의 이름만 변경하는 경우는 제외)
      const updateFields = req.body;
      const isOnlyNameUpdate = Object.keys(updateFields).length === 1 && updateFields.name;
      
      if (!isOnlyNameUpdate) {
        // 개발 환경에서는 권한 검증 완화
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 개발 환경: 권한 검증 건너뜀');
        } else {
          // Admin 권한 확인 (admin 역할을 가진 Manager만 접근 가능)
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
          
          // JWT 토큰에서 매니저 ID 추출하여 권한 확인
          try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            const currentManagerId = decoded.userId;
            
            // 자신의 정보가 아니고, admin 권한이 없는 경우 거부
            if (currentManagerId !== managerId && decoded.role !== 'admin') {
              return res.status(403).json({ message: '권한이 없습니다.' });
            }
          } catch (tokenError) {
            return res.status(401).json({ message: 'Invalid token' });
          }
        }
      } else {
        console.log('🔧 자신의 이름 변경: 권한 검증 건너뜀');
      }

      const updateParams: any = {
        TableName: 'Managers',
        Key: { id: managerId },
        UpdateExpression: 'SET updatedAt = :updated_at',
        ExpressionAttributeValues: {
          ':updated_at': new Date().toISOString()
        },
        ExpressionAttributeNames: {}
      };

      if (updateFields.name) {
        updateParams.UpdateExpression += ', #name = :name';
        updateParams.ExpressionAttributeNames['#name'] = 'name';
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
      if (updateFields.permissions) {
        updateParams.UpdateExpression += ', #perms = :permissions';
        updateParams.ExpressionAttributeNames['#perms'] = 'permissions';
        updateParams.ExpressionAttributeValues[':permissions'] = updateFields.permissions;
      }

      await dynamodb.send(new UpdateCommand(updateParams));

      // 업데이트된 데이터 조회
      const getParams = {
        TableName: 'Managers',
        Key: { id: managerId }
      };

      const result = await dynamodb.send(new GetCommand(getParams));
      
      if (!result.Item) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      const manager = {
        id: result.Item.id || '',
        email: result.Item.email || '',
        name: result.Item.name || '',
        role: result.Item.role || 'manager',
        status: result.Item.status || 'active',
        permissions: result.Item.permissions || getDefaultPermissions(result.Item.role || 'manager'),
        created_at: result.Item.createdAt || result.Item.created_at || new Date().toISOString(),
        updated_at: result.Item.updatedAt || result.Item.updated_at || new Date().toISOString()
      };

      console.log(`Admin: 매니저 ${managerId} 업데이트 완료`);
      res.status(200).json(manager);

    } else if (req.method === 'DELETE') {
      console.log(`Admin: 매니저 ${managerId} 삭제 시작`);

      // 삭제할 매니저 정보 조회
      const getParams = {
        TableName: 'Managers',
        Key: { id: managerId }
      };

      const managerResult = await dynamodb.send(new GetCommand(getParams));
      if (!managerResult.Item) {
        return res.status(404).json({ message: 'Manager not found' });
      }

      const managerToDelete = managerResult.Item;

      // 매니저 삭제
      const deleteParams = {
        TableName: 'Managers',
        Key: { id: managerId }
      };

      await dynamodb.send(new DeleteCommand(deleteParams));

      // 로그 기록
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          // 토큰에서 매니저 ID 추출 (실제로는 JWT 디코딩 필요)
          const currentManagerId = 'admin'; // 임시로 admin으로 설정
          
          await dataService.logManagerAction(
            currentManagerId,
            'manager_delete',
            managerId,
            `매니저 삭제: ${managerToDelete.name} (${managerToDelete.email})`
          );
        }
      } catch (logError) {
        console.error('로그 기록 실패:', logError);
        // 로그 기록 실패해도 삭제는 계속 진행
      }

      console.log(`Admin: 매니저 ${managerId} 삭제 완료`);
      res.status(200).json({ message: 'Manager deleted successfully' });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin: 매니저 관리 오류:', error);
    res.status(500).json({ 
      message: '매니저 관리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 