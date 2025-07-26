/**
 * MatchingService - 매칭 요청 관리 서비스
 * @module services/matchingService
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
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
        status: requestData.status || 'waiting', // requestData.status가 있으면 사용, 없으면 기본값 'waiting'
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

  /**
   * 사용자의 pending proposal 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} pending proposal 정보
   */
  async getPendingProposal(userId) {
    try {
      // 실제 DynamoDB 조회 (테스트 데이터 제거)
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: config.dynamodb.proposalsTable || 'Proposals',
          IndexName: 'target-user-index',
          KeyConditionExpression: 'target_id = :userId',
          FilterExpression: '#status = :pendingStatus',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':pendingStatus': 'pending'
          }
        })
      );
      const pendingProposal = result.Items?.[0] || null;
      return {
        success: true,
        statusCode: 200,
        message: 'Pending proposal 조회 성공',
        data: pendingProposal
      };
    } catch (error) {
      console.error('Error getting pending proposal:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'Pending proposal 조회 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }

  /**
   * MatchingRecommendations 테이블에서 기존 추천 목록 조회
   * @param {string} requestId
   * @returns {Promise<Array>} 기존 추천 목록
   */
  async getExistingRecommendations(requestId) {
    try {
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: config.dynamodb.matchingRecommendationsTable || 'MatchingRecommendations',
          KeyConditionExpression: 'request_id = :rid',
          ExpressionAttributeValues: { ':rid': requestId },
        })
      );
      return result.Items || [];
    } catch (error) {
      console.error('Error getting existing recommendations:', error);
      return [];
    }
  }

  /**
   * MatchingRecommendations 테이블에 추천 목록 저장 (정렬 순서 보장)
   * @param {string} requestId
   * @param {Array} recommendations
   * @returns {Promise<void>}
   */
  async saveRecommendations(requestId, recommendations) {
    if (!recommendations || !recommendations.length) return;
    for (const rec of recommendations) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: config.dynamodb.matchingRecommendationsTable || 'MatchingRecommendations',
            Item: rec
          })
        );
      } catch (error) {
        console.error('Error saving recommendation:', error, rec);
      }
    }
  }

  /**
   * MatchingRequest 상태를 matched로 업데이트하거나 없으면 새로 생성
   * @param {string} userId
   * @param {string} nowAt
   * @returns {Promise<string>} request_id
   */
  async ensureMatchedRequest(userId, nowAt) {
    // 해당 userId의 MatchingRequest가 있으면 matched로 업데이트, 없으면 새로 생성
    const targetRequestResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
        FilterExpression: 'user_id = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      })
    );
    const targetRequest = targetRequestResult.Items?.[0];
    if (targetRequest) {
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
          Key: { request_id: targetRequest.request_id },
          UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'matched',
            ':updatedAt': nowAt
          }
        })
      );
      return targetRequest.request_id;
    } else {
      const newRequestData = {
        userId,
        status: 'matched'
      };
      const newRequestResult = await this.createMatchingRequest(newRequestData);
      if (newRequestResult.success) {
        return newRequestResult.data.request_id;
      } else {
        throw new Error('MatchingRequest 생성 실패');
      }
    }
  }

  /**
   * MatchPairs의 특정 필드 업데이트
   */
  async updateMatchPair(match_id, updateExpr, exprAttrValues, exprAttrNames) {
    const params = {
      TableName: config.dynamodb.matchPairsTable || 'MatchPairs',
      Key: { match_id },
      UpdateExpression: updateExpr,
      ExpressionAttributeValues: exprAttrValues,
    };
    if (exprAttrNames && Object.keys(exprAttrNames).length > 0) {
      params.ExpressionAttributeNames = exprAttrNames;
    }
    await ddbDocClient.send(new UpdateCommand(params));
  }

  /**
   * Proposal 응답 처리 (수락/거절)
   * @param {string} matchPairId
   * @param {'accepted'|'refused'} response
   * @returns {Promise<Object>}
   */
  async respondToProposal(matchPairId, response) {
    try {
      console.log('🔍 respondToProposal 시작:', { matchPairId, response });
      // 1. Proposal 조회
      const result = await ddbDocClient.send(
        new ScanCommand({
          TableName: config.dynamodb.proposalsTable || 'Proposals',
          FilterExpression: 'match_pair_id = :matchPairId',
          ExpressionAttributeValues: { ':matchPairId': matchPairId }
        })
      );
      const proposal = result.Items?.[0];
      if (!proposal) {
        console.error('❌ Proposal not found for matchPairId:', matchPairId);
        return { success: false, statusCode: 404, message: 'Proposal not found' };
      }
      const nowAt = new Date().toISOString();
      // 2. Proposal 상태 업데이트
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: config.dynamodb.proposalsTable || 'Proposals',
          Key: { proposal_id: proposal.proposal_id },
          UpdateExpression: 'SET #status = :status, responded_at = :respondedAt, updated_at = :updatedAt',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': response,
            ':respondedAt': nowAt,
            ':updatedAt': nowAt
          }
        })
      );
      // 3. MatchPairs confirm_proposed, updated_at
      await this.updateMatchPair(
        proposal.match_pair_id,
        'SET confirm_proposed = :confirmProposed, updated_at = :updatedAt',
        { ':confirmProposed': true, ':updatedAt': nowAt }
      );
      // 4. accepted일 때 추가 처리
      if (response === 'accepted') {
        // 4-1. 제안받은 사람(target_id) MatchingRequest 처리
        let newRequestId;
        try {
          newRequestId = await this.ensureMatchedRequest(proposal.target_id, nowAt);
          console.log('✅ target_id MatchingRequest matched:', newRequestId);
        } catch (e) {
          console.error('❌ target_id MatchingRequest 처리 실패:', e);
        }
        // 4-2. MatchPairs의 match_b_id 업데이트
        if (newRequestId) {
          await this.updateMatchPair(
            proposal.match_pair_id,
            'SET match_b_id = :newRequestId',
            { ':newRequestId': newRequestId }
          );
        }
        // 4-3. 제안자 MatchingRequest 처리
        try {
          await this.ensureMatchedRequest(proposal.propose_user_id, nowAt);
          console.log('✅ propose_user_id MatchingRequest matched');
        } catch (e) {
          console.error('❌ propose_user_id MatchingRequest 처리 실패:', e);
        }
      }
      return { success: true, statusCode: 200, message: `Proposal ${response} 처리 완료` };
    } catch (error) {
      console.error('❌ Error responding to proposal:', error);
      return { success: false, statusCode: 500, message: 'Proposal 응답 처리 중 오류', error: error.message };
    }
  }

  /**
   * 일정/장소 제출 및 매칭 검사
   * @param {string} requestId - 내 MatchingRequest의 request_id
   * @param {string[]} dates
   * @param {string[]} locations
   * @returns {Promise<Object>}
   */
  async submitChoices(requestId, dates, locations) {
    try {
      console.log('🔍 submitChoices 시작:', { requestId, dates, locations });
      
      // 1. 내 MatchingRequest 조회
      const myRequestResult = await ddbDocClient.send(
        new GetCommand({
          TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
          Key: { request_id: requestId }
        })
      );
      
      if (!myRequestResult.Item) {
        console.error('❌ My MatchingRequest not found:', requestId);
        return { success: false, statusCode: 404, message: 'MatchingRequest not found' };
      }
      
      const myRequest = myRequestResult.Item;
      console.log('📝 내 MatchingRequest 조회 결과:', myRequest);
      
      // 2. 내 request_id로 MatchPairs에서 상대방 request_id 찾기
      const matchPairsResult = await ddbDocClient.send(
        new ScanCommand({
          TableName: config.dynamodb.matchPairsTable || 'MatchPairs',
          FilterExpression: 'match_a_id = :requestId OR match_b_id = :requestId',
          ExpressionAttributeValues: {
            ':requestId': requestId
          }
        })
      );
      
      if (!matchPairsResult.Items || matchPairsResult.Items.length === 0) {
        console.error('❌ MatchPair not found for requestId:', requestId);
        return { success: false, statusCode: 404, message: 'MatchPair not found' };
      }
      
      const matchPair = matchPairsResult.Items[0];
      console.log('📝 MatchPair 조회 결과:', matchPair);
      
      // 3. 상대방 request_id 찾기
      const otherRequestId = matchPair.match_a_id === requestId 
        ? matchPair.match_b_id 
        : matchPair.match_a_id;
      
      console.log('🔍 상대방 request_id:', otherRequestId);
      
      // 4. 내 MatchingRequests에 date_choices 저장
      const nowAt = new Date().toISOString();
      console.log('💾 내 MatchingRequests에 date_choices 저장 중...');
      await this.updateMatchingRequestWithChoices(myRequest.user_id, {
        dates: dates,
        locations: locations
      }, nowAt);
      
      // 5. 상대방 선택 확인 (MatchingRequests에서 조회)
      const otherRequestResult = await ddbDocClient.send(
        new GetCommand({
          TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
          Key: { request_id: otherRequestId }
        })
      );
      
      const otherChoices = otherRequestResult.Item?.date_choices;
      
      // 7. 매칭 검사
      let status = 'matched'; // 기본값
      let message = '일정이 저장되었습니다.';
      let finalDate = null;
      let finalLocation = null;
      
      if (otherChoices) {
        // 상대방도 선택을 완료한 경우 매칭 검사
        const dateMatch = this.checkDateMatch(dates, otherChoices.dates);
        const locationMatch = this.checkLocationMatch(locations, otherChoices.locations);    
        
        if (dateMatch && locationMatch) {
          status = 'confirmed';
          message = '상대방과 일정이 맞아서 소개팅이 확정되었습니다.';
          
          // 최종 확정 정보 설정 (첫 번째 매칭되는 날짜와 위치)
          const matchedDate = dates.find(date => otherChoices.dates.includes(date));
          
          // 위치 데이터 정리 (중복 제거 및 정규화)
          const cleanLocations = locations.map(loc => {
            // "서울 서울" 같은 중복 제거
            const parts = loc.split(' ');
            if (parts.length >= 2 && parts[0] === parts[1]) {
              return parts[0]; // "서울 서울" → "서울"
            }
            return loc;
          });
          
          const cleanOtherLocations = otherChoices.locations.map(loc => {
            const parts = loc.split(' ');
            if (parts.length >= 2 && parts[0] === parts[1]) {
              return parts[0];
            }
            return loc;
          });
          
          console.log('🧹 정리된 위치:', { 
            original: locations, 
            cleaned: cleanLocations,
            otherOriginal: otherChoices.locations,
            otherCleaned: cleanOtherLocations
          });
          
          // 더 구체적인 위치를 우선적으로 선택
          let matchedLocations = [];
          
          // 1. 내 위치들 중에서 상대방과 매칭되는 것 찾기
          for (const myLoc of cleanLocations) {
            for (const otherLoc of cleanOtherLocations) {
              if (myLoc === otherLoc) {
                // 정확히 일치하는 경우
                if (!matchedLocations.includes(myLoc)) {
                  matchedLocations.push(myLoc);
                }
              } else if (myLoc.includes(' ') && otherLoc.includes(' ')) {
                // 둘 다 구체적인 지역인 경우 (예: "서울 관악" vs "서울 광진")
                if (myLoc.split(' ')[0] === otherLoc.split(' ')[0]) {
                  if (!matchedLocations.includes(myLoc)) {
                    matchedLocations.push(myLoc);
                  }
                }
              } else if (myLoc.includes(' ') && !otherLoc.includes(' ')) {
                // 내가 구체적이고 상대방이 포괄적인 경우 (예: "서울 관악" vs "서울")
                if (myLoc.split(' ')[0] === otherLoc) {
                  if (!matchedLocations.includes(myLoc)) {
                    matchedLocations.push(myLoc);
                  }
                }
              } else if (!myLoc.includes(' ') && otherLoc.includes(' ')) {
                // 내가 포괄적이고 상대방이 구체적인 경우 (예: "서울" vs "서울 관악")
                if (myLoc === otherLoc.split(' ')[0]) {
                  if (!matchedLocations.includes(otherLoc)) {
                    matchedLocations.push(otherLoc);
                  }
                }
              }
            }
          }
          
          // 2. 매칭된 위치가 없으면 첫 번째 매칭되는 위치 선택
          if (matchedLocations.length === 0) {
            for (const myLoc of cleanLocations) {
              for (const otherLoc of cleanOtherLocations) {
                if (myLoc === otherLoc) {
                  matchedLocations = [myLoc];
                  break;
                } else if (myLoc.includes(' ') && otherLoc.includes(' ')) {
                  if (myLoc.split(' ')[0] === otherLoc.split(' ')[0]) {
                    matchedLocations = [myLoc];
                    break;
                  }
                } else if (myLoc.includes(' ') && !otherLoc.includes(' ')) {
                  if (myLoc.split(' ')[0] === otherLoc) {
                    matchedLocations = [myLoc];
                    break;
                  }
                } else if (!myLoc.includes(' ') && otherLoc.includes(' ')) {
                  if (myLoc === otherLoc.split(' ')[0]) {
                    matchedLocations = [otherLoc];
                    break;
                  }
                }
              }
              if (matchedLocations.length > 0) break;
            }
          }
          
          finalDate = matchedDate ? `${matchedDate}T18:00:00Z` : null;
          finalLocation = matchedLocations.length > 0 ? matchedLocations.join(', ') : null;
          
          console.log('🎯 최종 확정 정보:', { finalDate, finalLocation, matchedLocations });
        } else {
          status = 'mismatched';
          message = '상대방과 일정이 맞지 않습니다.';
        }
        
        console.log('🔍 매칭 검사 결과:', { dateMatch, locationMatch, status });
      }
      
      // 8. 내 MatchingRequests 상태 업데이트
      const updateExpression = status === 'confirmed' 
        ? 'SET #status = :status, final_date = :finalDate, final_location = :finalLocation, updated_at = :updatedAt'
        : 'SET #status = :status, updated_at = :updatedAt';
      
      const expressionAttributeValues = status === 'confirmed'
        ? {
            ':status': status,
            ':finalDate': finalDate,
            ':finalLocation': finalLocation,
            ':updatedAt': nowAt
          }
        : {
            ':status': status,
            ':updatedAt': nowAt
          };
      
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
          Key: { request_id: requestId },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: expressionAttributeValues
        })
      );

      // 9. confirmed 상태일 때만 상대방 상태도 업데이트
      if (status === 'confirmed' && otherChoices) {
        const otherRequestId = matchPair.match_a_id === requestId ? matchPair.match_b_id : matchPair.match_a_id;
        if (otherRequestId) {
          console.log('🔍 상대방 상태 업데이트 시작:', { otherRequestId, status, finalDate, finalLocation });
          
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: config.dynamodb.matchingRequestsTable || 'MatchingRequests',
              Key: { request_id: otherRequestId },
              UpdateExpression: 'SET #status = :status, final_date = :finalDate, final_location = :finalLocation, updated_at = :updatedAt',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': status,
                ':finalDate': finalDate,
                ':finalLocation': finalLocation,
                ':updatedAt': nowAt
              }
            })
          );
          console.log('✅ 상대방 MatchingRequests 상태 업데이트 완료:', { otherRequestId, status, finalDate, finalLocation });
        }
      }
      
      return { 
        success: true, 
        statusCode: 200, 
        message,
        data: { status }
      };
    } catch (error) {
      console.error('❌ Error submitting choices:', error);
      return { success: false, statusCode: 500, message: '일정/장소 제출 중 오류', error: error.message };
    }
  }

  /**
   * MatchingRequests 테이블에 date_choices와 choices_submitted_at 업데이트
   * @param {string} userId 
   * @param {object} dateChoices 
   * @param {string} submittedAt 
   */
  async updateMatchingRequestWithChoices(userId, dateChoices, submittedAt) {
    try {
      console.log('📝 updateMatchingRequestWithChoices 호출:', { userId, dateChoices, submittedAt });
      
      // 사용자의 MatchingRequest 찾기
      const scanParams = {
        TableName: 'MatchingRequests',
        FilterExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };
      
      const scanResult = await ddbDocClient.send(new ScanCommand(scanParams));
      console.log('🔍 MatchingRequests 스캔 결과:', scanResult.Items);
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        const matchingRequest = scanResult.Items[0];
        const requestId = matchingRequest.request_id;
        
        console.log('📝 MatchingRequest 찾음:', { requestId, userId });
        
        // date_choices, choices_submitted_at, updated_at 업데이트
        const updateParams = {
          TableName: 'MatchingRequests',
          Key: {
            request_id: requestId
          },
          UpdateExpression: 'SET date_choices = :dateChoices, choices_submitted_at = :submittedAt, updated_at = :updatedAt',
          ExpressionAttributeValues: {
            ':dateChoices': { 
              dates: dateChoices.dates,
              locations: dateChoices.locations
            },
            ':submittedAt': submittedAt,
            ':updatedAt': submittedAt
          }
        };
        
        console.log('💾 MatchingRequests 업데이트 파라미터:', JSON.stringify(updateParams, null, 2));
        
        await ddbDocClient.send(new UpdateCommand(updateParams));
        console.log('✅ MatchingRequests 업데이트 완료');
      } else {
        console.log('⚠️ 사용자의 MatchingRequest를 찾을 수 없음:', userId);
      }
    } catch (error) {
      console.error('❌ Error updating MatchingRequest with choices:', error);
      throw error;
    }
  }

  /**
   * 날짜 매칭 검사
   * @param {string[]} dates1
   * @param {string[]} dates2
   * @returns {boolean}
   */
  checkDateMatch(dates1, dates2) {
    if (!dates1 || !dates2 || dates1.length === 0 || dates2.length === 0) {
      return false;
    }
    
    // 하나라도 겹치는 날짜가 있으면 매칭
    return dates1.some(date1 => dates2.includes(date1));
  }

  /**
   * 장소 매칭 검사
   * @param {string[]} locations1
   * @param {string[]} locations2
   * @returns {boolean}
   */
  checkLocationMatch(locations1, locations2) {
    if (!locations1 || !locations2 || locations1.length === 0 || locations2.length === 0) {
      return false;
    }
    
    // 하나라도 겹치는 장소가 있으면 매칭
    return locations1.some(loc1 => {
      return locations2.some(loc2 => {
        // 정확히 일치하는 경우
        if (loc1 === loc2) {
          return true;
        }
        
        // 포괄적 매칭: 더 넓은 지역이 구체적인 지역을 포함하는 경우
        // 예: "서울"이 "서울 관악", "서울 광진" 등을 포함
        if (loc1.includes(' ') && loc2.includes(' ')) {
          // 둘 다 구체적인 지역인 경우 (예: "서울 관악" vs "서울 광진")
          const loc1Parts = loc1.split(' ');
          const loc2Parts = loc2.split(' ');
          
          // 첫 번째 부분(시/도)이 같으면 매칭
          if (loc1Parts[0] === loc2Parts[0]) {
            return true;
          }
        } else if (loc1.includes(' ') && !loc2.includes(' ')) {
          // loc1이 구체적이고 loc2가 포괄적인 경우 (예: "서울 관악" vs "서울")
          const loc1Parts = loc1.split(' ');
          if (loc1Parts[0] === loc2) {
            return true;
          }
                 } else if (!loc1.includes(' ') && loc2.includes(' ')) {
           // loc1이 포괄적이고 loc2가 구체적인 경우 (예: "서울" vs "서울 관악")
           const loc2Parts = loc2.split(' ');
          if (loc1 === loc2Parts[0]) {
            return true;
          }
        }
        
        return false;
      });
    });
  }
}

module.exports = new MatchingService(); 