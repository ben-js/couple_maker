import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
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
  ReviewStats
} from '../types';

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
      console.error('매니저 계정 조회 오류:', error);
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
      console.error('매니저 계정 조회 오류:', error);
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
      console.error('사용자 조회 오류:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    console.log('DataService.getUserById 호출됨, userId:', userId);
    
    const params = {
      TableName: 'Users',
      Key: { user_id: userId }
    };
    
    console.log('DynamoDB 파라미터:', params);
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      console.log('DynamoDB 응답:', result);
      console.log('조회된 사용자:', result.Item);
      return result.Item as User || null;
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<any | null> {
    console.log('DataService.getUserProfile 호출됨, userId:', userId);
    
    const params = {
      TableName: 'Profiles',
      Key: { user_id: userId }
    };
    
    console.log('프로필 조회 파라미터:', params);
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      console.log('프로필 조회 결과:', result.Item);
      return result.Item || null;
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      // 프로필이 없어도 오류로 처리하지 않음
      return null;
    }
  }

  async getUserPreferences(userId: string): Promise<any | null> {
    console.log('DataService.getUserPreferences 호출됨, userId:', userId);
    
    const params = {
      TableName: 'Preferences',
      Key: { user_id: userId }
    };
    
    console.log('선호도 조회 파라미터:', params);
    
    try {
      const result = await dynamodb.send(new GetCommand(params));
      console.log('선호도 조회 결과:', result.Item);
      return result.Item || null;
    } catch (error) {
      console.error('선호도 조회 오류:', error);
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
      console.error('사용자 상태 업데이트 오류:', error);
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
      console.error('사용자 등급 업데이트 오류:', error);
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
      console.error('매칭 요청 조회 오류:', error);
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
      console.error('제안 조회 오류:', error);
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
      console.error('매칭 페어 조회 오류:', error);
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
      console.error('매칭 이력 조회 오류:', error);
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
      console.error('리뷰 조회 오류:', error);
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
      console.error('포인트 내역 조회 오류:', error);
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
      console.error('사용자 상태 이력 조회 오류:', error);
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
      console.log('✅ 매니저 로그 저장 완료:', params.Item);
    } catch (error) {
      console.error('매니저 액션 로그 저장 오류:', error);
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
      console.error('매니저 로그 조회 오류:', error);
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
      console.error('대시보드 통계 조회 오류:', error);
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
      console.error('최근 활동 조회 오류:', error);
      throw error;
    }
  }
}

export default DataService; 