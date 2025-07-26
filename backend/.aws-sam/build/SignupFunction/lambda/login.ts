import { commonHeaders, camelToSnakeCase } from '../utils';
const authService = require('../services/authService');

export const handler = async (event: any) => {
  const req = camelToSnakeCase(JSON.parse(event.body || '{}'));
  const { email, password } = req;
  
  try {
    const result = await authService.login(email, password);
    
    return {
      statusCode: result.statusCode,
      headers: commonHeaders,
      body: JSON.stringify({
        success: result.success,
        message: result.message,
        ...(result.data && result.data),
        ...(result.error && { error: result.error })
      })
    };
    
  } catch (error: any) {
    console.error('Lambda 핸들러 오류:', error);

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