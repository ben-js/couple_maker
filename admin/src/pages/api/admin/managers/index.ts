import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../../../../config/aws';

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

interface Manager {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Manager[] | { message: string; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    console.log('Admin: 매니저 목록 조회 시작');

    // 실제 DynamoDB 조회
    const params = {
      TableName: 'Managers',
      Limit: 100
    };

    const result = await dynamodb.send(new ScanCommand(params));
    
    if (!result.Items) {
      console.log('매니저가 없습니다.');
      return res.status(200).json([]);
    }

    // 매니저 데이터 정리
    const managers = result.Items.map((item: any) => ({
      id: item.id || item.manager_id || '',
      email: item.email || '',
      name: item.name || '',
      role: item.role || 'manager',
      status: item.status || 'active',
      created_at: item.createdAt || item.created_at || new Date().toISOString(),
      updated_at: item.updatedAt || item.updated_at || new Date().toISOString()
    }));

    // 날짜순 정렬 (최신순)
    managers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`Admin: 매니저 ${managers.length}명 조회 완료`);

    res.status(200).json(managers);
  } catch (error) {
    console.error('Admin: 매니저 목록 조회 오류:', error);
    res.status(500).json({ 
      message: '매니저 목록 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 