# Date Sense - 전체 개발 가이드

## 📋 목차
- [프로젝트 개요](#프로젝트-개요)
- [전체 아키텍처](#전체-아키텍처)
- [개발 환경 설정](#개발-환경-설정)
- [프론트엔드 개발](#프론트엔드-개발)
- [백엔드 개발](#백엔드-개발)
- [데이터베이스 설계](#데이터베이스-설계)
- [배포 가이드](#배포-가이드)
- [테스트 전략](#테스트-전략)
- [모니터링](#모니터링)

## 🎯 프로젝트 개요

**Date Sense**는 AI 기반 데이팅 매칭 앱입니다.

### 주요 기능
- 🤖 AI 기반 매칭 알고리즘
- 📱 React Native 크로스 플랫폼 앱
- ☁️ AWS 서버리스 백엔드
- 🔐 안전한 사용자 인증
- 📊 실시간 매칭 통계

## 🏗️ 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    프론트엔드                           │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ React Native    │    │      상태 관리              │ │
│  │   (iOS/Android) │◄──►│   (AuthContext)            │ │
│  │                 │    │   (UserProfileContext)     │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    백엔드                                │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  Express Server │    │      공통 서비스            │ │
│  │  (Development)  │◄──►│   (authService.js)         │ │
│  │                 │    │   (userService.js)         │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐                                     │
│  │  SAM + Lambda   │                                     │
│  │  (Production)   │                                     │
│  └─────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    인프라                                │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   DynamoDB      │    │      S3 Bucket             │ │
│  │   (데이터)      │    │   (이미지/파일)             │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ 개발 환경 설정

### 필수 요구사항
- **Node.js**: 18.x 이상
- **React Native**: 0.72 이상
- **AWS CLI**: 최신 버전
- **Docker**: 선택사항
- **Xcode**: iOS 개발용 (macOS)
- **Android Studio**: Android 개발용

### 전체 프로젝트 설정
```bash
# 1. 프로젝트 클론
git clone https://github.com/your-org/date-sense.git
cd date-sense

# 2. 프론트엔드 설정
cd frontend
npm install
npx expo install

# 3. 백엔드 설정
cd ../backend
npm install

# 4. 환경 변수 설정
cp .env.example .env
```

## 📱 프론트엔드 개발

### 프로젝트 구조
```
frontend/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── screens/        # 화면 컴포넌트
│   ├── navigation/     # 네비게이션 설정
│   ├── services/       # API 서비스
│   ├── store/          # 상태 관리
│   ├── types/          # TypeScript 타입 정의
│   └── utils/          # 유틸리티 함수
├── assets/             # 이미지, 폰트 등
└── App.tsx            # 앱 진입점
```

### 개발 서버 실행
```bash
# Expo 개발 서버
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android
```

### 주요 개발 가이드
- **[프론트엔드 README](../frontend/README.md)** - 상세한 프론트엔드 가이드
- **[UX 가이드](../frontend/ux.md)** - UI/UX 디자인 가이드
- **[컴포넌트 가이드](../frontend/components/)** - 컴포넌트 사용법

## 🔧 백엔드 개발

### 프로젝트 구조
```
backend/
├── lambda/             # Lambda 함수들
├── services/           # 공통 서비스
├── config/             # 환경별 설정
├── utils/              # 유틸리티
├── test/               # 테스트 파일들
├── local-server.js     # Express 개발 서버
└── template.yaml       # SAM 템플릿
```

### 개발 서버 실행
```bash
# Express 개발 서버
npm run dev:win

# SAM 로컬 테스트
npm run local
```

### 주요 개발 가이드
- **[백엔드 README](../backend/README.md)** - 백엔드 개요
- **[백엔드 개발 가이드](../backend/DEVELOPMENT.md)** - 상세한 백엔드 가이드
- **[API 문서](../backend/swagger.json)** - Swagger API 스펙

## 🗄️ 데이터베이스 설계

### DynamoDB 테이블 구조

#### Users 테이블
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "홍길동",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Profiles 테이블
```json
{
  "userId": "user_123",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "bio": "안녕하세요!",
  "age": 25,
  "location": "서울",
  "interests": ["영화", "음악", "여행"]
}
```

#### MatchingRequests 테이블
```json
{
  "userId": "user_123",
  "targetUserId": "user_456",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### GSI (Global Secondary Index) 설계
- **email-index**: 이메일로 사용자 조회
- **status-index**: 매칭 상태별 조회
- **user-index**: 사용자별 매칭 이력 조회

## 🚀 배포 가이드

### 개발 환경
```bash
# 프론트엔드 (Expo)
npx expo start

# 백엔드 (Express)
npm run dev:win
```

### 스테이징 환경
```bash
# 프론트엔드 배포
npx expo build:ios --release-channel staging
npx expo build:android --release-channel staging

# 백엔드 배포
npm run deploy:staging
```

### 프로덕션 환경
```bash
# 프론트엔드 배포
npx expo build:ios --release-channel production
npx expo build:android --release-channel production

# 백엔드 배포
npm run deploy:prod
```

## 🧪 테스트 전략

### 프론트엔드 테스트
```bash
# Jest 테스트
npm test

# E2E 테스트 (Detox)
npm run e2e:ios
npm run e2e:android
```

### 백엔드 테스트
```bash
# 단위 테스트
npm test

# 통합 테스트
npm run test:integration

# API 테스트
npm run test:api
```

### 테스트 커버리지 목표
- **단위 테스트**: 80% 이상
- **통합 테스트**: 70% 이상
- **E2E 테스트**: 주요 플로우 100%

## 📊 모니터링

### 로깅 시스템
- **프론트엔드**: React Native Debugger + Sentry
- **백엔드**: Winston + CloudWatch
- **API**: API Gateway 로그 + X-Ray

### 성능 모니터링
- **앱 성능**: React Native Performance Monitor
- **API 성능**: CloudWatch Metrics
- **사용자 행동**: Analytics (Firebase/Amplitude)

### 알림 설정
- **에러 알림**: Slack + Email
- **성능 알림**: CloudWatch Alarms
- **사용자 피드백**: Zendesk 연동

## 🔄 CI/CD 파이프라인

### GitHub Actions 워크플로우

#### 프론트엔드 배포
```yaml
name: Frontend Deploy

on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install
      - run: cd frontend && npm test
      - run: cd frontend && npx expo build:ios
      - run: cd frontend && npx expo build:android
```

#### 백엔드 배포
```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd backend && npm run deploy:prod
```

## 🛠️ 개발 도구

### 필수 도구
- **VS Code**: 메인 IDE
- **Postman**: API 테스트
- **DynamoDB Workbench**: 데이터베이스 관리
- **AWS Console**: 클라우드 리소스 관리

### 추천 확장 프로그램
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안전성
- **React Native Tools**: React Native 개발 지원

## 📞 지원 및 커뮤니케이션

### 개발팀 연락처
- **프론트엔드 리드**: frontend@datesense.com
- **백엔드 리드**: backend@datesense.com
- **DevOps**: devops@datesense.com
- **QA**: qa@datesense.com

### 커뮤니케이션 채널
- **Slack**: #dev-team, #frontend, #backend
- **Jira**: 이슈 및 태스크 관리
- **Confluence**: 문서 공유
- **GitHub**: 코드 리뷰 및 협업

### 유용한 링크
- [React Native 문서](https://reactnative.dev/)
- [Expo 문서](https://docs.expo.dev/)
- [AWS SAM 문서](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB 가이드](https://docs.aws.amazon.com/dynamodb/)

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0