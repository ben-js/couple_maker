/**
 * AuthService - 사용자 인증 및 로그인 서비스
 * @module services/authService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcrypt');
const config = require('../config');
const AWS_CONFIG = require('../config/aws');

const ddbClient = new DynamoDBClient(AWS_CONFIG);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

class AuthService {
  /**
   * 로그인 처리
   * @param {string} email - 사용자 이메일
   * @param {string} password - 사용자 비밀번호
   * @returns {Promise<Object>} 로그인 결과
   */
  async login(email, password) {
    const startTime = Date.now();
    try {
      // AWS 환경변수 확인 로그 추가
      console.log('🔑 AWS ENV CHECK (login)', {
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: process.env.AWS_REGION,
      });
      // 이메일로 사용자 찾기 (GSI로 조회)
      const userResult = await ddbDocClient.send(
        new QueryCommand({
          TableName: config.dynamodb.usersTable,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': email
          }
        })
      );
      if (!userResult.Items || userResult.Items.length === 0) {
        return {
          success: false,
          statusCode: 401,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        };
      }
      const user = userResult.Items[0];
      // 비밀번호 확인 (해시된 비밀번호 비교)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          statusCode: 401,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        };
      }
      // 프로필 정보 조회 (user_id로 직접 조회)
      const profileResult = await ddbDocClient.send(
        new GetCommand({
          TableName: config.dynamodb.profilesTable,
          Key: { user_id: user.user_id }
        })
      );
      const profile = profileResult.Item;
      const hasProfile = !!profile;
      const hasPreferences = user.has_preferences;
      // 기본 매칭 상태
      const matchingInfo = {
        status: 'none',
        matchId: null,
        hasPendingProposal: false,
        proposalMatchId: null
      };
      return {
        success: true,
        statusCode: 200,
        message: '로그인 성공',
        data: {
          user: {
            userId: user.user_id,
            email: user.email,
            isVerified: user.is_verified,
            hasProfile: hasProfile,
            hasPreferences: hasPreferences,
            grade: user.grade,
            status: user.status,
            points: user.points
          },
          matchingStatus: matchingInfo
        }
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: '서버 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

module.exports = new AuthService(); 