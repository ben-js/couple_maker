import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../../config/aws';

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

interface ManagerLog {
  id: string;
  manager_email: string;
  manager_role: string;
  action: string;
  details?: string;
  ip_address: string;
  created_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ManagerLog[] | { message: string; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Manager 권한 확인 (Manager만 로그를 조회할 수 있음)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Manager: 활동 로그 조회 시작');

    // Manager 활동 로그 조회
    const params = {
      TableName: 'ManagerLogs', // ManagerLogs 테이블 사용
      Limit: 100 // 최대 100개
    };

    const result = await dynamodb.send(new ScanCommand(params));
    
    if (!result.Items) {
      console.log('Manager 활동 로그가 없습니다.');
      return res.status(200).json([]);
    }

    // 로그 데이터 정리 (ManagerLogs 테이블 구조에 맞게)
    const logs = result.Items.map((item: any) => ({
      id: item.id || '',
      manager_email: 'ben.js@datesense.app', // 기본 매니저 이메일
      manager_role: 'admin', // 기본 역할
      action: item.action || '기타',
      details: item.details || '',
      ip_address: item.ipAddress || '알 수 없음',
      created_at: item.createdAt || item.timestamp || new Date().toISOString()
    }));

    // 날짜순 정렬 (최신순)
    logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`Manager: 활동 로그 ${logs.length}건 조회 완료`);

    res.status(200).json(logs);
  } catch (error) {
    console.error('Manager: 활동 로그 조회 오류:', error);
    res.status(500).json({ 
      message: '활동 로그 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 