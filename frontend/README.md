# Date Sense Frontend

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49.0+-green.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)

데이팅 앱 **Date Sense**의 React Native 프론트엔드 앱입니다.

## 🚀 빠른 시작

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android
```

### 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 환경 변수 설정
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_ENVIRONMENT=development
```

## 📱 주요 기능

- ✅ 사용자 인증 (로그인/회원가입)
- ✅ 프로필 관리 및 편집
- ✅ AI 기반 매칭 시스템
- ✅ 카드 스와이프 인터페이스
- ✅ 채팅 및 메시징
- ✅ 설정 및 선호도 관리
- ✅ 푸시 알림

## 🔧 개발 명령어

```bash
# 개발 서버
npx expo start

# 테스트
npm test

# 빌드
npx expo build:ios
npx expo build:android

# EAS 빌드
eas build --platform ios
eas build --platform android
```

## 📚 상세 문서

- **[개발 가이드](cursor.vibe.md)** - 상세한 개발 규칙 및 워크플로우
- **[UX 가이드](ux.md)** - UI/UX 디자인 가이드
- **[전체 시스템 가이드](../docs/DEVELOPMENT.md)** - 전체 시스템 아키텍처 및 배포
- **[Frontend 개발](../docs/DEVELOPMENT.md#프론트엔드-개발)** - React Native 개발 가이드

## 🔗 관련 프로젝트

- **[Backend](../backend/)** - AWS Lambda + Express API
- **[Admin](../admin/)** - Next.js 관리자 대시보드
- **[Documentation](../docs/)** - 프로젝트 문서

## 🚨 문제 해결

### 빌드 실패
1. Node.js 버전 확인 (18.x 이상)
2. Expo CLI 업데이트
3. 캐시 클리어: `npx expo start --clear`

### 런타임 에러
1. Metro 번들러 재시작
2. 의존성 재설치: `npm install`
3. Expo 개발자 도구 확인

## 📞 지원

- **개발 가이드**: [cursor.vibe.md](cursor.vibe.md)
- **전체 문서**: [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- **이슈**: GitHub Issues

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0 