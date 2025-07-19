# Date Sense Admin - 개발 규칙

## 🎯 개발 규칙

### 1. Next.js 규칙
- **App Router 사용**: `/app` 디렉토리 구조 사용
- **API Routes**: `/pages/api/` 디렉토리에 API 엔드포인트 작성
- **SSR/SSG 활용**: 적절한 렌더링 방식 선택
- **Image 최적화**: Next.js Image 컴포넌트 사용

### 2. TypeScript 규칙
- **엄격한 타입 체크**: `strict: true` 설정 유지
- **인터페이스 우선**: `interface` 사용 권장
- **타입 가드**: 런타임 타입 검증 구현
- **제네릭 활용**: 재사용 가능한 타입 정의

### 3. React 컴포넌트 규칙
- **함수형 컴포넌트**: Hooks 기반 컴포넌트 작성
- **Props 인터페이스**: 명확한 Props 타입 정의
- **컴포넌트 분리**: 단일 책임 원칙 적용
- **메모이제이션**: React.memo, useMemo, useCallback 적절히 사용

### 4. API Routes 규칙
- **HTTP 메서드**: GET, POST, PUT, DELETE 적절히 사용
- **에러 처리**: try-catch로 에러 핸들링
- **응답 형식**: 일관된 JSON 응답 구조
- **인증 검증**: JWT 토큰 검증 필수

### 5. DynamoDB 직접 연결 규칙
- **AWS SDK 사용**: `@aws-sdk/client-dynamodb` 사용
- **환경 변수**: AWS 인증 정보 환경 변수로 관리
- **쿼리 최적화**: GSI 활용하여 성능 최적화
- **에러 처리**: DynamoDB 에러 상황 대응

### 6. Tailwind CSS 규칙
- **커스텀 클래스**: 공통 스타일은 커스텀 클래스로 정의
- **반응형 디자인**: 모바일 퍼스트 접근법
- **일관된 색상**: 프로젝트 색상 팔레트 사용
- **접근성**: 적절한 색상 대비와 포커스 상태

### 7. Admin 인증 규칙
- **JWT 토큰**: Admin 전용 JWT 토큰 사용
- **세션 관리**: 브라우저 세션과 토큰 동기화
- **권한 검증**: API 호출 시 권한 확인
- **로그아웃**: 토큰 무효화 및 세션 정리

## 🚀 개발 워크플로우

### 1. 컴포넌트 개발
```typescript
// 1. Props 인터페이스 정의
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}

// 2. 컴포넌트 작성
const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 컴포넌트 내용 */}
    </div>
  );
};
```

### 2. API Route 작성
```typescript
// pages/api/admin/users/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminToken } from '../../../lib/auth';
import { getUserById, updateUser } from '../../../lib/dynamodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 1. 인증 검증
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. HTTP 메서드별 처리
    switch (req.method) {
      case 'GET':
        const user = await getUserById(req.query.id as string);
        return res.status(200).json(user);
      
      case 'PUT':
        const updatedUser = await updateUser(req.query.id as string, req.body);
        return res.status(200).json(updatedUser);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 3. DynamoDB 연결
```typescript
// lib/dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function getUserById(userId: string) {
  const command = new GetCommand({
    TableName: process.env.DYNAMODB_TABLE_USERS,
    Key: { id: userId },
  });
  
  const response = await docClient.send(command);
  return response.Item;
}
```

## 🧪 테스트 규칙
- **단위 테스트**: Jest + React Testing Library 사용
- **API 테스트**: API Routes 단위 테스트 작성
- **컴포넌트 테스트**: 사용자 인터랙션 테스트
- **통합 테스트**: 전체 플로우 테스트

## 📦 배포 규칙
- **AWS Amplify**: 자동 배포 설정
- **환경 변수**: Amplify 콘솔에서 환경 변수 설정
- **빌드 최적화**: Next.js 빌드 최적화 적용
- **성능 모니터링**: CloudWatch 로그 확인

## 🔒 보안 규칙
- **환경 변수**: 민감한 정보는 환경 변수로 관리
- **CORS 설정**: 적절한 CORS 정책 적용
- **입력 검증**: 사용자 입력 데이터 검증
- **SQL 인젝션 방지**: 파라미터화된 쿼리 사용

## 📝 코딩 컨벤션
- **네이밍**: camelCase (변수, 함수), PascalCase (컴포넌트)
- **주석**: 복잡한 로직에 한글 주석 작성
- **에러 메시지**: 사용자 친화적인 에러 메시지
- **로깅**: 적절한 로그 레벨 사용

## 🚨 주의사항
- **Backend 독립성**: Backend API에 의존하지 않음
- **직접 연결**: DynamoDB에 직접 연결하여 성능 최적화
- **Admin 전용**: 일반 사용자와 분리된 인증 시스템
- **데이터 동기화**: Backend와 데이터 일관성 유지

## 📚 참고 자료
- [Next.js 공식 문서](https://nextjs.org/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [AWS DynamoDB 문서](https://docs.aws.amazon.com/dynamodb/)
- [AWS Amplify 문서](https://docs.amplify.aws/)

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0 