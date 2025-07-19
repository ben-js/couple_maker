# Date Sense Admin Dashboard

AWS Amplify Hosting으로 배포되는 **독립적인** 관리자 대시보드입니다.

## 🚀 빠른 시작

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp env.amplify.example .env.local

# 개발 서버 실행
npm run dev
```

### 배포
```bash
# 빌드
npm run build

# AWS Amplify 배포
# 자세한 배포 가이드는 docs/DEVELOPMENT.md 참조
```

## 📋 주요 기능

- 📊 **대시보드**: 실시간 통계 및 차트
- 👥 **사용자 관리**: 사용자 목록, 상세 정보, 상태 관리
- 🔗 **매칭 관리**: 매칭 요청, 상태 관리
- 💰 **포인트 관리**: 포인트 충전, 사용 내역
- ⭐ **리뷰 관리**: 리뷰 목록, 관리
- 🔐 **관리자 인증**: JWT 기반 인증

## 🔄 Backend와의 관계

- ✅ **완전 분리**: Backend API와 독립적으로 운영
- ✅ **직접 연결**: DynamoDB에 직접 연결하여 빠른 응답
- ✅ **별도 배포**: AWS Amplify에서 별도 호스팅
- ✅ **독립적 보안**: 별도의 인증 및 권한 관리

## 📚 상세 문서

- **[개발 가이드](cursor.vibe.md)** - 상세한 개발 규칙 및 워크플로우
- **[전체 시스템 가이드](../docs/DEVELOPMENT.md)** - 전체 시스템 아키텍처 및 배포
- **[AWS Amplify 배포](../docs/DEVELOPMENT.md#aws-amplify-배포)** - 배포 상세 가이드

## 🚨 문제 해결

### 빌드 실패
1. CloudWatch 로그 확인
2. 환경 변수 설정 확인
3. Node.js 버전 확인 (18.x 이상)

### 런타임 에러
1. 브라우저 개발자 도구 확인
2. CloudWatch 로그 확인
3. DynamoDB 연결 확인

## 📞 지원

- **개발 가이드**: [cursor.vibe.md](cursor.vibe.md)
- **전체 문서**: [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- **이슈**: GitHub Issues

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0 