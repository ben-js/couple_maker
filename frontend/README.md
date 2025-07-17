# Date Sense Frontend

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-49.0+-green.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)

데이팅 앱 **Date Sense**의 React Native 프론트엔드 앱입니다.

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
# Expo 개발 서버
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android
```

### 3. 앱 테스트
```bash
# 테스트 실행
npm test

# E2E 테스트
npm run e2e:ios
npm run e2e:android
```

## 🏗️ 아키텍처

- **프레임워크**: React Native + Expo
- **언어**: TypeScript
- **상태 관리**: React Context + Hooks
- **네비게이션**: React Navigation
- **UI 라이브러리**: React Native Elements
- **테스트**: Jest + Detox

## 📚 주요 기능

- ✅ 사용자 인증 (로그인/회원가입)
- ✅ 프로필 관리 및 편집
- ✅ AI 기반 매칭 시스템
- ✅ 카드 스와이프 인터페이스
- ✅ 채팅 및 메시징
- ✅ 설정 및 선호도 관리
- ✅ 푸시 알림

## 🔧 기술 스택

- **런타임**: React Native 0.72+
- **개발 도구**: Expo SDK 49+
- **언어**: TypeScript 5.1+
- **네비게이션**: React Navigation 6.x
- **상태 관리**: React Context API
- **UI 컴포넌트**: React Native Elements
- **이미지 처리**: Expo Image Picker
- **로컬 저장소**: AsyncStorage
- **테스트**: Jest + Detox

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── screens/        # 화면 컴포넌트
│   ├── navigation/     # 네비게이션 설정
│   ├── services/       # API 서비스
│   ├── store/          # 상태 관리
│   ├── types/          # TypeScript 타입 정의
│   ├── utils/          # 유틸리티 함수
│   └── constants/      # 상수 정의
├── assets/             # 이미지, 폰트 등
├── test/               # 테스트 파일들
├── storybook/          # Storybook 설정
├── App.tsx            # 앱 진입점
└── package.json       # 의존성 관리
```

## 🚀 개발 환경

### 필수 요구사항
- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **Expo CLI**: 최신 버전
- **iOS 개발**: Xcode (macOS)
- **Android 개발**: Android Studio

### 개발 서버 실행
```bash
# 기본 개발 서버
npx expo start

# 터널 모드 (외부 접근)
npx expo start --tunnel

# 캐시 클리어
npx expo start --clear
```

### 플랫폼별 실행
```bash
# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android

# 웹 브라우저
npx expo start --web
```

## 📱 빌드 및 배포

### 개발 빌드
```bash
# iOS 개발 빌드
npx expo build:ios --type development

# Android 개발 빌드
npx expo build:android --type apk
```

### 프로덕션 빌드
```bash
# iOS 프로덕션 빌드
npx expo build:ios --release-channel production

# Android 프로덕션 빌드
npx expo build:android --release-channel production
```

### EAS Build (클라우드 빌드)
```bash
# EAS 빌드 설정
eas build:configure

# iOS 빌드
eas build --platform ios

# Android 빌드
eas build --platform android
```

## 🧪 테스트

### 단위 테스트
```bash
# 전체 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 커버리지 리포트
npm test -- --coverage
```

### E2E 테스트
```bash
# iOS E2E 테스트
npm run e2e:ios

# Android E2E 테스트
npm run e2e:android
```

### Storybook
```bash
# Storybook 실행
npm run storybook
```

## 📖 문서

- **[개발 가이드](DEVELOPMENT.md)** - 상세한 개발 문서
- **[UX 가이드](ux.md)** - UI/UX 디자인 가이드
- **[컴포넌트 가이드](src/components/)** - 컴포넌트 사용법
- **[전체 프로젝트 가이드](../docs/DEVELOPMENT.md)** - 백엔드 연동 가이드

## 🔗 관련 프로젝트

- **[Backend](../backend/)** - AWS Lambda + Express API
- **[Documentation](../docs/)** - 프로젝트 문서

## 📞 지원

문제가 있으시면 [개발 가이드](DEVELOPMENT.md)를 참고하거나 이슈를 등록해주세요.

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](../LICENSE) 파일을 참고하세요.

---

**Date Sense Frontend** - 데이팅 앱의 아름다운 모바일 인터페이스 