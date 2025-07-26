import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { appendLog, commonHeaders, ddbDocClient, calcAge } from '../utils';
import { User, Profile } from '../types';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 모든 프로필 조회 (자신 제외)
    const profilesResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Profiles',
        FilterExpression: 'user_id <> :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );

    // 사용자 정보 조회
    const usersResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Users'
      })
    );

    // 사용자 정보를 Map으로 변환
    const usersMap = new Map();
    usersResult.Items?.forEach((user: User) => {
      usersMap.set(user.user_id, user);
    });

    // 카드 데이터 구성 및 랜덤 선택
    const cards = profilesResult.Items?.map((profile: Profile) => {
      const user = usersMap.get(profile.user_id);
      if (!user || user.is_deleted) return null;

      return {
        userId: profile.user_id,
        name: profile.name,
        age: calcAge(profile.birth_date),
        location: profile.region?.region || '',
        job: profile.job,
        education: profile.education,
        height: profile.height,
        bodyType: profile.body_type,
        smoking: profile.smoking,
        drinking: profile.drinking,
        religion: profile.religion,
        personality: profile.mbti,
        hobby: profile.interests,
        introduction: profile.introduction,
        photos: profile.photos || [],
        grade: user.grade,
        status: user.status,
        points: user.points
      };
    }).filter((card: any) => card !== null);

    // 랜덤하게 하나 선택
    const mainCard = cards.length > 0 ? cards[Math.floor(Math.random() * cards.length)] : null;

    await appendLog({
      type: 'get_main_card',
      userId,
      result: 'success',
      message: '메인 카드 조회 성공',
      detail: { cardCount: cards.length, hasMainCard: !!mainCard },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      responseStatus: 200,
      responseBody: JSON.stringify({ success: true, mainCard }),
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        mainCard
      })
    };
  } catch (error: any) {
    console.error('메인 카드 조회 오류:', error);
    
    await appendLog({
      type: 'get_main_card',
      userId,
      result: 'fail',
      message: error.message || '메인 카드 조회 중 오류가 발생했습니다.',
      detail: { userId, error: error.message },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      responseStatus: 500,
      responseBody: JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
      errorStack: error.stack,
      executionTime: Date.now() - startTime,
      logLevel: 'error'
    });

    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    };
  }
}; 