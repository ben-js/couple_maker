import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { commonHeaders, ddbDocClient, cognitoService, camelToSnakeCase } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { email, password, name } = req;
  
  try {
    // Cognito를 통한 회원가입
    const result = await cognitoService.signUp(email, password, name);
    
    if (result.success) {
      // DynamoDB에 사용자 기본 정보 저장
      const userId = result.userSub;
      const userData = {
        user_id: userId,
        email: email,
        is_verified: false,
        has_profile: false,
        has_preferences: false,
        grade: 'general',
        status: 'green',
        is_deleted: false,
        points: 100, // 회원가입 보너스
        created_at: new Date().toISOString()
      };

      await ddbDocClient.send(
        new PutCommand({
          TableName: 'Users',
          Item: userData
        })
      );

      // 포인트 히스토리 기록
      await ddbDocClient.send(
        new PutCommand({
          TableName: 'PointsHistory',
          Item: {
            user_id: userId,
            timestamp: new Date().toISOString(),
            type: 'signup',
            points: 100,
            description: '회원가입 보너스',
            related_id: null
          }
        })
      );

      console.log('회원가입 성공:', { userId, email, executionTime: Date.now() - startTime });

      return {
        statusCode: 200,
        headers: commonHeaders,
        body: JSON.stringify({
          success: true,
          message: result.message,
          userId: userId
        })
      };
    } else {
      console.error('회원가입 실패:', { email, message: result.message });
      
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: result.message
        })
      };
    }
  } catch (error: any) {
    console.error('회원가입 오류:', { email, error: error.message, stack: error.stack });
    
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