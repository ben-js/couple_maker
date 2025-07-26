import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand, UpdateCommand, PutCommand, DeleteCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import AWS_CONFIG from '../config/aws';
import {
  Manager,
  User,
  MatchingRequest,
  Proposal,
  MatchPair,
  MatchingHistory,
  PointHistory,
  UserStatusHistory,
  Review,
  ManagerLog,
  DashboardStats,
  ReviewStats,
} from '../types';
import { ScoreInput, ScoreResult } from '../types/score';

// AWS 설정
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

// DynamoDB 클라이언트를 export하여 다른 모듈에서 사용할 수 있도록 함
export { dynamodb };

class DataService {
  // 매니저 계정 관련 메서드
  async getManagerByEmail(email: string): Promise<Manager | null> {
    const params = {
      TableName: 'Managers',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };
    
    try {
      const result = await dynamodb.send(new QueryCommand(params));
      return result.Items?.[0] as Manager || null;
    } catch (error) {
      throw error;
    }
  }

  async getManagerById(managerId: string): Promise<Manager | null> {
    const params = {
      TableName: 'Managers',
      Key: { id: managerId }
    };
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      return result.Item as Manager || null;
    } catch (error) {
      throw error;
    }
  }

  // 일반 사용자 관련 메서드 (기존 Users 테이블 사용)
  async getUsers(): Promise<User[]> {
    const params = {
      TableName: 'Users'
    };
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items as User[] || [];
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    
    const params = {
      TableName: 'Users',
      Key: { user_id: userId }
    };
    
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      
      return result.Item as User || null;
    } catch (error) {
      throw error;
    }
  }

  async getProfile(userId: string): Promise<any | null> {
    
    const params = {
      TableName: 'Profiles',
      Key: { user_id: userId }
    };
    
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      
      return result.Item || null;
    } catch (error) {
      // 프로필이 없어도 오류로 처리하지 않음
      return null;
    }
  }

  async getPreferences(userId: string): Promise<any | null> {
    
    const params = {
      TableName: 'Preferences',
      Key: { user_id: userId }
    };
    
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      
      return result.Item || null;
    } catch (error) {
      // 선호도가 없어도 오류로 처리하지 않음
      return null;
    }
  }

  async updateUserStatus(userId: string, status: string, reason?: string): Promise<User | null> {
    const params: any = {
      TableName: 'Users',
      Key: { user_id: userId },
      UpdateExpression: 'SET #status = :status, updated_at = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW' as const
    };

    if (reason) {
      params.UpdateExpression += ', delete_reason = :reason';
      params.ExpressionAttributeValues[':reason'] = reason;
    }
    
    try {
      const result = await dynamodb.send(new UpdateCommand(params));
      return result.Attributes as User || null;
    } catch (error) {
      throw error;
    }
  }

  async updateUserGrade(userId: string, grade: string): Promise<User | null> {
    const params = {
      TableName: 'Users',
      Key: { user_id: userId },
      UpdateExpression: 'SET grade = :grade, updated_at = :updatedAt',
      ExpressionAttributeValues: {
        ':grade': grade,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW' as const
    };
    
    try {
      const result = await dynamodb.send(new UpdateCommand(params));
      return result.Attributes as User || null;
    } catch (error) {
      throw error;
    }
  }

  // 매칭 관련 메서드
  async getMatchingRequests(status?: string): Promise<MatchingRequest[]> {
    const params: any = {
      TableName: 'MatchingRequests'
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = {
        '#status': 'status'
      };
      params.ExpressionAttributeValues = {
        ':status': status
      };
    }
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items as MatchingRequest[] || [];
    } catch (error) {
      throw error;
    }
  }

  async getProposals(status?: string): Promise<Proposal[]> {
    const params: any = {
      TableName: 'Proposals'
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = {
        '#status': 'status'
      };
      params.ExpressionAttributeValues = {
        ':status': status
      };
    }
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items as Proposal[] || [];
    } catch (error) {
      console.error('❌ getProposals 에러:', error);
      throw error;
    }
  }

  async getMatchPairs(): Promise<MatchPair[]> {
    const params = {
      TableName: 'MatchPairs'
    };
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items as MatchPair[] || [];
    } catch (error) {
      throw error;
    }
  }

  async getMatchPairByRequestId(requestId: string): Promise<MatchPair | null> {
    const params = {
      TableName: 'MatchPairs',
      FilterExpression: 'match_a_id = :requestId OR match_b_id = :requestId',
      ExpressionAttributeValues: {
        ':requestId': requestId
      }
    };
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items?.[0] as MatchPair || null;
    } catch (error) {
      throw error;
    }
  }

  async getMatchingHistory(): Promise<MatchingHistory[]> {
    const params = {
      TableName: 'MatchingHistory'
    };
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items as MatchingHistory[] || [];
    } catch (error) {
      throw error;
    }
  }

  async getReviews(): Promise<Review[]> {
    const params = {
      TableName: 'Reviews'
    };
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      return result.Items as Review[] || [];
    } catch (error) {
      throw error;
    }
  }

  // 포인트 관련 메서드
  async getPointHistory(userId?: string): Promise<PointHistory[]> {
    const params: any = {
      TableName: 'PointHistory'
    };

    if (userId) {
      params.KeyConditionExpression = 'user_id = :userId';
      params.ExpressionAttributeValues = {
        ':userId': userId
      };
      params.ScanIndexForward = false; // 최신순
    }
    
    try {
      const result = userId 
        ? await dynamodb.send(new QueryCommand(params))
        : await dynamodb.send(new ScanCommand(params));
      return result.Items as PointHistory[] || [];
    } catch (error) {
      throw error;
    }
  }

  // 사용자 상태 이력 관련 메서드
  async getUserStatusHistory(userId?: string): Promise<UserStatusHistory[]> {
    const params: any = {
      TableName: 'UserStatusHistory'
    };

    if (userId) {
      params.KeyConditionExpression = 'user_id = :userId';
      params.ExpressionAttributeValues = {
        ':userId': userId
      };
      params.ScanIndexForward = false; // 최신순
    }
    
    try {
      const result = userId 
        ? await dynamodb.send(new QueryCommand(params))
        : await dynamodb.send(new ScanCommand(params));
      return result.Items as UserStatusHistory[] || [];
    } catch (error) {
      throw error;
    }
  }

  // 매니저 로그 관련 메서드
  async logManagerAction(managerId: string, actionType: string, targetId: string, details: string): Promise<void> {
    const params = {
      TableName: 'ManagerLogs',
      Item: {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        managerId: managerId,
        action: actionType,
        targetId: targetId,
        details: details
      }
    };
    
    try {
      await dynamodb.send(new PutCommand(params));
    } catch (error) {
      throw error;
    }
  }

  async getManagerLogs(limit: number = 50, managerId?: string, action?: string): Promise<ManagerLog[]> {
    const params: any = {
      TableName: 'ManagerLogs',
      Limit: limit
    };

    if (managerId || action) {
      params.FilterExpression = [];
      params.ExpressionAttributeValues = {};
      
      if (managerId) {
        params.FilterExpression.push('managerId = :managerId');
        params.ExpressionAttributeValues[':managerId'] = managerId;
      }
      
      if (action) {
        params.FilterExpression.push('action = :action');
        params.ExpressionAttributeValues[':action'] = action;
      }
      
      params.FilterExpression = params.FilterExpression.join(' AND ');
    }
    
    try {
      const result = await dynamodb.send(new ScanCommand(params));
      const logs = result.Items as any[] || [];
      // 실제 테이블 스키마에 맞게 변환
      const convertedLogs: ManagerLog[] = logs.map(log => ({
        id: log.id,
        manager_id: log.managerId,
        action_type: log.action,
        target_id: log.targetId,
        details: log.details,
        created_at: log.timestamp
      }));
      return convertedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      throw error;
    }
  }

  // 유틸리티 메서드
  getTargetType(targetId: string): string {
    if (targetId.startsWith('user_')) return 'user';
    if (targetId.startsWith('match_')) return 'match';
    return 'unknown';
  }

  // 대시보드 통계 메서드
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [users, matches, points] = await Promise.all([
        this.getUsers(),
        this.getMatchingHistory(),
        this.getPointHistory()
      ]);

      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.status === 'active' || user.status === 'green').length;
      const totalMatches = matches.length;
      const totalPoints = points.reduce((sum, point) => sum + point.amount, 0);
      const totalRevenue = points
        .filter(point => point.type === 'charge' || point.amount > 0)
        .reduce((sum, point) => sum + Math.abs(point.amount), 0);

      return {
        totalUsers,
        activeUsers,
        totalMatches,
        totalPoints,
        totalRevenue
      };
    } catch (error) {
      throw error;
    }
  }

  // 최근 활동 메서드
  async getRecentActivities(limit: number = 10): Promise<any[]> {
    try {
      const [users, matches, points] = await Promise.all([
        this.getUsers(),
        this.getMatchingHistory(),
        this.getPointHistory()
      ]);

      const activities: any[] = [];

      // 최근 가입한 사용자들
      const recentUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

      recentUsers.forEach(user => {
        activities.push({
          id: user.user_id,
          type: 'user_signup',
          description: `새로운 사용자가 가입했습니다: ${user.email}`,
          timestamp: user.created_at,
          user: user.email
        });
      });

      // 최근 매칭 활동
      const recentMatches = matches
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

      recentMatches.forEach(match => {
        activities.push({
          id: match.id,
          type: 'matching',
          description: `새로운 매칭이 생성되었습니다: ${match.user1_id} ↔ ${match.user2_id}`,
          timestamp: match.created_at,
          user: `${match.user1_id}, ${match.user2_id}`
        });
      });

      // 최근 포인트 거래
      const recentPoints = points
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

      recentPoints.forEach(point => {
        activities.push({
          id: point.id,
          type: 'point_transaction',
          description: `포인트 거래: ${point.amount > 0 ? '+' : ''}${point.amount}P (${point.type})`,
          timestamp: point.created_at,
          user: point.user_id
        });
      });

      // 모든 활동을 시간순으로 정렬하고 최근 limit개만 반환
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      throw error;
    }
  }

  // users + scores + profiles 병합 반환
  async getUsersWithScoreAndProfile(): Promise<any[]> {
    const users = await this.getUsers();
    // Scores, Profiles 모두 Scan
    const scoresResult = await dynamodb.send(new ScanCommand({ TableName: 'Scores' }));
    const profilesResult = await dynamodb.send(new ScanCommand({ TableName: 'Profiles' }));
    const scores = scoresResult.Items || [];
    const profiles = profilesResult.Items || [];
    // 병합
    return users.map(user => ({
      ...user,
      score: scores.find(s => s.user_id === user.user_id) || null,
      profile: profiles.find(p => p.user_id === user.user_id) || null,
    }));
  }

  // 여러 user_id로 Users + Profiles 정보 한 번에 조회
  async getUsersWithProfilesByIds(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];
    
    const params = {
      RequestItems: {
        'Users': {
          Keys: userIds.map(id => ({ user_id: id }))
        },
        'Profiles': {
          Keys: userIds.map(id => ({ user_id: id }))
        }
      }
    };
    
    try {
      const result = await dynamodb.send(new BatchGetCommand(params));
      const users = result.Responses?.['Users'] || [];
      const profiles = result.Responses?.['Profiles'] || [];
      
      // 사용자와 프로필을 매칭
      const userMap = new Map(users.map(user => [user.user_id, user]));
      const profileMap = new Map(profiles.map(profile => [profile.user_id, profile]));
      
      return userIds.map(userId => ({
        ...userMap.get(userId),
        profile: profileMap.get(userId) || null
      }));
    } catch (error) {
      throw error;
    }
  }

  async updateMatchingRequestDateAddress(requestId: string, dateAddress: string): Promise<void> {
    const params = {
      TableName: 'MatchingRequests',
      Key: { request_id: requestId },
      UpdateExpression: 'SET date_address = :dateAddress, updated_at = :updatedAt',
      ExpressionAttributeValues: {
        ':dateAddress': dateAddress,
        ':updatedAt': new Date().toISOString()
      }
    };
    
    try {
      await dynamodb.send(new UpdateCommand(params));
      console.log(`✅ MatchingRequests date_address 업데이트 완료: ${requestId}`);
    } catch (error) {
      console.error(`❌ MatchingRequests date_address 업데이트 실패: ${requestId}`, error);
      throw error;
    }
  }
}

