import { appendLog, commonHeaders } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    const customerService = {
      title: "고객센터",
      contact: {
        email: "support@datesense.com",
        phone: "1588-1234",
        kakao: "@datesense",
        instagram: "@datesense_official"
      },
      faq: [
        {
          question: "회원가입은 어떻게 하나요?",
          answer: "앱에서 이메일과 비밀번호를 입력하여 간단히 가입할 수 있습니다."
        },
        {
          question: "프로필은 언제 작성해야 하나요?",
          answer: "회원가입 후 언제든지 프로필을 작성할 수 있으며, 프로필 작성 후 더 정확한 매칭을 받을 수 있습니다."
        },
        {
          question: "매칭 요청은 어떻게 하나요?",
          answer: "관심 있는 상대방의 카드에서 '매칭 요청' 버튼을 눌러 요청할 수 있습니다."
        },
        {
          question: "포인트는 어떻게 충전하나요?",
          answer: "마이페이지 > 포인트 충전에서 원하는 금액을 선택하여 충전할 수 있습니다."
        },
        {
          question: "계정을 삭제하려면 어떻게 해야 하나요?",
          answer: "마이페이지 > 설정 > 계정 삭제에서 삭제할 수 있습니다."
        }
      ],
      operatingHours: "평일 09:00 - 18:00 (주말 및 공휴일 휴무)",
      responseTime: "문의 후 24시간 이내 답변"
    };

    await appendLog({
      type: 'get_customer_service',
      result: 'success',
      message: '고객센터 정보 조회 성공',
      requestMethod: event.httpMethod,
      requestPath: event.path,
      responseStatus: 200,
      responseBody: JSON.stringify({ success: true, customerService }),
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        customerService
      })
    };
  } catch (error: any) {
    console.error('고객센터 정보 조회 오류:', error);
    
    await appendLog({
      type: 'get_customer_service',
      result: 'fail',
      message: error.message || '고객센터 정보 조회 중 오류가 발생했습니다.',
      detail: { error: error.message },
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