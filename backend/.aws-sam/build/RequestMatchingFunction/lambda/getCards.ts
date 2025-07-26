import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, calcAge } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.queryStringParameters?.userId;
  
  try {
    // 프로필 목록 조회 (사용자 본인 제외)
    const profilesResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: 'Profiles',
        FilterExpression: 'user_id <> :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    );

    const cards = (profilesResult.Items || []).map((profile: any) => ({
      userId: profile.user_id,
      name: profile.name,
      age: calcAge(profile.birth_date),
      location: profile.location,
      job: profile.job,
      education: profile.education,
      height: profile.height,
      bodyType: profile.body_type,
      smoking: profile.smoking,
      drinking: profile.drinking,
      religion: profile.religion,
      personality: profile.personality,
      hobby: profile.hobby,
      introduction: profile.introduction,
      photos: profile.photos || []
    }));

    console.log('카드 목록 조회 성공:', { userId, count: cards.length, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        cards: cards
      })
    };
  } catch (error: any) {
    console.error('카드 목록 조회 오류:', { userId, error: error.message, stack: error.stack });
    
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