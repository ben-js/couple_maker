import { appendLog, commonHeaders } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    const privacy = {
      title: "개인정보처리방침",
      content: `
1. 개인정보의 처리 목적
회사는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
- 회원가입 및 관리
- 서비스 제공 및 운영
- 고객상담 및 문의응답
- 마케팅 및 광고에의 활용

2. 개인정보의 처리 및 보유기간
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

3. 개인정보의 제3자 제공
회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

4. 개인정보처리의 위탁
회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
- 위탁받는 자 (수탁자): AWS
- 위탁하는 업무의 내용: 클라우드 서비스 제공

5. 정보주체의 권리·의무 및 그 행사방법
이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
- 개인정보 열람요구
- 오류 등이 있을 경우 정정 요구
- 삭제요구
- 처리정지 요구

6. 개인정보의 파기
회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.

7. 개인정보의 안전성 확보 조치
회사는 개인정보보호법 제29조에 따라 다음과 같은 안전성 확보 조치를 취하고 있습니다.
- 개인정보의 암호화
- 해킹 등에 대비한 기술적 대책
- 개인정보에 대한 접근 제한

8. 개인정보 보호책임자
회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

▶ 개인정보 보호책임자
성명: 데이트센스
연락처: support@datesense.com

9. 개인정보 처리방침 변경
이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.

시행일자: 2024년 1월 1일
      `
    };

    await appendLog({
      type: 'get_privacy',
      result: 'success',
      message: '개인정보처리방침 조회 성공',
      requestMethod: event.httpMethod,
      requestPath: event.path,
      responseStatus: 200,
      responseBody: JSON.stringify({ success: true, privacy }),
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        privacy
      })
    };
  } catch (error: any) {
    console.error('개인정보처리방침 조회 오류:', error);
    
    await appendLog({
      type: 'get_privacy',
      result: 'fail',
      message: error.message || '개인정보처리방침 조회 중 오류가 발생했습니다.',
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