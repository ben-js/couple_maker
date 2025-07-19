import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
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
  res: NextApiResponse<Manager[] | Manager | { message: string; error?: string }>
) {
  try {
    if (req.method === 'GET') {
      // Manager가 자신의 정보를 조회하거나, Admin이 모든 Manager를 조회
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      console.log('Manager: 계정 정보 조회 시작');

      // 실제 DynamoDB 조회
      const params = {
        TableName: 'ManagerUsers',
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
        created_at: item.createdAt || item.created_at || new Date().toISOString(),
        updated_at: item.updatedAt || item.updated_at || new Date().toISOString()
      }));

      console.log(`Manager: ${managers.length}명의 매니저 정보 조회 완료`);
      res.status(200).json(managers);

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Manager: 계정 정보 조회 오류:', error);
    res.status(500).json({ 
      message: '계정 정보 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 