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
const userPreferencesService = require('./services/userPreferencesService');
const s3Service = require('./services/s3Service');

const app = express();

// CORS 설정
app.use(cors(config.cors));
app.use(express.json());

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
    const result = await userPreferencesService.saveUserPreferences(req.body);
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
    const result = await userPreferencesService.getUserPreferences(userId);
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
    // 임시로 빈 상태 반환 (실제로는 매칭 상태 조회 로직 구현 필요)
    return res.status(200).json({
      success: true,
      message: '매칭 상태 조회 성공',
      data: {
        status: null, // 아직 신청하지 않은 상태
        matchId: null,
        matchedUser: null,
        otherUserChoices: null,
        review: null,
        contactReady: false,
        bothReviewed: false
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
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 Express 서버가 http://0.0.0.0:${config.port}에서 실행 중입니다.`);
  console.log(`🌍 환경: ${config.env}`);
  console.log('⚡ Lambda cold start 없이 빠른 응답을 제공합니다!');
});

module.exports = app; 