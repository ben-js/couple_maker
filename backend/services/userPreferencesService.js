/**
 * UserPreferencesService - 사용자 이상형 등록/조회 서비스
 * @module services/userPreferencesService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('../config');
const userService = require('./userService');

const ddbClient = new DynamoDBClient({ region: config.dynamodb.region });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

class UserPreferencesService {
  /**
   * 사용자 이상형 등록
   * @param {Object} preferencesData - 이상형 데이터
   * @returns {Promise<Object>} 이상형 등록 결과
   */
  async saveUserPreferences(preferencesData) {
    try {
      const { userId, ...preferencesFields } = preferencesData;
      
      // 이상형 데이터 구조화
      const preferences = {
        user_id: userId,
        preferred_gender: preferencesFields.preferredGender,
        age_range: preferencesFields.ageRange,
        height_range: preferencesFields.heightRange,
        regions: preferencesFields.regions,
        locations: preferencesFields.locations,
        job_types: preferencesFields.jobTypes,
        education_levels: preferencesFields.educationLevels,
        body_types: preferencesFields.bodyTypes,
        mbti_types: preferencesFields.mbtiTypes,
        interests: preferencesFields.interests,
        marriage_plan: preferencesFields.marriagePlan,
        children_desire: preferencesFields.childrenDesire,
        smoking: preferencesFields.smoking,
        drinking: preferencesFields.drinking,
        religion: preferencesFields.religion,
        priority: preferencesFields.priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 이상형 저장
      await ddbDocClient.send(
        new PutCommand({
          TableName: config.dynamodb.preferencesTable,
          Item: preferences
        })
      );

      // 사용자의 has_preferences 상태 업데이트
      await userService.updateUser(userId, { has_preferences: true });

      return {
        success: true,
        statusCode: 200,
        message: '이상형 등록 성공',
        data: { preferences }
      };
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return {
        success: false,
        statusCode: 500,
        message: '이상형 등록 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }

  /**
   * 사용자 이상형 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 이상형 조회 결과
   */
  async getUserPreferences(userId) {
    try {
      const preferencesResult = await ddbDocClient.send(
        new GetCommand({
          TableName: config.dynamodb.preferencesTable,
          Key: { user_id: userId }
        })
      );
      
      if (!preferencesResult.Item) {
        return {
          success: false,
          statusCode: 404,
          message: '이상형 정보를 찾을 수 없습니다.'
        };
      }
      
      const preferences = preferencesResult.Item;
      return {
        success: true,
        statusCode: 200,
        message: '이상형 조회 성공',
        data: {
          userId: preferences.user_id,
          preferredGender: preferences.preferred_gender,
          ageRange: preferences.age_range,
          heightRange: preferences.height_range,
          regions: preferences.regions,
          locations: preferences.locations,
          jobTypes: preferences.job_types,
          educationLevels: preferences.education_levels,
          bodyTypes: preferences.body_types,
          mbtiTypes: preferences.mbti_types,
          interests: preferences.interests,
          marriagePlan: preferences.marriage_plan,
          childrenDesire: preferences.children_desire,
          smoking: preferences.smoking,
          drinking: preferences.drinking,
          religion: preferences.religion,
          priority: preferences.priority
        }
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        success: false,
        statusCode: 500,
        message: '서버 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

module.exports = new UserPreferencesService(); 