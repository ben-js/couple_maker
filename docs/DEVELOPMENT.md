# 🚀 Couple Maker 개발 가이드

## 📋 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조](#프로젝트-구조)
3. [프론트엔드 개발](#프론트엔드-개발)
4. [백엔드 개발](#백엔드-개발)
5. [데이터베이스 설계](#데이터베이스-설계)
6. [API 문서](#api-문서)
7. [배포 가이드](#배포-가이드)
8. [테스트 가이드](#테스트-가이드)
9. [컨트리뷰션 가이드](#컨트리뷰션-가이드)

---

## 🛠 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **Expo CLI**: 최신 버전
- **AWS CLI**: 최신 버전
- **Git**: 최신 버전

### 설치 가이드

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/couple-maker.git
cd couple-maker

# 2. 프론트엔드 의존성 설치
cd frontend
npm install

# 3. 백엔드 의존성 설치
cd ../backend
npm install

# 4. Expo CLI 설치 (전역)
npm install -g @expo/cli

# 5. AWS CLI 설정
aws configure
```

### 환경 변수 설정

#### 프론트엔드 (.env)
```env
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com
EXPO_PUBLIC_USER_POOL_ID=your-user-pool-id
EXPO_PUBLIC_USER_POOL_CLIENT_ID=your-user-pool-client-id
```

#### 백엔드 (.env)
```env
AWS_REGION=ap-northeast-2
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-user-pool-client-id
```

---

## 🏗 프로젝트 구조

```
date-sense/
├── frontend/                 # React Native + Expo 앱
│   ├── src/
│   │   ├── screens/         # 화면 컴포넌트
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── MainScreen.tsx
│   │   │   ├── ProfileSetupScreen.tsx
│   │   │   └── ...
│   │   ├── components/      # 재사용 컴포넌트
│   │   │   ├── UserCard.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   └── ...
│   │   ├── navigation/      # 네비게이션 설정
│   │   │   ├── RootNavigator.tsx
│   │   │   └── MainTabNavigator.tsx
│   │   ├── services/        # API 서비스
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── ...
│   │   ├── store/           # 상태 관리
│   │   │   ├── AuthContext.tsx
│   │   │   └── ...
│   │   ├── utils/           # 유틸리티 함수
│   │   │   ├── validation.ts
│   │   │   ├── helpers.ts
│   │   │   └── ...
│   │   ├── types/           # 타입 정의
│   │   │   └── index.ts
│   │   └── constants/       # 상수
│   │       └── index.ts
│   ├── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # AWS Lambda + API Gateway
│   ├── stacks/              # SST 스택 정의
│   │   ├── Database.ts
│   │   ├── Storage.ts
│   │   ├── Auth.ts
│   │   └── API.ts
│   ├── src/
│   │   ├── functions/       # Lambda 함수들
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── matches/
│   │   │   ├── chats/
│   │   │   └── ...
│   │   ├── models/          # 데이터 모델
│   │   │   ├── User.ts
│   │   │   ├── Match.ts
│   │   │   └── ...
│   │   ├── utils/           # 공통 유틸리티
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── ...
│   │   └── types/           # 타입 정의
│   │       └── index.ts
│   ├── sst.config.ts
│   └── package.json
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       └── deploy.yml
├── docs/                    # 문서
│   ├── DEVELOPMENT.md
│   ├── API.md
│   └── DEPLOYMENT.md
└── README.md
```

---

## 📱 프론트엔드 개발

### 실행 방법

```bash
cd frontend

# 개발 서버 시작
npm start

# iOS 시뮬레이터에서 실행
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# 웹에서 실행
npm run web
```

### 주요 기술 스택

- **React Native**: 0.72.6
- **Expo**: 49.0.0
- **TypeScript**: 5.1.3
- **React Navigation**: 6.x
- **React Native UI Lib**: 6.0.0
- **Zustand**: 4.4.1 (상태 관리)
- **React Hook Form**: 7.47.0 (폼 관리)

### 개발 가이드라인

#### 1. 컴포넌트 작성 규칙

```typescript
// ✅ 좋은 예시
interface UserCardProps {
  user: User;
  onLike: (userId: string) => void;
  onPass: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onLike, onPass }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
      {/* 컴포넌트 내용 */}
    </View>
  );
};

// ❌ 나쁜 예시
const UserCard = ({ user, onLike, onPass }: any) => {
  return (
    <View>
      <Text>{user.name}</Text>
    </View>
  );
};
```

#### 2. 스타일링 가이드

```typescript
// ✅ 좋은 예시 - StyleSheet 사용
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
});

// ❌ 나쁜 예시 - 인라인 스타일
<View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
```

#### 3. 상태 관리

```typescript
// Zustand 스토어 예시
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
```

### 테스트 작성

```typescript
// __tests__/UserCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UserCard from '../UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: '김민수',
    age: 28,
    // ... 기타 사용자 정보
  };

  it('사용자 정보를 올바르게 표시한다', () => {
    const { getByText } = render(<UserCard user={mockUser} />);
    expect(getByText('김민수')).toBeTruthy();
    expect(getByText('28')).toBeTruthy();
  });

  it('좋아요 버튼 클릭 시 콜백이 호출된다', () => {
    const onLike = jest.fn();
    const { getByTestId } = render(
      <UserCard user={mockUser} onLike={onLike} />
    );
    
    fireEvent.press(getByTestId('like-button'));
    expect(onLike).toHaveBeenCalledWith('1');
  });
});
```

---

## 🔧 백엔드 개발

### 실행 방법

```bash
cd backend

