import type { NextApiRequest, NextApiResponse } from 'next';
import { dynamodb } from '../../../../lib/dataService';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }
  try {
    const params = {
      TableName: 'UserStatusHistory',
      KeyConditionExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false, // 최신순 정렬
    };
    const result = await dynamodb.send(new QueryCommand(params));
    res.status(200).json({ success: true, history: result.Items || [] });
  } catch (e: any) {
    res.status(500).json({ success: false, message: 'DB 조회 오류', error: e.message });
  }
} 