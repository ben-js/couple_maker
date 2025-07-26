import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const PROPOSALS_TABLE = 'Proposals';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { proposeUserId, targetId } = req.query;
  
  try {
    let result;
    
    if (proposeUserId) {
      // 제안한 사용자별 조회
      result = await dynamodb.query({
        TableName: PROPOSALS_TABLE,
        IndexName: 'propose-user-index',
        KeyConditionExpression: 'propose_user_id = :uid',
        ExpressionAttributeValues: { ':uid': proposeUserId },
      }).promise();
    } else if (targetId) {
      // 제안받은 사용자별 조회
      result = await dynamodb.query({
        TableName: PROPOSALS_TABLE,
        IndexName: 'target-user-index',
        KeyConditionExpression: 'target_id = :uid',
        ExpressionAttributeValues: { ':uid': targetId },
      }).promise();
    } else {
      // 전체 조회 (기본값)
      result = await dynamodb.scan({
        TableName: PROPOSALS_TABLE,
      }).promise();
    }
    
    res.status(200).json({ proposals: result.Items || [] });
  } catch (e: any) {
    console.error('❌ Proposals API 에러:', e);
    res.status(500).json({ error: e.message || 'Internal server error' });
  }
} 