# 개발 모드 실행
npm run dev

# 배포
npm run deploy

# 스택 제거
npm run remove
```

### 주요 기술 스택

- **AWS Lambda**: 서버리스 함수
- **API Gateway**: REST API
- **DynamoDB**: NoSQL 데이터베이스
- **S3**: 파일 저장소
- **Cognito**: 사용자 인증
- **SST**: 인프라 코드
- **TypeScript**: 타입 안전성

### Lambda 함수 작성 가이드

```typescript
// src/functions/users/getProfile.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { verifyToken } from '../../utils/auth';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // 토큰 검증
    const userId = await verifyToken(event.headers.Authorization);
    
    // 사용자 정보 조회
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { id: userId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '사용자를 찾을 수 없습니다.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: result.Item }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '서버 오류가 발생했습니다.' }),
    };
  }
};
```

### 데이터베이스 모델

```typescript
// src/models/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string;
  age: number;
  location: {
    city: string;
    district: string;
  };
  height: number;
  bodyType: 'slim' | 'normal' | 'athletic' | 'chubby' | 'curvy';
  job: string;
  education: 'high_school' | 'college' | 'bachelor' | 'master' | 'phd';
  religion: 'none' | 'christian' | 'buddhist' | 'catholic' | 'other';
  smoking: 'yes' | 'no' | 'sometimes';
  drinking: 'yes' | 'no' | 'sometimes';
  mbti: string;
  bio: string;
  photos: string[];
  interests: string[];
  maritalStatus: 'single' | 'divorced' | 'widowed';
  hasChildren: boolean;
  createdAt: string;
  updatedAt: string;
  isProfileComplete: boolean;
  isVerified: boolean;
  lastActive: string;
}
```

---

## 🗄 데이터베이스 설계

### DynamoDB 테이블 구조

#### 1. Users 테이블
- **Primary Key**: id (string)
- **GSI**: email (string)
- **속성**: 사용자 프로필 정보

#### 2. Matches 테이블
- **Primary Key**: id (string)
- **GSI1**: userId + status (string)
- **GSI2**: matchedUserId + status (string)
- **속성**: 매칭 정보
- **상태**: waiting | propose | matched | confirmed | scheduled | completed | exchanged | finished

#### 3. Likes 테이블
- **Primary Key**: id (string)
- **GSI1**: fromUserId + toUserId (string)
- **GSI2**: toUserId + fromUserId (string)
- **속성**: 좋아요 정보

#### 4. Chats 테이블
- **Primary Key**: id (string)
- **GSI**: participants + lastMessageAt (string)
- **속성**: 채팅방 정보

#### 5. Messages 테이블
- **Primary Key**: id (string)
- **GSI**: chatId + timestamp (string)
- **속성**: 메시지 정보

### 쿼리 패턴

```typescript
// 사용자 추천 조회
const getRecommendations = async (userId: string, filters: FilterOptions) => {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: process.env.USERS_TABLE,
      IndexName: 'gender-age-index',
      KeyConditionExpression: 'gender = :gender AND age BETWEEN :minAge AND :maxAge',
      FilterExpression: 'id <> :userId AND isProfileComplete = :complete',
      ExpressionAttributeValues: {
        ':gender': filters.gender,
        ':minAge': filters.ageRange[0],
        ':maxAge': filters.ageRange[1],
        ':userId': userId,
        ':complete': true,
      },
      Limit: 20,
    })
  );
  return result.Items;
};
```

---

## 📚 API 문서

### 인증 API

#### POST /auth/register
사용자 회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "김민수"
}
```

