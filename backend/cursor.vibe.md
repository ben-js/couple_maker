# Backend Cursor Rules

## 🎯 핵심 개발 규칙

### 1. API 설계 원칙
- **RESTful 엔드포인트**: kebab-case 사용 (`/user-preferences`, `/matching-requests`)
- **HTTP 메서드**: GET(조회), POST(생성), PUT(전체수정), PATCH(부분수정), DELETE(삭제)
- **응답 형식**: JSON, 성공(2xx), 실패(4xx/5xx) 상태코드

### 2. 데이터 변환 규칙 (MUST FOLLOW)
- **백엔드 내부**: snake_case 사용 (DB, 로그, 내부 변수)
- **API 요청**: camelCase → snake_case 변환 후 처리
- **API 응답**: snake_case → camelCase 변환 후 반환
- **URL**: kebab-case 사용 (`/user-preferences`)

```typescript
// 변환 함수 사용 예시
const queryParams = camelToSnakeCase(event.queryStringParameters);
const result = await processData(snakeCaseData);
return snakeToCamelCase(result);
```

### 3. 공통 서비스 사용
- **authService.js**: 인증 관련 로직
- **userService.js**: 사용자 관리 로직
- **matchingService.js**: 매칭 관련 로직

### 4. 로깅 규칙
- **파일**: `logs/YYYY-MM-DD.json`
- **형식**: JSON Lines (한 줄에 하나의 로그 객체)
- **필수 필드**: type, userId, email, ip, result, date

```typescript
// 로깅 예시
logger.info('User login', { 
  userId: user.id, 
  email: user.email, 
  result: 'success' 
});
```

### 5. 테스트 규칙
- **단위 테스트**: Jest 사용
- **API 테스트**: Postman/Insomnia 권장
- **로컬 개발**: `npm run dev`

### 6. 배포 규칙
- **개발**: Express 서버 (`npm run dev`)
- **프로덕션**: SAM + Lambda (`npm run deploy:prod`)

## 🔧 개발 체크리스트

- [ ] API 요청: camelCase → snake_case 변환
- [ ] API 응답: snake_case → camelCase 변환
- [ ] 공통 서비스 사용
- [ ] 로깅 추가
- [ ] 테스트 작성
- [ ] 에러 처리

## 🚀 개발 명령어

```bash
# 개발 서버 실행 (nodemon - 자동 재시작)
npm run dev

# 기본 서버 실행 (node)
npm start

# 프로덕션 환경 서버 실행
npm run prod

# 테스트 실행
npm test

# 배포
npm run deploy:prod
```

---

**마지막 업데이트**: 2024년 12월 