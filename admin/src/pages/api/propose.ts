import { NextApiRequest, NextApiResponse } from 'next';
import { dynamodb } from '../../lib/dataService';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { fromUserId, toUserId, requestId, managerId } = req.body;
    if (!fromUserId || !toUserId || !requestId || !managerId) {
      return res.status(400).json({ message: '필수 값 누락' });
    }
    const now = new Date().toISOString();
    const item = {
      propose_id: `${requestId}_${toUserId}`,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      request_id: requestId,
      manager_id: managerId,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };
    await dynamodb.send(new PutCommand({ TableName: 'Propose', Item: item }));
    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Propose 등록 오류:', error);
    res.status(500).json({ message: 'Propose 등록 중 오류 발생', error: error.message });
  }
} 