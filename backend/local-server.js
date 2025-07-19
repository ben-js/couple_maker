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
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
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
    const result = await preferenceService.saveUserPreferences(req.body);
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
    const result = await preferenceService.getUserPreferences(userId);
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
  const { userId } = req.query;
  
  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다.'
      });
    }

    // 실제 매칭 요청 조회
    const result = await matchingService.getMatchingRequest(userId);
    
    if (result.success && result.data) {
      // 매칭 요청이 존재하는 경우
      return res.status(200).json({
        success: true,
        message: '매칭 상태 조회 성공',
        data: {
          status: result.data.status,
          matchId: result.data.request_id,
          matchedUser: null, // 아직 매칭되지 않음
          otherUserChoices: null,
          review: null,
          contactReady: false,
          bothReviewed: false
        }
      });
    } else {
      // 매칭 요청이 없는 경우
      return res.status(200).json({
        success: true,
        message: '매칭 상태 조회 성공',
        data: {
          status: null,
          matchId: null,
          matchedUser: null,
          otherUserChoices: null,
          review: null,
          contactReady: false,
          bothReviewed: false
        }
      });
    }
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