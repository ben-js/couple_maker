# Date Sense Backend

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![AWS SAM](https://img.shields.io/badge/AWS%20SAM-Latest-orange.svg)](https://aws.amazon.com/serverless/sam/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

데이팅 앱 **Date Sense**의 백엔드 API 서버입니다.

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. API 테스트
```bash
curl http://localhost:3000/
```

## 🏗️ 아키텍처

- **개발 환경**: Express 서버 (빠른 개발)
- **프로덕션 환경**: AWS SAM + Lambda (서버리스)
- **데이터베이스**: DynamoDB
- **파일 저장**: S3

## 📚 주요 기능

- ✅ 사용자 인증 (로그인/회원가입)
- ✅ 프로필 관리
- ✅ 매칭 시스템
- ✅ 리뷰 시스템
- ✅ 포인트 시스템
- ✅ 파일 업로드

## 🔧 기술 스택

- **런타임**: Node.js 18.x
- **프레임워크**: Express.js
- **서버리스**: AWS SAM
- **데이터베이스**: DynamoDB
- **스토리지**: S3
- **테스트**: Jest
- **로깅**: Winston

## 📁 프로젝트 구조

```
backend/
├── services/            # 공통 서비스
├── models/              # 데이터 모델
├── utils/               # 유틸리티
├── local-server.js      # Express 개발 서버
├── serverless.yml       # Serverless 설정
├── nodemon.json         # 개발 서버 설정
└── package.json         # 의존성 관리
```

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

# 빌드
npm run build

# 배포
npm run deploy:prod
```

## 📖 문서

- **[개발 가이드](DEVELOPMENT.md)** - 상세한 개발 문서
- **[개발 규칙](cursor.vibe.md)** - 코딩 규칙 및 체크리스트
- **[아키텍처 가이드](../docs/flow.md)** - 전체 시스템 플로우

## 🔗 관련 프로젝트

- **[Frontend](../frontend/)** - React Native 앱
- **[Documentation](../docs/)** - 프로젝트 문서

## 📞 지원

문제가 있으시면 [개발 가이드](DEVELOPMENT.md)를 참고하거나 이슈를 등록해주세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](../LICENSE) 파일을 참고하세요.

---

**Date Sense Backend** - 데이팅 앱의 강력한 백엔드 API 