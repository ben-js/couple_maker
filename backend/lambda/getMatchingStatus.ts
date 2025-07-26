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

    // 먼저 내 MatchingRequests 찾기
    const matchingRequestsResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'MatchingRequests',
        FilterExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );
    
    const matchingRequests = matchingRequestsResult.Items || [];
    const myRequest = matchingRequests.find((req: any) => req.user_id === userId);
    
    if (!myRequest) {
      console.log('내 MatchingRequests가 없음');
      return {
        statusCode: 200,
        headers: commonHeaders,
        body: JSON.stringify({
          success: true,
          status: 'none',
          matchedUser: null,
          matchId: null,
          myChoices: null,
          otherChoices: null,
          hasPendingProposal: false,
          proposalMatchId: null,
          proposalTargetId: null
        })
      };
    }
    
    const myRequestId = myRequest.request_id;
    
    // 내 request_id로 MatchPairs에서 match_a_id or match_b_id 확인
    const [matchPairsResult, proposalsResult] = await Promise.all([
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'MatchPairs',
          FilterExpression: 'match_a_id = :requestId OR match_b_id = :requestId',
          ExpressionAttributeValues: {
            ':requestId': myRequestId
          }
        })
      ),
      ddbDocClient.send(
        new ScanCommand({
          TableName: 'Proposals',
          FilterExpression: 'target_id = :userId AND #status = :pendingStatus',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':pendingStatus': 'pending'
          }
        })
      )
    ]);

    const matchPairs = matchPairsResult.Items || [];
    const pendingProposals = proposalsResult.Items || [];

    // pending 제안이 있는지 확인
    const hasPendingProposal = pendingProposals.length > 0;
    const proposalMatchId = hasPendingProposal ? pendingProposals[0].match_pair_id : null;
    const proposalTargetId = hasPendingProposal ? pendingProposals[0].target_id : null;

    // 현재 활성 매칭 상태 결정
    let status = 'waiting';
    let matchedUser = null;
    let matchId: string | null = null;
    let myChoices: { dates: string[]; locations: string[] } | null = null;
    let otherChoices: { dates: string[]; locations: string[] } | null = null;
    
    // 내 요청의 상태를 사용
    status = myRequest.status || 'waiting';
    
    // 내 선택 설정
    if (myRequest.date_choices) {
      myChoices = {
        dates: myRequest.date_choices.dates || [],
        locations: myRequest.date_choices.locations || []
      };
    }
    
    // MatchPairs가 있는 경우 (매칭된 상태)
    if (matchPairs.length > 0) {
      const currentMatch = matchPairs[0];
      matchId = currentMatch.match_id;
      
      // 상대방 MatchingRequests ID 찾기 (MatchPairs에서)
      const otherRequestId = currentMatch.match_a_id === myRequestId ? currentMatch.match_b_id : currentMatch.match_a_id;
      
      console.log('🔍 상대방 조회 정보:', {
        currentMatch,
        userId,
        myRequestId,
        otherRequestId,
        match_a_id: currentMatch.match_a_id,
        match_b_id: currentMatch.match_b_id
      });
      
      // 상대방 MatchingRequests 조회
      const otherRequestResult = await ddbDocClient.send(
        new ScanCommand({
          TableName: 'MatchingRequests',
          FilterExpression: 'request_id = :requestId',
          ExpressionAttributeValues: {
            ':requestId': otherRequestId
          }
        })
      );
      const otherRequest = otherRequestResult.Items?.[0] || null;
      
      console.log('🔍 상대방 MatchingRequests 조회 결과:', {
        otherRequestId,
        otherRequest,
        itemsCount: otherRequestResult.Items?.length || 0
      });
      
      if (otherRequest && otherRequest.date_choices) {
        otherChoices = {
          dates: otherRequest.date_choices.dates || [],
          locations: otherRequest.date_choices.locations || []
        };
      }
      
      // 상대방 프로필 조회
      if (otherRequest) {
        const profileResult = await ddbDocClient.send(
          new ScanCommand({
            TableName: 'Profiles',
            FilterExpression: 'user_id = :otherUserId',
            ExpressionAttributeValues: {
              ':otherUserId': otherRequest.user_id
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
    }

    console.log('매칭 상태 조회 성공:', { 
      userId, 
      status, 
      hasMatchedUser: !!matchedUser,
      matchPairsCount: matchPairs.length,
      matchingRequestsCount: matchingRequests.length,
      myChoices,
      otherChoices,
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
        finalDate: myRequest.final_date || null,
        finalLocation: myRequest.final_location || null,
        dateAddress: myRequest.date_address || null,
        hasPendingProposal: hasPendingProposal,
        proposalMatchId: proposalMatchId,
        proposalTargetId: proposalTargetId
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