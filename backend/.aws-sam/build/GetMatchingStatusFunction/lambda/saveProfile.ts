import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, camelToSnakeCase } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { user_id, name, birth_date, gender, height, body_type, job, education, region, mbti, interests, favorite_foods, smoking, drinking, religion, children_desire, salary, asset, marriage_plans, introduction, photos } = req;
  
  try {
    const profileData = {
      user_id,
      name,
      birth_date,
      gender,
      height,
      body_type,
      job,
      education,
      region,
      mbti,
      interests,
      favorite_foods,
      smoking,
      drinking,
      religion,
      children_desire,
      salary,
      asset,
      marriage_plans,
      introduction,
      photos: photos || [],
      updated_at: new Date().toISOString()
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: 'Profiles',
        Item: profileData
      })
    );

    // Users 테이블의 has_profile 업데이트
    await ddbDocClient.send(
      new PutCommand({
        TableName: 'Users',
        Item: {
          user_id,
          has_profile: true
        }
      })
    );

    console.log('프로필 저장 성공:', { user_id, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        message: '프로필이 성공적으로 저장되었습니다.'
      })
    };
  } catch (error: any) {
    console.error('프로필 저장 오류:', { user_id, error: error.message, stack: error.stack });
    
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