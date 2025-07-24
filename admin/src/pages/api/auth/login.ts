import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dataService from '../../../lib/dataService';
import { Manager } from '../../../types';

const JWT_SECRET = 'dev_jwt_secret_key_here'; // auth.ts와 동일한 시크릿 키

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // 디버깅 로그
    console.log('🔍 로그인 시도:', { 
      inputEmail: email, 
      inputPassword: password ? '***' : 'empty' 
    });

    try {
      // DynamoDB에서 매니저 계정 조회
      const manager: Manager | null = await dataService.getManagerByEmail(email);
      
      if (!manager) {
        console.log('❌ 매니저 계정 없음:', email);
        return res.status(401).json({ error: '로그인에 실패했습니다.' });
      }

      console.log('🔍 매니저 계정 조회 성공:', { 
        managerId: manager.id, 
        managerEmail: manager.email 
      });

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, manager.password);
      
      if (!isPasswordValid) {
        console.log('❌ 비밀번호 불일치');
        return res.status(401).json({ error: '로그인에 실패했습니다.' });
      }

      console.log('✅ 로그인 성공:', manager.email);

      // JWT 토큰 생성 (더 안전하게)
      const tokenPayload = {
        email: manager.email,
        role: manager.role,
        userId: manager.id,
        name: manager.name
      };

      console.log('🔍 토큰 페이로드:', tokenPayload);

      try {
        const token = jwt.sign(
          tokenPayload,
          JWT_SECRET,
          { 
            expiresIn: '24h',
            algorithm: 'HS256'
          }
        );

        console.log('🔍 생성된 토큰 길이:', token.length);
        console.log('🔍 토큰 파트 수:', token.split('.').length);
        console.log('🔍 토큰 시작 부분:', token.substring(0, 50) + '...');

        // 토큰 검증 테스트
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          console.log('✅ 토큰 검증 성공:', decoded);
        } catch (verifyError) {
          console.log('❌ 토큰 검증 실패:', verifyError);
        }

        res.status(200).json({
          success: true,
          data: {
            token,
            user: {
              id: manager.id,
              name: manager.name,
              email: manager.email,
              role: manager.role,
              permissions: manager.permissions
            }
          }
        });
      } catch (tokenError) {
        console.error('❌ 토큰 생성 실패:', tokenError);
        res.status(500).json({ error: '토큰 생성에 실패했습니다.' });
      }
      } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: '로그인에 실패했습니다.' });
    }
  } catch (error) {
    console.error('DynamoDB 조회 오류:', error);
    res.status(500).json({ error: '로그인에 실패했습니다.' });
  }
} 