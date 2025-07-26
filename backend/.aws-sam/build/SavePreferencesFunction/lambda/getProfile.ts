import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, calcAge } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const userId = event.pathParameters?.userId || event.headers?.userid;
  
  try {
    const profileResult = await ddbDocClient.send(
      new GetCommand({
        TableName: 'Profiles',
        Key: { user_id: userId }
      })
    );

    if (!profileResult.Item) {
      return {
        statusCode: 404,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '프로필을 찾을 수 없습니다.'
        })
      };
    }

    const profile = profileResult.Item;
    const profileData = {
      userId: profile.user_id,
      name: profile.name,
      age: calcAge(profile.birth_date),
      birthDate: profile.birth_date,
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
      photos: profile.photos || [],
      updatedAt: profile.updated_at
    };

    console.log('프로필 조회 성공:', { userId, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        profile: profileData
      })
    };
  } catch (error: any) {
    console.error('프로필 조회 오류:', { userId, error: error.message, stack: error.stack });

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