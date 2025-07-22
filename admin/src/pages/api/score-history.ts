import type { NextApiRequest, NextApiResponse } from 'next';
import { dynamodb } from '../../lib/dataService';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }
  try {
    const result = await dynamodb.send(new QueryCommand({
      TableName: 'ScoreHistory',
      KeyConditionExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
    }));
    res.status(200).json({ items: result.Items || [] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch score history' });
  }
} 