# Date Sense - 전체 개발 가이드

## 📋 목차
- [프로젝트 개요](#프로젝트-개요)
- [전체 아키텍처](#전체-아키텍처)
- [개발 환경 설정](#개발-환경-설정)
- [백엔드 개발](#백엔드-개발)
- [프론트엔드 개발](#프론트엔드-개발)
- [Admin 대시보드 개발](#admin-대시보드-개발)
- [AWS Amplify 배포 가이드](#aws-amplify-배포-가이드)
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
📱 사용자 앱 (React Native + Expo, iOS/Android)
   ↓
🚀 API 서버 (AWS Lambda + API Gateway, 배포: SAM)
   ↓
🏗️ 데이터 저장소 (DynamoDB, S3)

🛠️ 관리자 대시보드 (Next.js, AWS Amplify)
   ↓
🏗️ 데이터 저장소 (DynamoDB, S3)

- 사용자 앱: 로그인/회원가입, 프로필 관리, 매칭, 채팅
- API 서버: 인증, 프로필, 매칭, 포인트
  - API 서버는 SAM으로 배포/로컬 개발
- 관리자 대시보드: 사용자/매칭/통계/포인트 관리
  - Backend와 독립적으로 DynamoDB에 직접 연결
- 데이터 저장소: 사용자 정보, 프로필, 매칭 이력, 포인트, 리뷰, 파일
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

## 🖥️ Admin 대시보드 개발

### 프로젝트 구조
```
admin/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── common/     # 공통 컴포넌트 (Button, Input, Modal 등)
│   │   └── Layout.tsx  # 레이아웃 컴포넌트
│   ├── contexts/       # React Context (AuthContext)
│   ├── lib/            # 유틸리티 라이브러리
│   │   ├── api.ts      # API 클라이언트
│   │   ├── auth.ts     # 인증 관련
│   │   └── dynamodb.js # AWS DynamoDB 연결
│   ├── pages/          # Next.js 페이지 및 API Routes
│   │   ├── api/        # API 엔드포인트
│   │   │   ├── admin/  # 관리자 API
│   │   │   ├── auth/   # 인증 API
│   │   │   └── dashboard/ # 대시보드 API
│   │   ├── dashboard.tsx    # 대시보드 페이지
│   │   ├── login.tsx        # 로그인 페이지
│   │   └── user-management.tsx # 사용자 관리
│   ├── styles/         # CSS 스타일
│   └── types/          # TypeScript 타입 정의
├── .env.local          # 환경 변수
└── package.json
```

### 기술 스택
- **Next.js 13.5.11**: React 기반 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **AWS SDK v3**: DynamoDB 연결
- **React Context**: 상태 관리

### 개발 서버 실행
```bash
# Admin 개발 서버 (포트 3001)
cd admin
npm install
npm run dev
```

### 환경 변수 설정
```bash
# admin/.env.local
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-2
NEXT_PUBLIC_API_BASE_URL=http://192.168.219.100:3000
```

### 주요 API 엔드포인트
```typescript
// 대시보드 API
GET /api/dashboard/stats      # 통계 데이터
GET /api/dashboard/activities # 최근 활동
GET /api/dashboard/chart-data # 차트 데이터

// 관리자 API
GET /api/admin/users          # 사용자 목록
GET /api/admin/users/[id]     # 사용자 상세
PUT /api/admin/users/[id]     # 사용자 정보 수정

// 인증 API
POST /api/admin/auth/login    # 관리자 로그인
GET /api/admin/auth/verify    # 인증 확인
```

### 데이터 흐름
```
브라우저 → Next.js API Routes → AWS DynamoDB
```

### Backend와의 관계
- ✅ **독립적 운영**: Backend API와 완전히 분리
- ✅ **데이터 공유**: 동일한 DynamoDB 테이블 사용
- ✅ **별도 배포**: AWS Amplify vs AWS SAM
- ✅ **독립적 보안**: 각각 별도의 인증 시스템

### 주요 개발 가이드
- **[Admin README](../admin/README.md)** - Admin 시스템 개요
- **[AuthContext](../admin/src/contexts/AuthContext.tsx)** - 인증 상태 관리
- **[API Routes](../admin/src/pages/api/)** - 백엔드 API 구현

## 🚀 AWS Amplify 배포 가이드

### 1. AWS Amplify 콘솔 접속
1. AWS 콘솔에서 Amplify 서비스로 이동
2. "새 앱 호스팅" 클릭
3. "GitHub에서 시작" 선택

### 2. GitHub 저장소 연결
1. GitHub 계정 인증
2. `date-sense` 저장소 선택
3. `admin` 브랜치 선택

### 3. 빌드 설정
```yaml
# amplify.yml (이미 생성됨)
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Installing dependencies..."
        - npm ci
    build:
      commands:
        - echo "Building the application..."
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 4. 환경 변수 설정
AWS Amplify 콘솔에서 다음 환경 변수를 설정:

#### 필수 환경 변수
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-northeast-2
JWT_SECRET=your_jwt_secret_key_here
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
```

#### 데이터베이스 테이블
```bash
DYNAMODB_TABLE_USERS=date-sense-users
DYNAMODB_TABLE_PROFILES=date-sense-profiles
DYNAMODB_TABLE_MATCHING_REQUESTS=date-sense-matching-requests
DYNAMODB_TABLE_POINT_HISTORY=date-sense-point-history
DYNAMODB_TABLE_REVIEWS=date-sense-reviews
```

#### 관리자 설정
```bash
ADMIN_EMAIL=admin@datesense.com
ADMIN_PASSWORD=your_admin_password
```

### 5. 도메인 설정
1. AWS Amplify 콘솔에서 "도메인 관리" 클릭
2. "도메인 추가" 클릭
3. 커스텀 도메인 입력 (예: admin.datesense.com)
4. SSL 인증서 자동 발급 확인

### 6. 보안 설정

#### IAM 권한 설정
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-2:*:table/date-sense-*"
      ]
    }
  ]
}
```

#### WAF 설정 (선택사항)
1. AWS WAF 콘솔에서 웹 ACL 생성
2. Amplify 앱에 연결
3. 보안 규칙 설정

### 7. 모니터링 설정

#### CloudWatch 로그
- AWS Amplify에서 자동으로 CloudWatch 로그 생성
- 로그 그룹: `/aws/amplify/{app-id}/{branch-name}`

#### 알림 설정
1. CloudWatch 알림 생성
2. 빌드 실패 시 SNS 알림
3. 에러 발생 시 Slack 연동

### 8. CI/CD 자동화

#### GitHub Actions 워크플로우
```yaml
name: Deploy to Amplify

on:
  push:
    branches: [main]
    paths: ['admin/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Amplify
        uses: aws-actions/amplify-deploy@v1
        with:
          app-id: ${{ secrets.AMPLIFY_APP_ID }}
          branch-name: main
```

### 9. 문제 해결

#### 빌드 실패 시
1. CloudWatch 로그 확인
2. 환경 변수 설정 확인
3. Node.js 버전 확인 (18.x 이상)

#### 런타임 에러 시
1. 브라우저 개발자 도구 확인
2. CloudWatch 로그 확인
3. DynamoDB 연결 확인

### 10. 성능 최적화

#### 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 포맷 사용
- CDN 캐싱 활용

#### 번들 크기 최적화
- 동적 import 사용
- 불필요한 의존성 제거
- Tree shaking 활용

### 11. 비용 관리

#### 예상 월 비용
- **소규모 (100명 관리자)**: $11-22/월
- **중규모 (1,000명 관리자)**: $45-90/월
- **대규모 (10,000명 관리자)**: $200-400/월

#### 비용 절약 팁
1. 불필요한 빌드 최소화
2. 캐시 활용
3. 이미지 최적화
4. CDN 활용

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
- **[프론트엔드 README](../frontend/README.md)** - 프론트엔드 개요
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
cd backend
npm run dev:win

# Admin 대시보드 (Next.js)
cd admin
npm run dev
```

### 스테이징 환경
```bash
# 프론트엔드 배포
npx expo build:ios --release-channel staging
npx expo build:android --release-channel staging

# 백엔드 배포
cd backend
npm run deploy:staging

# Admin 대시보드 배포
cd admin
npm run build
npm run start
```

### 프로덕션 환경
```bash
# 프론트엔드 배포
npx expo build:ios --release-channel production
npx expo build:android --release-channel production

# 백엔드 배포
cd backend
npm run deploy:prod

# Admin 대시보드 배포
cd admin
npm run build
npm run start
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