const dataService = new DataService();
export default dataService;

// Scores 테이블 연동 함수
export async function saveUserScore(userId: string, score: any, scorer: string, summary: string = '') {
  const now = new Date().toISOString();
  // 기존 점수 row 모두 삭제 (user_id로 Query)
  const existing = await dynamodb.send(new QueryCommand({
    TableName: 'Scores',
    KeyConditionExpression: 'user_id = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  for (const item of existing.Items || []) {
    await dynamodb.send(new DeleteCommand({
      TableName: 'Scores',
      Key: { user_id: item.user_id, created_at: item.created_at },
    }));
  }
  // Scores 테이블: user_id + created_at(=now)로 저장
  const average =
    score.appearance * 0.25 +
    score.personality * 0.25 +
    score.job * 0.2 +
    score.education * 0.15 +
    score.economics * 0.15;
  function getGrade(score: number): string {
    if (score >= 95) return 'S';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 55) return 'D';
    if (score >= 45) return 'E';
    return 'F';
  }
  const averageGrade = getGrade(average);
  const item = {
    user_id: userId,
    created_at: now,
    scorer,
    ...score,
    average,
    average_grade: averageGrade, // averageGrade를 grade 필드로 저장
    updated_at: now,
  };
  await dynamodb.send(new PutCommand({ TableName: 'Scores', Item: item }));
  // Users 테이블에 has_score: true 업데이트
  await dynamodb.send(new UpdateCommand({
    TableName: 'Users',
    Key: { user_id: userId },
    UpdateExpression: 'SET has_score = :true, updated_at = :updatedAt',
    ExpressionAttributeValues: { ':true': true, ':updatedAt': now },
  }));
  // 점수 저장 전 평균/등급 계산
  // ScoreHistory 테이블에 이력 저장 (평탄화 구조)
  await dynamodb.send(new PutCommand({
    TableName: 'ScoreHistory',
    Item: {
      user_id: userId,
      created_at: now,
      face_score: score.faceScore,
      appearance: score.appearance,
      personality: score.personality,
      job: score.job,
      education: score.education,
      economics: score.economics,
      average,
      average_grade: averageGrade,
      reason: summary,
      manager_id: scorer,
    }
  }));
  // UserStatusHistory에는 점수 이력 저장하지 않음
  return item;
}

export async function getUserScoreHistory(userId: string): Promise<any[]> {
  const params = {
    TableName: 'ScoreHistory',
    KeyConditionExpression: 'user_id = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false, // 최신순 정렬
  };
  const result = await dynamodb.send(new QueryCommand(params));
  return result.Items || [];
} 

export async function deleteAllScoreHistory(userId: string) {
  // 해당 user_id의 모든 ScoreHistory row 삭제
  const result = await dynamodb.send(new QueryCommand({
    TableName: 'ScoreHistory',
    KeyConditionExpression: 'user_id = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));
  for (const item of result.Items || []) {
    await dynamodb.send(new DeleteCommand({
      TableName: 'ScoreHistory',
      Key: { user_id: item.user_id, created_at: item.created_at },
    }));
  }
} 

export async function getUserScore(userId: string): Promise<any | null> {
  const params = {
    TableName: 'Scores',
    KeyConditionExpression: 'user_id = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false, // 최신순
    Limit: 1,
  };
  const result = await dynamodb.send(new QueryCommand(params));
  return result.Items?.[0] || null;
} 