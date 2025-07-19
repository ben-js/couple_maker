# Backend - 개발 규칙

## 🎯 개발 규칙

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
- **preferenceService.js**: 선호도 관리 로직

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

### 5. 에러 처리 규칙
- **try-catch**: 모든 비동기 작업에 에러 처리
- **에러 응답**: 일관된 에러 응답 형식
- **로깅**: 에러 상황 로깅 필수

```typescript
try {
  const result = await someAsyncOperation();
  return {
    statusCode: 200,
    body: JSON.stringify(snakeToCamelCase(result))
  };
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Internal server error' })
  };
}
```

### 6. DynamoDB 규칙
- **쿼리 최적화**: GSI 활용
- **배치 작업**: BatchGetItem, BatchWriteItem 사용
- **에러 처리**: DynamoDB 에러 상황 대응

### 7. Lambda 함수 규칙
- **핸들러 함수**: 명확한 함수명과 구조
- **환경 변수**: 민감한 정보는 환경 변수로 관리
- **메모리 설정**: 적절한 메모리 할당

### 8. 테스트 규칙
- **단위 테스트**: Jest 사용
- **통합 테스트**: API 엔드포인트 테스트
- **모킹**: 외부 의존성 모킹

## 🔧 개발 체크리스트

- [ ] API 요청: camelCase → snake_case 변환
- [ ] API 응답: snake_case → camelCase 변환
- [ ] 공통 서비스 사용
- [ ] 로깅 추가
- [ ] 테스트 작성
- [ ] 에러 처리

## 🚀 개발 워크플로우

### 1. Lambda 함수 개발
```typescript
// lambda/getUser.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../services/userService';
import { camelToSnakeCase, snakeToCamelCase } from '../utils/caseUtils';
import { logger } from '../utils/logger';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { userId } = camelToSnakeCase(event.pathParameters || {});
    const user = await userService.getUserById(userId);
    
    logger.info('User retrieved', { userId, result: 'success' });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snakeToCamelCase(user))
    };
  } catch (error) {
    logger.error('Get user failed', { error: error.message });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### 2. 공통 서비스 개발
```typescript
// services/userService.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

class UserService {
  async getUserById(userId) {
    const command = new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { id: userId }
    });
    
    const response = await this.docClient.send(command);
    return response.Item;
  }
}

module.exports = new UserService();
```

### 3. Express 개발 서버
```typescript
// local-server.js
const express = require('express');
const { userService } = require('./services/userService');
const { camelToSnakeCase, snakeToCamelCase } = require('./utils/caseUtils');

app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = camelToSnakeCase(req.params);
    const user = await userService.getUserById(userId);
    res.json(snakeToCamelCase(user));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 🧪 테스트 규칙
- **단위 테스트**: Jest + 각 서비스별 테스트
- **통합 테스트**: API 엔드포인트 전체 플로우 테스트
- **로컬 테스트**: Express 서버로 빠른 개발
- **SAM 로컬**: Lambda 함수 로컬 테스트

## 📦 배포 규칙
- **개발 환경**: Express 서버 (`npm run dev`)
- **프로덕션 환경**: SAM + Lambda (`npm run deploy:prod`)
- **환경 변수**: AWS Systems Manager Parameter Store 사용
- **로깅**: CloudWatch 로그 활용

## 🔒 보안 규칙
- **환경 변수**: 민감한 정보는 환경 변수로 관리
- **IAM 권한**: 최소 권한 원칙 적용
- **입력 검증**: 사용자 입력 데이터 검증
- **CORS 설정**: 적절한 CORS 정책 적용

## 📝 코딩 컨벤션
- **네이밍**: snake_case (백엔드 내부), camelCase (API), kebab-case (URL)
- **주석**: 복잡한 로직에 한글 주석 작성
- **에러 메시지**: 사용자 친화적인 에러 메시지
- **로깅**: 적절한 로그 레벨 사용

## 🚨 주의사항
- **데이터 변환**: camelCase ↔ snake_case 변환 필수
- **에러 처리**: 모든 비동기 작업에 try-catch 적용
- **로깅**: 중요한 작업에 로깅 추가
- **성능**: DynamoDB 쿼리 최적화

## 📚 참고 자료
- [AWS Lambda 문서](https://docs.aws.amazon.com/lambda/)
- [AWS SAM 문서](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB 문서](https://docs.aws.amazon.com/dynamodb/)
- [Express.js 문서](https://expressjs.com/)

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0 