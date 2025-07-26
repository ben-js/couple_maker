import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import dataService from '../../../lib/dataService';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const MATCHING_REQUESTS_TABLE = 'MatchingRequests';
const MATCH_PAIRS_TABLE = 'MatchPairs';
const PROPOSALS_TABLE = 'Proposals';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { requestId, applicantId, candidateId, managerId } = req.body;
    if (!requestId || !applicantId || !candidateId || !managerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // 1. 후보가 MatchingRequests에 있는지 확인
    const candidateReqResult = await dynamodb.query({
      TableName: MATCHING_REQUESTS_TABLE,
      IndexName: 'user-index',
      KeyConditionExpression: 'user_id = :uid',
      ExpressionAttributeValues: { ':uid': candidateId },
    }).promise();
    const candidateRequest = (candidateReqResult.Items || [])[0];
    // 2. 신청자 MatchingRequests 가져오기
    const applicantReqResult = await dynamodb.get({
      TableName: MATCHING_REQUESTS_TABLE,
      Key: { request_id: requestId },
    }).promise();
    const applicantRequest = applicantReqResult.Item;
    // 3. MatchPairs 생성
    const match_id = 'match-' + uuidv4();
    let match_a_id = requestId;
    let match_a_user_id = applicantRequest.user_id;
    let match_b_id = candidateRequest ? candidateRequest.request_id : null; // 후보가 신청자가 아니면 null (제안 수락 후 업데이트)
    let match_b_user_id = candidateId; // 항상 candidateId로 설정
    const now = new Date().toISOString();
    await dynamodb.put({
      TableName: MATCH_PAIRS_TABLE,
      Item: {
        match_id,
        match_a_id,
        match_a_user_id,
        match_b_id,
        match_b_user_id,
        is_proposed: !candidateRequest, // 신청자가 아니면 제안
        confirm_proposed: false,
        attempt_count: 0,
        both_interested: null,
        created_at: now,
        updated_at: now,
      },
    }).promise();
    // 4. 상태 변경/Proposals 생성
    if (candidateRequest) {
      // 4-1. 후보가 신청자: 둘 다 matched로 변경
      await Promise.all([
        dynamodb.update({
          TableName: MATCHING_REQUESTS_TABLE,
          Key: { request_id: requestId },
          UpdateExpression: 'SET #status = :matched, match_pair_id = :mid, partner_id = :pid, updated_at = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':matched': 'matched', ':mid': match_id, ':pid': candidateId, ':now': now },
        }).promise(),
        dynamodb.update({
          TableName: MATCHING_REQUESTS_TABLE,
          Key: { request_id: candidateRequest.request_id },
          UpdateExpression: 'SET #status = :matched, match_pair_id = :mid, partner_id = :pid, updated_at = :now',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':matched': 'matched', ':mid': match_id, ':pid': applicantId, ':now': now },
        }).promise(),
      ]);
    } else {
      // 4-2. 후보가 신청자가 아님: Proposals(pending)만 생성 (신청자 MatchingRequests 상태 변경 X)
      const proposal_id = 'proposal-' + uuidv4();
      await dynamodb.put({
        TableName: PROPOSALS_TABLE,
        Item: {
          proposal_id,
          proposer_id: managerId,
          target_id: candidateId,
          propose_user_id: applicantId, // 신청자 ID 추가
          match_pair_id: match_id,
          is_manual: true,
          status: 'pending',
          responded_at: null,
          reason: '매니저 수동 매칭',
          created_at: now,
          updated_at: now,
        },
      }).promise();
      
      // 4-3. 매칭 제안을 한 유저를 MatchingRecommendations에서 제거
      try {
        await dynamodb.delete({
          TableName: 'MatchingRecommendations',
          Key: {
            request_id: requestId,
            recommended_user_id: candidateId
          }
        }).promise();
        console.log(`매칭 제안 후 MatchingRecommendations에서 제거: ${candidateId}`);
      } catch (error) {
        console.error('MatchingRecommendations에서 제거 실패:', error);
        // 제거 실패해도 매칭은 계속 진행
      }
      
      // 신청자 MatchingRequests 상태는 변경하지 않음!
    }
    return res.status(200).json({ ok: true, match_id });
  } catch (error: any) {
    console.error('매칭 API 에러:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 