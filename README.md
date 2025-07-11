# 💕 Date Sense - 소개팅 앱

React Native + AWS 서버리스 아키텍처로 구축된 소개팅 앱입니다.

## 🏗 프로젝트 구조

```
date-sense/
├── frontend/                 # React Native + Expo 앱
│   ├── src/
│   │   ├── screens/         # 화면 컴포넌트
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── navigation/      # 네비게이션 설정
│   │   ├── services/        # API 서비스
│   │   ├── store/           # 상태 관리
│   │   └── utils/           # 유틸리티 함수
│   └── package.json
├── backend/                  # AWS Lambda + API Gateway
│   ├── src/
│   │   ├── functions/       # Lambda 함수들
│   │   ├── models/          # 데이터 모델
│   │   └── utils/           # 공통 유틸리티
│   └── sst.config.ts        # SST 설정
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
└── docs/                    # 문서
```

## 🛠 기술 스택

### Frontend
- **React Native** + **Expo Go**
- **TypeScript**
- **React Native UI Lib** (wix.github.io/react-native-ui-lib)
- **React Navigation** (화면 전환)
- **Zustand** (상태 관리)

### Backend
- **AWS Lambda** + **API Gateway**
- **Node.js** + **TypeScript**
- **SST** (Serverless Stack)
- **DynamoDB** (데이터베이스)
- **S3** (이미지 저장)

### DevOps
- **GitHub Actions** (CI/CD)
- **AWS** (배포 환경)

## 🚀 빠른 시작

### 1. 프론트엔드 실행
```bash
cd frontend
npm install
npx expo upgrade
npx expo start
```

### 2. 백엔드 배포
```bash
cd backend
npm install
npx sst deploy --stage dev
```

## 📱 주요 기능

### 사용자 플로우
1. **온보딩 & 회원가입** - 소셜 로그인, 프로필 설정
2. **프로필 작성** - 사진, 기본정보, 관심사 입력
3. **추천 카드** - Tinder 스타일 스와이프
4. **상세 프로필** - 매칭 상대 상세 정보
5. **채팅** - 매칭된 상대와 대화
6. **필터 검색** - 조건별 상대 찾기
7. **마이페이지** - 설정 및 계정 관리

## 🔄 개발 워크플로우

1. **Cursor IDE**에서 코드 수정
2. **자동 PR 생성** (Cursor/GPT)
3. **GitHub에서 리뷰** 후 Merge
4. **GitHub Actions**로 자동 배포
5. **AWS**에 배포 완료

## 📋 개발 체크리스트

- [ ] 프론트엔드 기본 구조 설정
- [ ] 백엔드 API 설계 및 구현
- [ ] 데이터베이스 스키마 설계
- [ ] 인증 시스템 구현
- [ ] 이미지 업로드 기능
- [ ] 매칭 알고리즘 구현
- [ ] 실시간 채팅 기능
- [ ] 푸시 알림 설정
- [ ] CI/CD 파이프라인 구축
- [ ] 테스트 코드 작성

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 