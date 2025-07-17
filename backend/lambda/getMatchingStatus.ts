import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    if (!userId) {
      console.log('userId가 없음');
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '사용자 ID가 필요합니다.'
        })
      };
    }

    // 현재 사용자의 매칭 상태 조회
    const [matchPairsResult, matchingRequestsResult] = await Promise.all([
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'MatchPairs',
          FilterExpression: 'user_id = :userId OR target_user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
      ),
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'MatchingRequests',
          FilterExpression: 'user_id = :userId OR target_user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
      )
    ]);

    const matchPairs = matchPairsResult.Items || [];
    const matchingRequests = matchingRequestsResult.Items || [];

    // 현재 활성 매칭 상태 결정
    let status = 'waiting';
    let matchedUser = null;
    let matchId = null;
    let myChoices = null;
    let otherChoices = null;

    if (matchPairs.length > 0) {
      const currentMatch = matchPairs[0]; // 가장 최근 매칭
      status = currentMatch.status || 'matched';
      matchId = currentMatch.match_id;
      
      // 매칭된 상대방 정보
      const otherUserId = currentMatch.user_id === userId ? currentMatch.target_user_id : currentMatch.user_id;
      
      // 상대방 프로필 조회
      const profileResult = await ddbDocClient.send(
        new ScanCommand({
          TableName: 'Profiles',
          FilterExpression: 'user_id = :otherUserId',
          ExpressionAttributeValues: {
            ':otherUserId': otherUserId
          }
        })
      );
      
      if (profileResult.Items && profileResult.Items.length > 0) {
        const profile = profileResult.Items[0];
        matchedUser = {
          userId: profile.user_id,
          name: profile.name,
          age: profile.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : null,
          location: profile.region,
          job: profile.job,
          education: profile.education,
          height: profile.height,
          bodyType: profile.body_type,
          smoking: profile.smoking,
          drinking: profile.drinking,
          religion: profile.religion,
          personality: profile.mbti,
          hobby: profile.interests,
          introduction: profile.introduction,
          photos: profile.photos || []
        };
      }
    }

    console.log('매칭 상태 조회 성공:', { 
      userId, 
      status, 
      hasMatchedUser: !!matchedUser,
      matchPairsCount: matchPairs.length,
      matchingRequestsCount: matchingRequests.length,
      executionTime: Date.now() - startTime 
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        status: status,
        matchedUser: matchedUser,
        matchId: matchId,
        myChoices: myChoices,
        otherChoices: otherChoices,
        hasPendingProposal: false, // 기본값
        proposalMatchId: null
      })
    };
  } catch (error: any) {
    console.error('매칭 상태 조회 오류:', { userId, error: error.message, stack: error.stack });
    
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    };
  }
}; 