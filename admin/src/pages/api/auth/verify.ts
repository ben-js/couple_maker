import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // 개발 중에는 토큰 검증을 건너뛰고 기본 사용자 정보 반환
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        id: 'manager_1752927754902_jdt96co74',
        email: 'ben.js@datesense.app',
        name: 'Ben Johnson',
        role: 'admin'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return res.status(200).json({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    });

  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
} 