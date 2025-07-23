import { NextApiRequest, NextApiResponse } from 'next';
import { dynamodb } from '../../../lib/dataService';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { requestId } = req.query;
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ message: 'requestId가 필요합니다.' });
    }
    const result = await dynamodb.send(new GetCommand({
      TableName: 'MatchingRequests',
      Key: { request_id: requestId }
    }));
    if (!result.Item) {
      return res.status(404).json({ message: '매칭 요청을 찾을 수 없습니다.' });
    }
    res.status(200).json(result.Item);
  } catch (error) {
    res.status(500).json({ message: '매칭 요청 상세 조회 중 오류 발생', error: error.message });
  }
} 