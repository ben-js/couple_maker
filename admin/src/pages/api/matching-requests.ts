import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../lib/dataService';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from '../../lib/dataService';

const dataService = new DataService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 개발 중 인증 우회
    // MatchingRequests 테이블에서 waiting 상태만 조회
    const params = {
      TableName: 'MatchingRequests',
    };
    const result = await dynamodb.send(new ScanCommand(params));
    const items = (result.Items || []).filter(item => item.status === 'waiting');
    res.status(200).json(items);
  } catch (error) {
    console.error('매칭 요청 목록 조회 오류:', error);
    res.status(500).json({ message: '매칭 요청 목록 조회 중 오류가 발생했습니다.' });
  }
} 