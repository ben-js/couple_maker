import { commonHeaders } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    // 매칭 상태 자동 처리 로직 (현재는 기본 응답만)
    // 향후 매칭 상태 자동 업데이트 로직을 여기에 구현
    
    console.log('매칭 상태 자동 처리 완료:', { executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        message: '매칭 상태 처리가 완료되었습니다.'
      })
    };
  } catch (error: any) {
    console.error('매칭 상태 처리 오류:', { error: error.message, stack: error.stack });
    
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