/**
 * ProfileService - 사용자 프로필 조회 서비스
 * @module services/profileService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('../config');
const userService = require('./userService');

const ddbClient = new DynamoDBClient({ region: config.dynamodb.region });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

class ProfileService {
  /**
   * 사용자 프로필 저장
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise<Object>} 프로필 저장 결과
   */
  async saveProfile(profileData) {
    try {
      const { user_id, ...profileFields } = profileData;
      
      // 프로필 데이터 구조화
      const profile = {
        user_id: user_id,
        name: profileFields.name,
        birth_date: profileFields.birthDate,
        gender: profileFields.gender,
        height: profileFields.height,
        body_type: profileFields.bodyType,
        job: profileFields.job,
        education: profileFields.education,
        region: profileFields.region,
        mbti: profileFields.mbti,
        interests: profileFields.interests,
        favorite_foods: profileFields.favoriteFoods,
        smoking: profileFields.smoking,
        drinking: profileFields.drinking,
        religion: profileFields.religion,
        children_desire: profileFields.childrenDesire,
        marriage_plans: profileFields.marriagePlans,
        salary: profileFields.salary,
        asset: profileFields.asset,
        introduction: profileFields.introduction,
        photos: profileFields.photos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 프로필 저장
      await ddbDocClient.send(
        new PutCommand({
          TableName: config.dynamodb.profilesTable,
          Item: profile
        })
      );

      // 사용자의 has_profile 상태 업데이트
      await userService.updateUser(user_id, { has_profile: true });

      return {
        success: true,
        statusCode: 200,
        message: '프로필 저장 성공',
        data: { profile }
      };
    } catch (error) {
      console.error('Error saving profile:', error);
      return {
        success: false,
        statusCode: 500,
        message: '프로필 저장 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }

  /**
   * 사용자 프로필 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 프로필 조회 결과
   */
  async getProfile(userId) {
    try {
      const profileResult = await ddbDocClient.send(
        new GetCommand({
          TableName: config.dynamodb.profilesTable,
          Key: { user_id: userId }
        })
      );
      if (!profileResult.Item) {
        return {
          success: false,
          statusCode: 404,
          message: '프로필을 찾을 수 없습니다.'
        };
      }
      const profile = profileResult.Item;
      return {
        success: true,
        statusCode: 200,
        message: '프로필 조회 성공',
        data: {
          name: profile.name,
          birthDate: profile.birth_date,
          gender: profile.gender,
          height: profile.height,
          bodyType: profile.body_type,
          job: profile.job,
          education: profile.education,
          region: profile.region,
          mbti: profile.mbti,
          interests: profile.interests,
          favoriteFoods: profile.favorite_foods,
          smoking: profile.smoking,
          drinking: profile.drinking,
          religion: profile.religion,
          childrenDesire: profile.children_desire,
          marriagePlans: profile.marriage_plans,
          salary: profile.salary,
          asset: profile.asset,
          introduction: profile.introduction,
          photos: profile.photos
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

module.exports = new ProfileService(); 