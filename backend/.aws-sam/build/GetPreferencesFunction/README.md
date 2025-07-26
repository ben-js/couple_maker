# Date Sense Backend

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![AWS SAM](https://img.shields.io/badge/AWS%20SAM-Latest-orange.svg)](https://aws.amazon.com/serverless/sam/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

데이팅 앱 **Date Sense**의 백엔드 API 서버입니다.

## 🚀 빠른 시작

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# API 테스트
curl http://localhost:3001/
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

## 📚 주요 기능

- ✅ 사용자 인증 (로그인/회원가입)
- ✅ 프로필 관리
- ✅ 매칭 시스템
- ✅ 리뷰 시스템
- ✅ 포인트 시스템
- ✅ 파일 업로드

> **참고**: Admin 시스템은 별도의 Next.js 애플리케이션으로 분리되어 AWS Amplify Hosting에서 운영됩니다.

## 🔧 개발 명령어

```bash
# 개발 서버
npm run dev

# 테스트
npm test

# 빌드
npm run build

# 배포
npm run deploy:prod

# SAM 로컬 테스트
npm run local
```

## 📚 상세 문서

- **[개발 가이드](cursor.vibe.md)** - 상세한 개발 규칙 및 워크플로우
- **[전체 시스템 가이드](../docs/DEVELOPMENT.md)** - 전체 시스템 아키텍처 및 배포
- **[Backend 개발](../docs/DEVELOPMENT.md#백엔드-개발)** - Express/AWS SAM 개발 가이드
- **[API 문서](../docs/DEVELOPMENT.md#api-문서)** - API 엔드포인트 가이드

## 🔗 관련 프로젝트

- **[Frontend](../frontend/)** - React Native 앱
- **[Admin](../admin/)** - Next.js 관리자 대시보드 (AWS Amplify)
- **[Documentation](../docs/)** - 프로젝트 문서

## 🚨 문제 해결

### 서버 시작 실패
1. Node.js 버전 확인 (18.x 이상)
2. 포트 충돌 확인 (3001번 포트)
3. 환경 변수 설정 확인

### AWS 연결 실패
1. AWS CLI 설정 확인
2. IAM 권한 확인
3. 리전 설정 확인

## 📞 지원

- **개발 가이드**: [cursor.vibe.md](cursor.vibe.md)
- **전체 문서**: [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- **이슈**: GitHub Issues

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0 