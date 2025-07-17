/**
 * UserService - 사용자 관리 서비스
 * @module services/userService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const ddbClient = new DynamoDBClient({ region: config.dynamodb.region });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

class UserService {
  /**
   * 이메일로 사용자 조회
   * @param {string} email - 사용자 이메일
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async findByEmail(email) {
    try {
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: config.dynamodb.usersTable,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': email
          }
        })
      );
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }
      
      return result.Items[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * 사용자 프로필 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object|null>} 프로필 정보 또는 null
   */
  async getProfile(userId) {
    try {
      const result = await ddbDocClient.send(
        new GetCommand({
          TableName: config.dynamodb.profilesTable,
          Key: { user_id: userId }
        })
      );
      
      return result.Item || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * 매칭 상태 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 매칭 상태 정보
   */
  async getMatchingStatus(userId) {
    try {
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: config.dynamodb.matchingRequestsTable,
          IndexName: 'user-index',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          ProjectionExpression: 'status, created_at'
        })
      );
      
      return result.Items?.[0] || { status: 'none' };
    } catch (error) {
      console.error('Error getting matching status:', error);
      return { status: 'none' };
    }
  }

  /**
   * 사용자 생성
   * @param {Object} userData - 사용자 데이터
   * @returns {Promise<Object>} 생성된 사용자 정보
   */
  async createUser(userData) {
    try {
      const user = {
        user_id: uuidv4(),
        email: userData.email,
        password: userData.password,
        is_verified: false,
        has_profile: false,
        has_preferences: false,
        grade: 'general',
        status: 'green',
        is_deleted: false,
        deleted_at: null,
        delete_reason: null,
        points: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: config.dynamodb.usersTable,
          Item: user,
          ConditionExpression: 'attribute_not_exists(user_id)'
        })
      );
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 업데이트
   * @param {string} userId - 사용자 ID
   * @param {Object} updates - 업데이트할 데이터
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async updateUser(userId, updates) {
    try {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach(key => {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updates[key];
      });

      updateExpression.push('#updated_at = :updated_at');
      expressionAttributeNames['#updated_at'] = 'updated_at';
      expressionAttributeValues[':updated_at'] = new Date().toISOString();

      const result = await ddbDocClient.send(
        new UpdateCommand({
          TableName: config.dynamodb.usersTable,
          Key: { user_id: userId },
          UpdateExpression: `SET ${updateExpression.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW'
        })
      );
      
      return result.Attributes;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 