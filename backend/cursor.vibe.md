# Backend Cursor Rule (커서룰)

## 1. API 설계 원칙
- RESTful 엔드포인트 사용 (ex: /signup, /login, /user/{id}, /user-preferences)
- 모든 응답은 JSON 형식
- 성공 시 2xx, 실패 시 4xx/5xx 상태코드와 에러 메시지 반환

## 2. 데이터/스키마 규칙
- Users: { id, username, password, name }
- UserStatusHistory: { userId, status, date }
- UserPreferences: { userId, ... }

## 3. 목업/더미 데이터
- handler.ts 상단에 메모리 배열로 관리
- 실제 DB 연동 전까지 모든 데이터는 서버 재시작 시 초기화됨

## 4. 인증/세션
- 로그인 성공 시 userId 반환 (JWT 등은 추후 적용)
- 인증이 필요한 API는 추후 미들웨어로 분리

## 5. 프론트엔드 연동 규칙
- CORS 허용 (serverless.yml provider.httpApi.cors: true)
- 프론트엔드에서 필요한 API/데이터 구조는 이 문서에 추가

## 6. 테스트/개발 정책
- serverless offline으로 로컬 개발
- Postman/Insomnia 등으로 API 테스트 권장

---

## 7. 전체 플로우 및 화면 분기 정책

### 1단계: 회원가입/로그인
- POST /signup: Users, UserStatusHistory 더미데이터에 신규 유저 정보 저장
- POST /login: Users에서 유저 정보 조회, 성공 시 유저 정보 반환

### 2단계: 이상형 프로필 체크 및 분기
- 로그인 성공 후 GET /user-preferences/{userId} 호출
  - 값이 없으면: 이상형 프로필 작성 페이지로 이동
  - 값이 있으면: 홈으로 이동

### 3단계: 이상형 프로필 작성/수정
- POST /user-preferences: userPreferences 더미 데이터에 저장/수정
- 마이페이지에서 "이상형 프로필 수정" 버튼 → 수정화면 진입
- 뒤로가기: 최초 로그인 시엔 로그인화면, 그 외엔 마이페이지로

### 4단계: 프론트엔드 연동 예시
- 회원가입: POST /signup (username, password, name)
- 로그인: POST /login (username, password)
- 이상형 프로필 조회: GET /user-preferences/{userId}
- 이상형 프로필 저장/수정: POST /user-preferences (userId, ...)

---

## [추가/변경 내역]
- 2024-07-03: 전체 플로우 및 화면 분기 정책 추가 