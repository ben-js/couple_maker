import { commonHeaders } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('헬스 체크 성공:', { executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        health: healthCheck
      })
    };
  } catch (error: any) {
    console.error('헬스 체크 오류:', { error: error.message, stack: error.stack });
    
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