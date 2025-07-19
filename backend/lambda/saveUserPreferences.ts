import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, camelToSnakeCase } from '../utils';

export const savePreferences = async (event: any) => {
  return await handler(event);
};

export const handler = async (event: any) => {
  const startTime = Date.now();
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { user_id, age_range, height_range, body_type, education, region, smoking, drinking, religion, children_desire, salary, asset, personality, hobby, introduction_preference } = req;
  
  try {
    const preferencesData = {
      user_id,
      age_range,
      height_range,
      body_type,
      education,
      region,
      smoking,
      drinking,
      religion,
      children_desire,
      salary,
      asset,
      personality,
      hobby,
      introduction_preference,
      updated_at: new Date().toISOString()
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: 'Preferences',
        Item: preferencesData
      })
    );

    // Users 테이블의 has_preferences 업데이트
    await ddbDocClient.send(
      new PutCommand({
        TableName: 'Users',
        Item: {
          user_id,
          has_preferences: true
        }
      })
    );

    console.log('사용자 선호도 저장 성공:', { user_id, executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        message: '사용자 선호도가 성공적으로 저장되었습니다.'
      })
    };
  } catch (error: any) {
    console.error('사용자 선호도 저장 오류:', { user_id, error: error.message, stack: error.stack });
    
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