**Response:**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
  "data": {
    "userId": "user-123"
  }
}
```

#### POST /auth/login
사용자 로그인

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "김민수"
    }
  }
}
```

### 사용자 API

#### GET /users/profile
내 프로필 조회

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "김민수",
      "age": 28,
      "location": {
        "city": "서울",
        "district": "강남구"
      },
      "bio": "안녕하세요!",
      "photos": ["https://..."],
      "interests": ["여행", "음악"]
    }
  }
}
```

#### PUT /users/profile
프로필 수정

**Request Body:**
```json
{
  "name": "김민수",
  "bio": "수정된 자기소개",
  "interests": ["여행", "음악", "영화"]
}
```

### 매칭 API

#### 매칭 진행 상황 (7단계)
1. **신청완료** (waiting): 소개팅 신청 완료
2. **매칭성공** (matched): 상대방과 매칭 성공
3. **일정 조율** (confirmed): 소개팅 일정 확정
4. **소개팅 예정** (scheduled): 소개팅 일정 확정
5. **소개팅 완료** (completed): 소개팅 완료, 후기 작성
6. **연락처 교환 완료** (exchanged): 연락처 교환 완료
7. **소개팅 종료** (finished): 소개팅 종료, 연락처 삭제

#### POST /likes
좋아요 보내기

**Request Body:**
```json
{
  "toUserId": "user-456",
  "type": "like"
}
```

#### GET /matches
매칭 목록 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match-123",
        "user": {
          "id": "user-456",
          "name": "이지영",
          "photos": ["https://..."]
        },
        "status": "completed",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /contact/exchange
연락처 교환

**Request Body:**
```json
{
  "matchId": "match-123",
  "contact": {
    "phone": "010-1234-5678",
    "kakaoId": "kakao123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "연락처 교환이 완료되었습니다.",
  "data": {
    "status": "exchanged",
    "contactExchangedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /contact/detail
연락처 상세 정보 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "phone": "010-1234-5678",
      "kakaoId": "kakao123"
    },
    "photos": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
      "https://example.com/photo3.jpg"
    ]
  }
}
```

#### POST /meeting/finish
소개팅 종료

**Request Body:**
```json
{
  "matchId": "match-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "소개팅이 종료되었습니다.",
  "data": {
    "status": "finished",
    "finishedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /cleanup-finished-requests
완료된 매칭 요청 정리 (자동 실행)

**설명:**
- finished 상태가 된 지 3일이 지난 매칭 요청을 자동으로 삭제
- 매일 자동 실행되며, 매칭 이력을 matching-history.json에 저장 후 삭제
- 개인정보 보호를 위한 자동 정리 시스템

**Response:**
```json
{
  "success": true,
  "message": "완료된 매칭 요청이 정리되었습니다.",
  "data": {
    "deletedCount": 5,
    "savedToHistoryCount": 5
  }
}
```

---

## 🚀 배포 가이드

### 개발 환경 배포

```bash
cd backend
npm run deploy -- --stage dev
```

### 프로덕션 환경 배포

```bash
cd backend
npm run deploy -- --stage prod
```

### 환경별 설정

#### 개발 환경 (dev)
- API Gateway: `https://dev-api.couple-maker.com`
- DynamoDB: `couple-maker-dev-users`
- S3: `couple-maker-dev-profile-images`

#### 프로덕션 환경 (prod)
- API Gateway: `https://api.couple-maker.com`
- DynamoDB: `couple-maker-prod-users`
- S3: `couple-maker-prod-profile-images`

### CI/CD 파이프라인

1. **코드 푸시** → GitHub Actions 트리거
2. **테스트 실행** → Lint, Type Check, Unit Test
3. **빌드** → 프론트엔드 빌드, 백엔드 패키징
4. **배포** → AWS에 자동 배포
5. **알림** → 배포 결과 알림

---

## 🧪 테스트 가이드

### 프론트엔드 테스트

```bash
cd frontend

# 단위 테스트 실행
npm test

# 커버리지 포함 테스트
npm test -- --coverage

# 특정 파일 테스트
npm test -- UserCard.test.tsx
```

### 백엔드 테스트

```bash
cd backend

# 단위 테스트 실행
npm test

# 통합 테스트 실행
npm run test:integration

# E2E 테스트 실행
npm run test:e2e
```

### 테스트 작성 예시

```typescript
// __tests__/auth.test.ts
import { handler } from '../src/functions/auth/login';

describe('Login Function', () => {
  it('올바른 이메일과 비밀번호로 로그인 성공', async () => {
    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
  });

  it('잘못된 비밀번호로 로그인 실패', async () => {
    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(401);
  });
});
```

---

## 🤝 컨트리뷰션 가이드

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 메시지 규칙

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 스타일 수정
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 수정

**예시:**
```
feat(auth): 소셜 로그인 기능 추가

- Google 로그인 구현
- Facebook 로그인 구현
- 로그인 상태 관리 개선

Closes #123
```

### PR 가이드라인

1. **제목**: 명확하고 간결하게
2. **설명**: 변경 사항 상세 설명
3. **체크리스트**: 완료된 작업 확인
4. **스크린샷**: UI 변경 시 첨부
5. **테스트**: 테스트 코드 포함

### 코드 리뷰 체크리스트

- [ ] 코드가 요구사항을 만족하는가?
- [ ] 테스트가 충분한가?
- [ ] 문서가 업데이트되었는가?
- [ ] 성능에 문제가 없는가?
- [ ] 보안 문제가 없는가?
- [ ] 접근성이 고려되었는가?

---

## 📞 지원 및 문의

- **이슈 리포트**: GitHub Issues
- **기술 문의**: GitHub Discussions
- **보안 취약점**: security@couple-maker.com
- **일반 문의**: support@couple-maker.com

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 

---

### 1. **진행 상황 요약**
- **데이터 저장 구조**: 파일 → MySQL(Sequelize ORM) → AWS DynamoDB로 발전.
- **핵심 테이블**: flow.md 기준 users, matching-requests 등 모든 테이블을 DynamoDB로 이전.
- **AWS 연동**: AWS CLI/콘솔로 테이블 생성, Node.js에서 DynamoDB 연동 및 CRUD 구현 단계.

---

### 2. **DynamoDB 테이블 생성 오류 안내**

#### **오류 메시지**
```
An error occurred (InvalidSignatureException) when calling the CreateTable operation: The request signature we calculated does not match the signature you provided. Check your AWS Secret Access Key and signing method. Consult the service documentation for details.
```

#### **원인 및 해결 방법**
이 오류는 AWS CLI가 요청에 서명할 때 사용하는 자격증명(Access Key/Secret Key) 또는 region, 시간 동기화 등에 문제가 있을 때 발생합니다.

**주요 원인 및 해결법:**

1. **AWS 자격증명(Access Key/Secret Key) 오타/만료**
   - `aws configure` 명령어로 Access Key, Secret Key, region, output을 다시 정확히 입력하세요.
   - 키가 만료되었거나 잘못 입력된 경우 새로 발급받아 입력해야 합니다.

2. **시스템 시간 불일치**
   - PC의 시스템 시간이 실제 시간과 다르면 서명 오류가 발생할 수 있습니다.
   - 윈도우에서 "날짜 및 시간"을 인터넷 시간과 동기화하세요.

3. **프로파일/환경변수 충돌**
   - 여러 AWS 계정/프로파일을 사용하는 경우, 원하는 프로파일이 맞는지 확인하세요.
   - 명령어에 `--profile` 옵션을 추가해 명시적으로 지정할 수 있습니다.
     ```
     aws dynamodb create-table ... --profile myprofile
     ```

4. **리전(region) 불일치**
   - CLI 명령어의 `--region` 값이 올바른지 확인하세요.
   - `aws configure`에서 설정한 region과 명령어의 region이 다르면 오류가 날 수 있습니다.

5. **CLI 버전 문제**
   - `aws --version`으로 CLI 버전을 확인하고, 너무 오래된 버전이면 최신으로 업데이트하세요.

---

### 3. **점검 체크리스트**

1. **자격증명 재설정**
   ```bash
   aws configure
   ```
   - Access Key ID:
   - Secret Access Key:
   - Default region name: ap-northeast-2
   - Default output format: json

2. **시스템 시간 동기화**
   - 윈도우 작업표시줄 → 날짜/시간 우클릭 → "날짜/시간 조정" → "지금 동기화" 클릭

3. **명령어 예시(정상 동작 시)**
   ```bash
   aws dynamodb create-table \
     --table-name users \
     --attribute-definitions AttributeName=user_id,AttributeType=S \
     --key-schema AttributeName=user_id,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region ap-northeast-2
   ```

4. **프로파일 명시(필요시)**
   ```bash
   aws dynamodb create-table ... --profile myprofile
   ```

---

### 4. **추가 안내**

- 위 방법으로도 해결이 안 되면, AWS IAM에서 Access Key를 새로 발급받아 다시 시도해보세요.
- CLI가 아닌 AWS 콘솔(웹)에서 테이블을 생성해도 무방합니다.
- 테이블 생성 후, Node.js에서 DynamoDB 연동 및 CRUD 구현을 이어가면 됩니다.

---

**질문/요청이 있으시면 언제든 말씀해 주세요!**  
(예: DynamoDB 연동 코드, CRUD 예시, 테이블 설계 등) 


✅ 0. 전체 목표 요약 (정리)
항목	내용
앱 목적	회사 이메일 기반 회원가입 → AI 매칭 + 인사이트 제공
사용 플랫폼	React Native 앱 + 관리자용 React 웹
주요 기능	회원가입/로그인, AI 매칭, 성향 인사이트 생성, 이미지 업로드, 푸시 알림, 관리자 페이지
사용자 수	적음 (초기엔 수십~수백명 수준)
우선순위	보안 강화, 서버리스, 비용 절감, AI 기능 포함

✅ 1. 전체 AWS 서비스 구성표
기능	AWS 서비스	설명
회원가입/로그인	Amazon Cognito User Pool	회사 이메일만 허용, 인증메일 발송
이메일 인증	Cognito 기본 or Amazon SES	커스텀 발신 주소 사용 가능
도메인 제한 (@samsung.com 등)	Cognito PreSignUp Lambda	허용 도메인 체크
사용자 정보 저장	DynamoDB	사용자 정보, 선호도, 매칭 기록 등
프로필 이미지 업로드	Amazon S3	Presigned URL 이용 업로드
이미지 제공	CloudFront + OAI	캐싱 + 보안강화 (S3 직접 접근 차단)
REST API 백엔드	API Gateway + Lambda	서버리스 컨트롤러 역할
AI 매칭	Amazon Personalize	추천 엔진 사용 (커스터마이징 가능)
AI 인사이트 생성	Amazon Bedrock (Claude)	자연어 기반 리포트 생성
푸시 알림	Amazon Pinpoint or SNS	알림 메시지 전송
관리자 웹 호스팅	S3 + CloudFront	정적 React 앱, 보안 필요시 WAF 적용
인증된 요청 제한	Cognito Authorizer (API Gateway)	JWT 토큰 검증 처리
자동화/워크플로우	Step Functions or EventBridge	배치성 재매칭/인사이트 생성 스케줄링

✅ 2. 전체 아키텍처 흐름도 (시각적)
less
복사
편집
[모바일 앱 (React Native)]
        ↓
 [회원가입: Cognito User Pool]
        ├─> PreSignUp Lambda → 이메일 도메인 체크
        └─> 인증 메일 발송 (기본 or SES)

[로그인 후 받은 JWT 토큰]
        ↓
[API Gateway] ─── (Cognito Authorizer)
        ↓
     [Lambda Functions]
        ├─ 사용자 데이터 CRUD (DynamoDB)
        ├─ 이미지 Presigned URL 발급 (S3)
        ├─ AI 매칭 요청 → Amazon Personalize
        └─ 인사이트 생성 요청 → Amazon Bedrock

[AI 결과 저장] → DynamoDB / S3

[이미지 파일] → 업로드: S3, 제공: CloudFront + OAI

[푸시 알림] → Pinpoint or SNS

[관리자 웹]
        └─ React 앱 → S3 + CloudFront (OAI + WAF)

[자동화]
        └─ Step Functions or EventBridge
            ├─ 하루 1회 자동 매칭
            └─ 주기적 인사이트 재생성
✅ 3. 사용자가 겪는 흐름 (실제 UX 기반)
💼 회원가입
이메일 입력: test@samsung.com

Cognito에서 PreSignUp Lambda 실행 → 도메인 확인

인증메일 전송

링크 클릭 → 회원가입 완료

JWT 토큰 발급 → 앱 사용 시작

❤️ 매칭 요청
유저가 "AI 매칭하기" 클릭

Lambda → Personalize에 사용자/아이템 데이터로 추천 요청

매칭 결과 저장 → 사용자에게 보여줌

📊 인사이트 보기
유저가 "내 성향 보기" 클릭

Lambda → Bedrock 호출 → 텍스트 생성

결과 저장 & 앱에 표시

🖼️ 프로필 사진 업로드
앱에서 사진 선택

Lambda에서 S3 Presigned URL 발급

앱에서 직접 S3에 업로드

CloudFront 통해 제공 (보안 적용)

✅ 4. 각 서비스 장점 요약
서비스	장점
Cognito	보안 인증, 이메일 인증, JWT, 도메인 제한 가능
Lambda	비용 효율 + 확장성, 코드로 모든 로직 제어
API Gateway	RESTful 구조, 인증 연동 쉬움
DynamoDB	빠르고 유연한 NoSQL 구조 (비용 효율적)
S3 + CloudFront	이미지 보안 + 빠른 제공
Bedrock	자연어 생성 (GPT처럼), 서버 없이 사용 가능
Personalize	직접 모델 만들 필요 없이 AI 추천 기능
Pinpoint	사용자 맞춤 푸시 / 알림 가능 (마케팅 메시지도 가능)

✅ 5. 비용 요약 (초기 기준)
항목	예시 수치	비용 (월간 예상)
Cognito	사용자 < 50,000명	무료
Lambda	수천 건 수준	무료 티어 포함
API Gateway	수천 건 호출	약 $1~3
DynamoDB	적은 용량	약 $1 이하
S3 + CloudFront	수백 MB + 적은 트래픽	$0~$2
Personalize	하루 몇 백 건 수준	$10~30
Bedrock (Claude)	짧은 텍스트 몇천 건	$5~10
Pinpoint (푸시)	월 5천건 이하	무료 티어
총합	대부분 무료 + 일부 AI 기능 포함	$20~50 정도

✅ 다음 단계 제안
원하는 속도/목표에 따라 다음 단계부터 순차적으로 구축하면 돼:

🔹 1단계: 사용자 인증 + 회원가입 제한
Cognito User Pool + PreSignUp Lambda + 이메일 인증

🔹 2단계: 이미지 업로드 + 기본 사용자 정보 저장
S3 Presigned URL, DynamoDB 연동

🔹 3단계: AI 매칭, 인사이트 생성 기능 구현
Personalize 학습 → Lambda 호출

Bedrock 텍스트 생성 → 앱에 표시

🔹 4단계: 관리자 페이지 배포 (보안 설정 포함)
S3 + CloudFront + OAI + WAF 설정