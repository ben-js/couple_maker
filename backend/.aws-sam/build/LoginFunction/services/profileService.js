/**
 * ProfileService - 사용자 프로필 조회 서비스
 * @module services/profileService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('../config');
const userService = require('./userService');
const s3Service = require('./s3Service');
const AWS_CONFIG = require('../config/aws');

const ddbClient = new DynamoDBClient(AWS_CONFIG);
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
      
      // 기존 프로필 조회 (사진 비교용)
      const existingProfile = await this.getProfile(user_id);
      const existingPhotos = existingProfile.success && existingProfile.data?.photos ? existingProfile.data.photos : [];
      const newPhotos = Array.isArray(profileFields.photos) ? profileFields.photos : [];
      // photos가 undefined이거나 빈 배열이면 기존 사진 유지
      const finalPhotos = newPhotos.length > 0 ? newPhotos : existingPhotos;
      
      // 삭제된 사진 찾기 (기존에 있던 사진 중에서 새로운 사진에 없는 것들)
      const deletedPhotos = existingPhotos.filter(existingPhoto => 
        !finalPhotos.some(newPhoto => newPhoto === existingPhoto)
      );
      
      // 삭제된 사진이 있으면 S3에서 삭제
      if (deletedPhotos.length > 0) {
        console.log('삭제된 사진 S3 삭제 시작:', { 
          userId: user_id, 
          deletedPhotos: deletedPhotos,
          deletedCount: deletedPhotos.length 
        });
        
        for (const photoUrl of deletedPhotos) {
          const deleteResult = await s3Service.deletePhoto(photoUrl);
          if (deleteResult.success) {
            console.log('사진 삭제 완료:', { photoUrl });
          } else {
            console.error('사진 삭제 실패:', { photoUrl, error: deleteResult.error });
          }
        }
      }
      
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
        photos: finalPhotos,
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
          success: true,
          statusCode: 200,
          message: '프로필이 없습니다.',
          data: null
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