import { commonHeaders } from '../utils';

export const handler = async (event: any) => {
  const startTime = Date.now();
  
  try {
    // 옵션 데이터 반환
    const options = {
      regions: [
        { id: 'seoul', name: '서울' },
        { id: 'gyeonggi', name: '경기' },
        { id: 'incheon', name: '인천' },
        { id: 'busan', name: '부산' },
        { id: 'daegu', name: '대구' },
        { id: 'daejeon', name: '대전' },
        { id: 'gwangju', name: '광주' },
        { id: 'ulsan', name: '울산' },
        { id: 'sejong', name: '세종' },
        { id: 'gangwon', name: '강원' },
        { id: 'chungbuk', name: '충북' },
        { id: 'chungnam', name: '충남' },
        { id: 'jeonbuk', name: '전북' },
        { id: 'jeonnam', name: '전남' },
        { id: 'gyeongbuk', name: '경북' },
        { id: 'gyeongnam', name: '경남' },
        { id: 'jeju', name: '제주' }
      ],
      bodyTypes: [
        { id: 'slim', name: '슬림' },
        { id: 'normal', name: '보통' },
        { id: 'chubby', name: '통통' },
        { id: 'muscular', name: '근육질' }
      ],
      educations: [
        { id: 'high_school', name: '고등학교' },
        { id: 'college', name: '전문대학' },
        { id: 'university', name: '대학교' },
        { id: 'graduate', name: '대학원' }
      ],
      religions: [
        { id: 'none', name: '무교' },
        { id: 'christian', name: '기독교' },
        { id: 'catholic', name: '천주교' },
        { id: 'buddhist', name: '불교' },
        { id: 'other', name: '기타' }
      ],
      childrenDesires: [
        { id: 'yes', name: '있음' },
        { id: 'no', name: '없음' },
        { id: 'undecided', name: '미정' }
      ],
      salaries: [
        { id: 'under_30', name: '3000만원 미만' },
        { id: '30_50', name: '3000-5000만원' },
        { id: '50_70', name: '5000-7000만원' },
        { id: '70_100', name: '7000만원-1억원' },
        { id: 'over_100', name: '1억원 이상' }
      ],
      assets: [
        { id: 'under_100', name: '1억원 미만' },
        { id: '100_300', name: '1억-3억원' },
        { id: '300_500', name: '3억-5억원' },
        { id: '500_1000', name: '5억-10억원' },
        { id: 'over_1000', name: '10억원 이상' }
      ]
    };

    console.log('옵션 조회 성공:', { executionTime: Date.now() - startTime });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        options: options
      })
    };
  } catch (error: any) {
    console.error('옵션 조회 오류:', { error: error.message, stack: error.stack });
    
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