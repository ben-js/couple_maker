const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🚀 DateSense API 테스트 시작...\n');

  try {
    // 1. 이용약관 조회 테스트
    console.log('1️⃣ 이용약관 조회 테스트');
    const termsResponse = await axios.get(`${BASE_URL}/terms`);
    console.log('✅ 이용약관 조회 성공:', termsResponse.data.success);
    console.log('제목:', termsResponse.data.terms.title);
    console.log('');

    // 2. 개인정보처리방침 조회 테스트
    console.log('2️⃣ 개인정보처리방침 조회 테스트');
    const privacyResponse = await axios.get(`${BASE_URL}/privacy`);
    console.log('✅ 개인정보처리방침 조회 성공:', privacyResponse.data.success);
    console.log('제목:', privacyResponse.data.privacy.title);
    console.log('');

    // 3. 고객센터 정보 조회 테스트
    console.log('3️⃣ 고객센터 정보 조회 테스트');
    const customerServiceResponse = await axios.get(`${BASE_URL}/customer-service`);
    console.log('✅ 고객센터 정보 조회 성공:', customerServiceResponse.data.success);
    console.log('제목:', customerServiceResponse.data.customerService.title);
    console.log('이메일:', customerServiceResponse.data.customerService.contact.email);
    console.log('');

    // 4. 회원가입 테스트
    console.log('4️⃣ 회원가입 테스트');
    const signupData = {
      email: 'test@example.com',
      password: 'Test1234!',
      name: '테스트 사용자'
    };
    const signupResponse = await axios.post(`${BASE_URL}/signup`, signupData);
    console.log('✅ 회원가입 성공:', signupResponse.data.success);
    console.log('사용자 ID:', signupResponse.data.userId);
    console.log('');

    // 5. 로그인 테스트
    console.log('5️⃣ 로그인 테스트');
    const loginData = {
      email: 'test@example.com',
      password: 'Test1234!'
    };
    const loginResponse = await axios.post(`${BASE_URL}/login`, loginData);
    console.log('✅ 로그인 성공:', loginResponse.data.success);
    console.log('사용자 정보:', loginResponse.data.user);
    console.log('');

    // 6. 프로필 저장 테스트
    console.log('6️⃣ 프로필 저장 테스트');
    const profileData = {
      userId: signupResponse.data.userId,
      name: '테스트 사용자',
      birthDate: '1990-01-01',
      location: '서울시 강남구',
      job: '개발자',
      education: '대학교 졸업',
      height: 170,
      bodyType: '보통',
      smoking: '비흡연',
      drinking: '가끔',
      religion: '무교',
      personality: '외향적',
      hobby: '독서, 영화감상',
      introduction: '안녕하세요! 테스트 사용자입니다.'
    };
    const profileResponse = await axios.post(`${BASE_URL}/profile`, profileData);
    console.log('✅ 프로필 저장 성공:', profileResponse.data.success);
    console.log('');

    // 7. 프로필 조회 테스트
    console.log('7️⃣ 프로필 조회 테스트');
    const getProfileResponse = await axios.get(`${BASE_URL}/profile/${signupResponse.data.userId}`);
    console.log('✅ 프로필 조회 성공:', getProfileResponse.data.success);
    console.log('이름:', getProfileResponse.data.profile.name);
    console.log('나이:', getProfileResponse.data.profile.age);
    console.log('');

    // 8. 선호도 저장 테스트
    console.log('8️⃣ 선호도 저장 테스트');
    const preferencesData = {
      userId: signupResponse.data.userId,
      ageRange: [25, 35],
      location: ['서울시', '경기도'],
      heightRange: [160, 180],
      bodyType: ['보통', '슬림'],
      smoking: ['비흡연'],
      drinking: ['가끔', '자주'],
      religion: ['무교', '기독교'],
      personality: ['외향적', '내향적']
    };
    const preferencesResponse = await axios.post(`${BASE_URL}/user-preferences`, preferencesData);
    console.log('✅ 선호도 저장 성공:', preferencesResponse.data.success);
    console.log('');

    // 9. 선호도 조회 테스트
    console.log('9️⃣ 선호도 조회 테스트');
    const getPreferencesResponse = await axios.get(`${BASE_URL}/user-preferences/${signupResponse.data.userId}`);
    console.log('✅ 선호도 조회 성공:', getPreferencesResponse.data.success);
    console.log('나이 범위:', getPreferencesResponse.data.preferences.ageRange);
    console.log('');

    // 10. 카드 목록 조회 테스트
    console.log('🔟 카드 목록 조회 테스트');
    const cardsResponse = await axios.get(`${BASE_URL}/cards?userId=${signupResponse.data.userId}`);
    console.log('✅ 카드 목록 조회 성공:', cardsResponse.data.success);
    console.log('카드 개수:', cardsResponse.data.cards.length);
    console.log('');

    // 11. 메인 카드 조회 테스트
    console.log('1️⃣1️⃣ 메인 카드 조회 테스트');
    const mainCardResponse = await axios.get(`${BASE_URL}/main-card?userId=${signupResponse.data.userId}`);
    console.log('✅ 메인 카드 조회 성공:', mainCardResponse.data.success);
    if (mainCardResponse.data.mainCard) {
      console.log('메인 카드 이름:', mainCardResponse.data.mainCard.name);
    } else {
      console.log('메인 카드 없음 (다른 사용자가 없음)');
    }
    console.log('');

    // 12. 업로드 URL 생성 테스트
    console.log('1️⃣2️⃣ 업로드 URL 생성 테스트');
    const uploadUrlData = {
      userId: signupResponse.data.userId,
      fileName: 'test-image.jpg',
      fileType: 'image/jpeg'
    };
    const uploadUrlResponse = await axios.post(`${BASE_URL}/get-upload-url`, uploadUrlData);
    console.log('✅ 업로드 URL 생성 성공:', uploadUrlResponse.data.success);
    console.log('S3 경로:', uploadUrlResponse.data.s3Path);
    console.log('');

    // 13. 매칭 요청 테스트 (자기 자신에게)
    console.log('1️⃣3️⃣ 매칭 요청 테스트');
    const matchingData = {
      userId: signupResponse.data.userId,
      targetUserId: signupResponse.data.userId,
      message: '테스트 매칭 요청입니다.'
    };
    const matchingResponse = await axios.post(`${BASE_URL}/matching-requests`, matchingData);
    console.log('✅ 매칭 요청 성공:', matchingResponse.data.success);
    console.log('요청 ID:', matchingResponse.data.requestId);
    console.log('');

    // 14. 매칭 요청 목록 조회 테스트
    console.log('1️⃣4️⃣ 매칭 요청 목록 조회 테스트');
    const matchingRequestsResponse = await axios.get(`${BASE_URL}/matching-requests?userId=${signupResponse.data.userId}`);
    console.log('✅ 매칭 요청 목록 조회 성공:', matchingRequestsResponse.data.success);
    console.log('받은 요청 개수:', matchingRequestsResponse.data.requests.received.length);
    console.log('보낸 요청 개수:', matchingRequestsResponse.data.requests.sent.length);
    console.log('');

    console.log('🎉 모든 API 테스트 완료!');

  } catch (error) {
    console.error('❌ API 테스트 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
testAPI(); 