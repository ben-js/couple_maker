import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AWS_CONFIG from '../../../config/aws';

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

const client = new DynamoDBClient(AWS_CONFIG);

const dynamodb = DynamoDBDocumentClient.from(client);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 개발 환경에서는 권한 검증 완화
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 개발 환경: 권한 검증 건너뜀');
    } else {
      // 권한 확인
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

      // 권한이 있는지 확인 (super_admin 또는 admin만 등록 가능)
      if (decoded.role !== 'super_admin' && decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }

    const { name, email, password, role } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 이메일 중복 확인
    const existingUser = await dynamodb.send(new ScanCommand({
      TableName: 'Managers',
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    if (existingUser.Items && existingUser.Items.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 매니저 생성
    const managerRole = role || 'manager';
    const newManager = {
      id: `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: hashedPassword,
      role: managerRole,
      status: 'active',
      permissions: getDefaultPermissions(managerRole),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdBy: process.env.NODE_ENV === 'development' ? 'system' : 'admin'
    };

    await dynamodb.send(new PutCommand({
      TableName: 'Managers',
      Item: newManager
    }));

    // 비밀번호 제외하고 응답
    const { password: _, ...managerWithoutPassword } = newManager;
    res.status(201).json(managerWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register admin' });
  }
} 