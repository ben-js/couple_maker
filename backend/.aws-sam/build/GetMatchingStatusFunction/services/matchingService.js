/**
 * MatchingService - 매칭 요청 관리 서비스
 * @module services/matchingService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const AWS_CONFIG = require('../config/aws');

const ddbClient = new DynamoDBClient(AWS_CONFIG);
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

class MatchingService {
  /**
   * 매칭 요청 생성
   * @param {Object} requestData - 매칭 요청 데이터
   * @returns {Promise<Object>} 생성된 매칭 요청 정보
   */
  async createMatchingRequest(requestData) {
    try {
      const matchingRequest = {
        request_id: uuidv4(),
        user_id: requestData.userId,
        status: 'waiting', // flow.md에 따라 waiting 상태로 설정
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: config.dynamodb.matchingRequestsTable,
          Item: matchingRequest,
          ConditionExpression: 'attribute_not_exists(request_id)'
        })
      );
      
      return {
        success: true,
        statusCode: 201,
        message: '매칭 요청이 성공적으로 생성되었습니다.',
        data: matchingRequest
      };
    } catch (error) {
      console.error('Error creating matching request:', error);
      return {
        success: false,
        statusCode: 500,
        message: '매칭 요청 생성 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }

  /**
   * 사용자의 매칭 요청 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 매칭 요청 정보
   */
  async getMatchingRequest(userId) {
    try {
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: config.dynamodb.matchingRequestsTable,
          IndexName: 'user-index',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
      );
      
      const matchingRequest = result.Items?.[0] || null;
      
      return {
        success: true,
        statusCode: 200,
        message: '매칭 요청 조회 성공',
        data: matchingRequest
      };
    } catch (error) {
      console.error('Error getting matching request:', error);
      return {
        success: false,
        statusCode: 500,
        message: '매칭 요청 조회 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }

  /**
   * 매칭 요청 상태 업데이트
   * @param {string} requestId - 요청 ID
   * @param {string} status - 새로운 상태
   * @returns {Promise<Object>} 업데이트된 매칭 요청 정보
   */
  async updateMatchingStatus(requestId, status) {
    try {
      const result = await ddbDocClient.send(
        new UpdateCommand({
          TableName: config.dynamodb.matchingRequestsTable,
          Key: { request_id: requestId },
          UpdateExpression: 'SET #status = :status, #updated_at = :updated_at',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#updated_at': 'updated_at'
          },
          ExpressionAttributeValues: {
            ':status': status,
            ':updated_at': new Date().toISOString()
          },
          ReturnValues: 'ALL_NEW'
        })
      );
      
      return {
        success: true,
        statusCode: 200,
        message: '매칭 상태가 성공적으로 업데이트되었습니다.',
        data: result.Attributes
      };
    } catch (error) {
      console.error('Error updating matching status:', error);
      return {
        success: false,
        statusCode: 500,
        message: '매칭 상태 업데이트 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

module.exports = new MatchingService(); 