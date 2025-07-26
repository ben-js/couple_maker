require('dotenv').config();
/**
 * Express Development Server - Date Sense Backend API
 * @module local-server
 * @description 개발 환경에서 빠른 응답을 제공하는 Express 서버
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const authService = require('./services/authService');
const profileService = require('./services/profileService');
const preferenceService = require('./services/preferenceService');
const s3Service = require('./services/s3Service');
const matchingService = require('./services/matchingService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const AWS_CONFIG = require('./config/aws');

// AWS 설정
console.log('🔧 AWS 환경 변수 확인:', {
  region: AWS_CONFIG.region,
  hasAccessKey: true,
  hasSecretKey: true
});

const dynamoClient = new DynamoDBClient(AWS_CONFIG);

const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();

// CORS 설정
app.use(cors(config.cors));
app.use(express.json());

// API 호출 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

/**
 * 로그인 API
 * POST /login
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await authService.login(email, password);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
    
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로필 조회 API
 * GET /profile/:userId
 */
app.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await profileService.getProfile(userId);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
    
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 프로필 생성/수정 API
 * POST /profile
 */
app.post('/profile', async (req, res) => {
  try {
    const result = await profileService.saveProfile(req.body);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * S3 업로드 URL 생성 API
 * POST /get-upload-url
 */
app.post('/get-upload-url', async (req, res) => {
  const { fileName, userId } = req.body;
  
  try {
    const result = await s3Service.getUploadUrl(fileName, userId);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
    
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 이상형 등록 API
 * POST /user-preferences
 */
app.post('/user-preferences', async (req, res) => {
  try {
    const result = await preferenceService.savePreferences(req.body);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 이상형 조회 API
 * GET /user-preferences/:userId
 */
app.get('/user-preferences/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await preferenceService.getPreferences(userId);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 매칭 상태 조회 API
 * GET /matching-status
 */
app.get('/matching-status', async (req, res) => {
  const startTime = Date.now();
  const { userId } = req.query;
  
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다.'
      });
    }

    // 먼저 내 MatchingRequests 찾기
    const matchingRequestsResult = await dynamodb.send(
      new ScanCommand({
        TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
        FilterExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );
    
    const matchingRequests = matchingRequestsResult.Items || [];
    const myRequest = matchingRequests.find((req) => req.user_id === userId);
    
    if (!myRequest) {
      console.log('내 MatchingRequests가 없음');
      return res.status(200).json({
        success: true,
        status: 'none',
        matchedUser: null,
        matchId: null,
        myChoices: null,
        otherChoices: null,
        hasPendingProposal: false,
        proposalMatchId: null,
        proposalTargetId: null
      });
    }
    
    const myRequestId = myRequest.request_id;
    
    // 내 request_id로 MatchPairs에서 match_a_id or match_b_id 확인
    const [matchPairsResult, proposalsResult] = await Promise.all([
      dynamodb.send(
        new ScanCommand({
          TableName: config.dynamodb.matchPairsTable || 'MatchPairs',
          FilterExpression: 'match_a_id = :requestId OR match_b_id = :requestId',
          ExpressionAttributeValues: {
            ':requestId': myRequestId
          }
        })
      ),
      dynamodb.send(
        new ScanCommand({
          TableName: config.dynamodb.proposalsTable || 'Proposals',
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
    let matchId = null;
    let myChoices = null;
    let otherChoices = null;
    
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
      const otherRequestResult = await dynamodb.send(
        new ScanCommand({
          TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
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
        const profileResult = await dynamodb.send(
          new ScanCommand({
            TableName: config.dynamodb.profilesTable || 'Profiles',
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

    return res.status(200).json({
      success: true,
      message: '매칭 상태 조회 성공',
              data: {
          status,
          requestId: myRequestId,
          matchId,
          matchedUser,
          myChoices,
          otherUserChoices: otherChoices,
          finalDate: myRequest.final_date || null,
          finalLocation: myRequest.final_location || null,
          dateAddress: myRequest.date_address || null,
          review: null,
          contactReady: false,
          bothReviewed: false,
          hasPendingProposal,
          proposalMatchId,
          proposalTargetId
        }
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 정보 조회 API
 * GET /user/:userId
 */
app.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 임시로 기본 사용자 정보 반환 (실제로는 사용자 정보 조회 로직 구현 필요)
    return res.status(200).json({
      success: true,
      message: '사용자 정보 조회 성공',
      data: {
        userId: userId,
        email: 'user@example.com',
        name: '사용자',
        hasProfile: true,
        hasPreferences: true,
        isVerified: true,
        points: 100,
        photos: []
      }
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 히스토리 조회 API
 * GET /history/:userId
 */
app.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  
  try {
    // 임시로 빈 히스토리 반환 (실제로는 히스토리 조회 로직 구현 필요)
    return res.status(200).json({
      success: true,
      message: '히스토리 조회 성공',
      data: {
        history: [],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: 0,
          totalPages: 0
        }
      }
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 인사이트 조회 API
 * GET /insight/:userId
 */
app.get('/insight/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 임시로 빈 인사이트 반환
    return res.status(200).json({
      success: true,
      message: '인사이트 조회 성공',
      data: {
        totalMatches: 0,
        successRate: 0,
        averageRating: 0,
        recentActivity: []
      }
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 리워드 조회 API
 * GET /reward/:userId
 */
app.get('/reward/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    // 임시로 빈 리워드 정보 반환
    return res.status(200).json({
      success: true,
      message: '리워드 조회 성공',
      data: {
        points: 100,
        pointHistory: [],
        availableRewards: []
      }
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 매칭 신청 API
 * POST /matching-requests
 */
app.post('/matching-requests', async (req, res) => {
  const { userId } = req.body;
  
  try {
    const result = await matchingService.createMatchingRequest({ userId });
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 매칭 신청 조회 API
 * GET /matching-requests
 */
app.get('/matching-requests', async (req, res) => {
  const { userId } = req.query;
  
  try {
    const result = await matchingService.getMatchingRequest(userId);
    
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && result.data),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 매칭 상태 처리 API
 * POST /process-matching-status
 */
app.post('/process-matching-status', async (req, res) => {
  try {
    // 임시로 성공 응답 반환
    return res.status(200).json({
      success: true,
      message: '매칭 상태 처리 완료'
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 테스트용 Pending Proposal 생성 API
 * POST /test/create-pending-proposal
 */
app.post('/test/create-pending-proposal', async (req, res) => {
  const { userId } = req.body;
  
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다.'
      });
    }

         // 테스트용 pending proposal 생성
     const testProposal = {
       proposal_id: 'test-proposal-' + Date.now(),
       match_pair_id: 'test-match-' + Date.now(),
       target_id: userId,
       status: 'pending', // DB 필드명과 일치
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString()
     };

    // DynamoDB에 실제 저장
    try {
      const putCommand = {
        TableName: 'Proposals',
        Item: testProposal
      };
      
      await dynamodb.send(new PutCommand(putCommand));
      console.log('✅ 테스트용 Pending Proposal이 DB에 저장되었습니다:', testProposal);
    } catch (error) {
      console.error('❌ DB 저장 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'DB 저장 중 오류가 발생했습니다.',
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '테스트용 Pending Proposal이 생성되었습니다.',
      data: testProposal
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 테스트용 Pending Proposal 삭제 API
 * DELETE /test/delete-pending-proposal
 */
app.delete('/test/delete-pending-proposal', async (req, res) => {
  const { userId } = req.query;
  
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다.'
      });
    }

    // DynamoDB에서 실제 삭제
    try {
      // 서비스 계층을 통한 pending proposal 조회
      const pendingProposalResult = await matchingService.getPendingProposal(userId);
      
      if (pendingProposalResult.success && pendingProposalResult.data) {
        // 첫 번째 pending proposal 삭제
        const deleteCommand = {
          TableName: 'Proposals',
          Key: {
            proposal_id: pendingProposalResult.data.proposal_id
          }
        };
        
        await dynamodb.send(new DeleteCommand(deleteCommand));
        console.log('✅ 테스트용 Pending Proposal이 DB에서 삭제되었습니다:', { userId });
      } else {
        console.log('삭제할 pending proposal이 없습니다:', { userId });
      }
    } catch (error) {
      console.error('❌ DB 삭제 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'DB 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '테스트용 Pending Proposal이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * Proposal 응답 처리 API
 * POST /propose/:matchId/respond
 */
app.post('/propose/:matchId/respond', async (req, res) => {
  const { matchId } = req.params;
      const { response } = req.body; // 'accepted' 또는 'refused'
  
  try {
    if (!matchId || !response) {
      return res.status(400).json({
        success: false,
        message: '매칭 ID와 응답이 필요합니다.'
      });
    }

    if (!['accepted', 'refused'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: '응답은 accepted 또는 refused여야 합니다.'
      });
    }

    // 서비스 계층 호출
    const result = await matchingService.respondToProposal(matchId, response);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 일정/장소 제출 및 매칭 검사 API
 * POST /submit-choices
 */
app.post('/submit-choices', async (req, res) => {
  const { request_id, dates, locations } = req.body;
  
  try {
    if (!request_id || !dates || !locations) {
      return res.status(400).json({
        success: false,
        message: 'request_id, dates, locations가 모두 필요합니다.'
      });
    }

    if (!Array.isArray(dates) || !Array.isArray(locations)) {
      return res.status(400).json({
        success: false,
        message: 'dates와 locations는 배열이어야 합니다.'
      });
    }

    // 서비스 계층 호출
    const result = await matchingService.submitChoices(request_id, dates, locations);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error })
    });
  } catch (error) {
    console.error('Express 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * Admin 인증 관련 API는 Next.js Admin 시스템에서 처리하므로 제거됨
 * - POST /api/admin/auth/login → Admin Next.js API Routes로 이동
 * - GET /api/admin/auth/verify → Admin Next.js API Routes로 이동
 * 
 * Admin 시스템은 AWS Amplify Hosting에서 독립적으로 운영됨
 */

/**
 * 헬스체크 API
 * GET /
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'DateSense API Server is running!',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    error: config.env === 'development' ? err.message : undefined
  });
});

// 서버 시작
app.listen(config.port, '192.168.219.100', () => {
  console.log(`🚀 Express 서버가 http://192.168.219.100:${config.port}에서 실행 중입니다.`);
  console.log(`🌍 환경: ${config.env}`);
  console.log('⚡ Lambda cold start 없이 빠른 응답을 제공합니다!');
});

module.exports = app; 