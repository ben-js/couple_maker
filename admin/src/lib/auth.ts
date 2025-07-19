import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Manager } from '../types/dataService';
import DataService from './dataService';

const JWT_SECRET = 'dev_jwt_secret_key_here'; // 일관된 시크릿 키 사용
const dataService = new DataService();

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'manager' | 'super_manager' | 'support';
  createdAt: string;
  permissions: Record<string, Record<string, boolean>>;
}

export interface AuthenticatedRequest extends NextApiRequest {
  admin?: AdminUser;
}

export function withAuth(handler: any) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const token = req.cookies.adminToken;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
      req.admin = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function generateToken(admin: AdminUser): string {
  return jwt.sign(
    { 
      id: admin.id, 
      email: admin.email, 
      username: admin.username, 
      role: admin.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function verifyToken(token: string): any {
  console.log('토큰 검증 시작');
  console.log('JWT_SECRET:', JWT_SECRET);
  console.log('토큰 길이:', token.length);
  console.log('토큰 시작 부분:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('토큰 검증 성공:', decoded);
    return decoded;
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return null;
  }
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  try {
    // AWS 환경 변수 디버깅
    console.log('환경 변수 확인:', {
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '설정됨' : '설정되지 않음',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '설정됨' : '설정되지 않음',
      NODE_ENV: process.env.NODE_ENV
    });

    // AWS 환경 변수가 없으면 오류 반환
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS 자격 증명이 설정되지 않았습니다.');
      console.error('AWS_ACCESS_KEY_ID 존재:', !!process.env.AWS_ACCESS_KEY_ID);
      console.error('AWS_SECRET_ACCESS_KEY 존재:', !!process.env.AWS_SECRET_ACCESS_KEY);
      return null;
    }

    // DataService를 사용하여 매니저 계정 조회
    const manager = await dataService.getManagerByEmail(email);
    
    if (!manager) {
      console.log('사용자를 찾을 수 없습니다:', email);
      return null;
    }

    console.log('찾은 매니저:', { id: manager.id, email: manager.email, role: manager.role });

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, manager.password);
    
    if (!isValidPassword) {
      console.log('비밀번호가 일치하지 않습니다.');
      return null;
    }

    // 권한 정보 파싱 (DynamoDB에서 가져온 형식에 맞게)
    let permissions = {};
    if (manager.role) {
      try {
        // 역할에 따른 기본 권한 설정
        switch (manager.role) {
          case 'admin':
            permissions = {
              dashboard: { read: true, write: true, delete: true },
              user_management: { read: true, write: true, delete: true },
              matching_management: { read: true, write: true, delete: true },
              review_management: { read: true, write: true, delete: true },
              point_management: { read: true, write: true, delete: true },
              manager_management: { read: true, write: true, delete: true },
              admin_logs: { read: true, write: true, delete: true }
            };
            break;
          case 'manager':
            permissions = {
              dashboard: { read: true, write: false, delete: false },
              user_management: { read: true, write: true, delete: false },
              matching_management: { read: true, write: true, delete: false },
              review_management: { read: true, write: true, delete: false },
              point_management: { read: true, write: true, delete: false },
              manager_management: { read: true, write: false, delete: false },
              admin_logs: { read: true, write: false, delete: false }
            };
            break;
          case 'support':
            permissions = {
              dashboard: { read: true, write: false, delete: false },
              user_management: { read: true, write: false, delete: false },
              matching_management: { read: true, write: false, delete: false },
              review_management: { read: true, write: false, delete: false },
              point_management: { read: true, write: false, delete: false },
              manager_management: { read: true, write: false, delete: false },
              admin_logs: { read: true, write: false, delete: false }
            };
            break;
          default:
            permissions = {
              dashboard: { read: true, write: false, delete: false },
              user_management: { read: true, write: false, delete: false },
              matching_management: { read: true, write: false, delete: false },
              review_management: { read: true, write: false, delete: false },
              point_management: { read: true, write: false, delete: false },
              manager_management: { read: true, write: false, delete: false },
              admin_logs: { read: true, write: false, delete: false }
            };
        }
      } catch (error) {
        console.error('권한 파싱 오류:', error);
        // 기본 권한 설정
        permissions = {
          dashboard: { read: true, write: false, delete: false },
          user_management: { read: true, write: false, delete: false },
          matching_management: { read: true, write: false, delete: false },
          review_management: { read: true, write: false, delete: false },
          point_management: { read: true, write: false, delete: false },
          manager_management: { read: true, write: false, delete: false },
          admin_logs: { read: true, write: false, delete: false }
        };
      }
    }

    return {
      id: manager.id,
      email: manager.email,
      username: manager.name || manager.email.split('@')[0],
      role: manager.role as 'admin' | 'manager' | 'super_manager' | 'support',
      createdAt: manager.created_at,
      permissions
    };
  } catch (error) {
    console.error('매니저 인증 오류:', error);
    return null;
  }
} 