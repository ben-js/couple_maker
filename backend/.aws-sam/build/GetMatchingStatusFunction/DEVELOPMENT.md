# Date Sense Backend - 개발 가이드

## 📋 목차
- [개요](#개요)
- [아키텍처](#아키텍처)
- [환경 설정](#환경-설정)
- [개발 환경](#개발-환경)
- [프로덕션 배포](#프로덕션-배포)
- [API 문서](#api-문서)
- [테스트](#테스트)
- [공통 서비스](#공통-서비스)
- [트러블슈팅](#트러블슈팅)

## 🎯 개요

Date Sense Backend는 **하이브리드 아키텍처**를 사용합니다:
- **개발 환경**: Express 서버 (빠른 개발)
- **프로덕션 환경**: SAM + Lambda (서버리스)

### 주요 특징
- ✅ 공통 서비스 분리로 코드 중복 제거
- ✅ 환경별 설정 관리
- ✅ Docker 지원
- ✅ 자동화된 테스트
- ✅ 프로덕션급 로깅

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    개발 환경                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  Express Server │    │      공통 서비스            │ │
│  │  (local-server) │◄──►│   (authService.js)         │ │
│  │                 │    │   (userService.js)         │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   프로덕션 환경                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  SAM Template   │    │      공통 서비스            │ │
│  │  (template.yaml)│◄──►│   (authService.js)         │ │
│  │                 │    │   (userService.js)         │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐                                     │
│  │ Lambda Functions│                                     │
│  │ (login.ts)      │                                     │
│  │ (signup.ts)     │                                     │
│  │ (getUser.ts)    │                                     │
│  └─────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ 환경 설정

### 필수 요구사항
- Node.js 18.x 이상
- AWS CLI
- AWS SAM CLI
- Docker (선택사항)

### AWS 설정
```bash
# AWS CLI 설정
aws configure

# SAM CLI 설치 확인
sam --version
```

### 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 환경 변수 설정
NODE_ENV=development
AWS_REGION=ap-northeast-2
USERS_TABLE=date-sense-users
PROFILES_TABLE=date-sense-profiles
```

## 🚀 개발 환경

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
# Windows
npm run dev:win

# macOS/Linux
npm run dev
```

### 3. API 테스트
```bash
# 로그인 테스트
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 헬스체크
curl http://localhost:3001/
```

### 4. Docker 사용 (선택사항)
```bash
# Docker Compose로 전체 환경 실행
docker-compose up

# 백그라운드 실행
docker-compose up -d
```

## 🚀 프로덕션 배포

### 1. SAM 빌드
```bash
npm run build
```

### 2. 환경별 배포
```bash
# 개발 환경
npm run deploy:dev

# 스테이징 환경
npm run deploy:staging

# 프로덕션 환경
npm run deploy:prod

# 초기 설정 (첫 배포)
npm run deploy:guided
```

### 3. 로컬 SAM 테스트
```bash
# SAM 로컬 API 실행
npm run local
```

## 📚 API 문서

### Swagger UI
- **개발 환경**: http://localhost:3001/docs
- **프로덕션**: https://api.datesense.com/docs

### 주요 API 엔드포인트

#### 인증 API
```
POST /auth/login     - 사용자 로그인
POST /auth/signup    - 사용자 회원가입
```

#### 사용자 API
```
GET  /user/{userId}  - 사용자 정보 조회
PUT  /user/{userId}  - 사용자 정보 수정
```

#### 프로필 API
```
GET  /profile/{userId} - 프로필 조회
POST /profile         - 프로필 저장
```

#### 매칭 API
```
GET  /matching-status      - 매칭 상태 조회
POST /matching-requests    - 매칭 요청
GET  /matching-requests    - 매칭 요청 목록
```

## 🧪 테스트

### 1. 테스트 실행
```bash
# 전체 테스트
npm test

# 테스트 감시 모드
npm run test:watch

# 특정 테스트 파일
npm test -- userService.test.js
```

### 2. 테스트 커버리지
```bash
# 커버리지 리포트 생성
npm test -- --coverage
```

### 3. 테스트 작성 가이드
```javascript
// Given-When-Then 패턴 사용
describe('UserService', () => {
  it('should find user by email successfully', async () => {
    // Given - 테스트 데이터 준비
    const mockUser = { id: 'user_123', email: 'test@example.com' };
    
    // When - 테스트 실행
    const result = await userService.findByEmail('test@example.com');
    
    // Then - 결과 검증
    expect(result).toEqual(mockUser);
  });
});
```

## 🔧 공통 서비스

### 서비스 구조
```
services/
├── authService.js      # 인증 관련 로직
├── userService.js      # 사용자 관리 로직
├── matchingService.js  # 매칭 관련 로직
└── notificationService.js # 알림 관련 로직
```

### 서비스 사용법
```javascript
// Lambda 함수에서 사용
const authService = require('../services/authService');

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body);
  const result = await authService.login(email, password);
  return result;
};

// Express 서버에서 사용
const userService = require('./services/userService');

app.get('/user/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json(user);
});
```

### 새로운 서비스 추가
```javascript
// services/newService.js
const logger = require('../utils/logger');

class NewService {
  async doSomething(data) {
    try {
      logger.info('Doing something', { data });
      // 비즈니스 로직
      return result;
    } catch (error) {
      logger.error('Error in doSomething', { error, data });
      throw error;
    }
  }
}

module.exports = new NewService();
```

## 🐛 트러블슈팅

### 일반적인 문제들

#### 1. 로그인 속도가 느림
```bash
# Lambda cold start 문제 확인
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/date-sense"

# Express 서버 사용 권장 (개발 환경)
npm run dev:win
```

#### 2. DynamoDB 연결 오류
```bash
# AWS 자격 증명 확인
aws sts get-caller-identity

# 테이블 존재 확인
aws dynamodb list-tables
```

#### 3. SAM 배포 실패
```bash
# SAM CLI 버전 확인
sam --version

# 빌드 캐시 정리
sam build --use-container --cached

# 상세 로그 확인
sam deploy --debug
```

#### 4. CORS 오류
```javascript
// local-server.js에서 CORS 설정 확인
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}));
```

### 로그 확인
```bash
# Express 서버 로그
tail -f logs/combined.log

# Lambda 로그
aws logs tail /aws/lambda/date-sense-login --follow

# Docker 로그
docker-compose logs -f backend
```

### 디버깅 팁
1. **환경 변수 확인**: `console.log(process.env)`
2. **요청/응답 로깅**: `logger.info('Request', { body: event.body })`
3. **에러 스택 추적**: `logger.error('Error', { stack: error.stack })`
4. **성능 측정**: `console.time('operation')` / `console.timeEnd('operation')`

## 📝 코딩 컨벤션

### 파일 명명 규칙
- **서비스**: `camelCase.js` (예: `userService.js`)
- **Lambda 함수**: `camelCase.ts` (예: `login.ts`)
- **테스트**: `camelCase.test.js` (예: `userService.test.js`)

### 코드 스타일
```javascript
// ES6+ 사용
const { DynamoDB } = require('aws-sdk');

// async/await 사용
async function getUser(userId) {
  try {
    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    logger.error('Error getting user', { error, userId });
    throw error;
  }
}

// 구조분해할당 사용
const { email, password } = JSON.parse(event.body);
```

### 주석 작성
```javascript
/**
 * 사용자 이메일로 조회
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object|null>} 사용자 정보 또는 null
 */
async function findByEmail(email) {
  // 구현...
}
```

## 🔄 CI/CD 파이프라인

### GitHub Actions 예시
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: npm run deploy:prod
```

## 📞 지원

### 개발팀 연락처
- **백엔드 리드**: backend@datesense.com
- **DevOps**: devops@datesense.com
- **QA**: qa@datesense.com

### 유용한 링크
- [AWS SAM 문서](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB 가이드](https://docs.aws.amazon.com/dynamodb/)
- [Express.js 문서](https://expressjs.com/)
- [Jest 테스트 프레임워크](https://jestjs.io/)

---

**마지막 업데이트**: 2024년 12월
**버전**: 1.0.0 