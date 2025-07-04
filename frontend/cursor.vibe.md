# 💡 Couple Maker – Vibe Coding 개발 룰 (for Cursor/Copilot)

소개팅 앱 **Couple Maker**를 빠르고 일관성 있게 개발하기 위한 바이브 코딩 규칙 문서입니다.  
React Native + Expo + AWS Serverless 구조를 기반으로, AI 도구(Cursor, Copilot 등)를 사용해 효율적인 협업을 유도합니다.

---

## 🛠 기술 스택 요약

| 영역 | 사용 기술 |
|------|----------|
| 프레임워크 | React Native + Expo SDK 53 |
| 언어 | TypeScript (strict mode) |
| 상태관리 | Zustand |
| UI 라이브러리 | react-native-ui-lib |
| 폼 관리 | react-hook-form + yup |
| 네비게이션 | react-navigation |
| 이미지 | expo-image-picker / manipulator |
| 네트워크 | axios |
| 알림 | expo-notifications, haptic |
| 테스트 | @testing-library/react-native |
| 기타 | shimmer-placeholder, vector-icons, modal 등 |

---

## 🧱 디렉토리 구조 규칙

frontend/src/
├── screens/ # 화면 단위 구성
├── components/ # 재사용 UI 컴포넌트
├── navigation/ # react-navigation 설정
├── services/ # API 모듈
├── store/ # Zustand 스토어
├── hooks/ # 커스텀 훅
├── utils/ # 공통 유틸 함수
├── mocks/ # mock 데이터
├── theme/ # Colors, Typography 정의


---

## 🎛 개발 규칙 요약

### ✅ 상태관리 (Zustand)

- 상태는 반드시 `store/` 내 모듈로 정의
- `persist` 미들웨어로 로컬 저장 필요 시 적용
- 상태 변경은 setter 함수로만

```ts
export const useUserStore = create(persist(...));

const schema = yup.object({
  nickname: yup.string().required(),
});

✅ 폼 관리 (hook-form + yup)
모든 입력 폼은 useForm + yup 스키마 조합 사용

Controller로 RN UI Lib와 연결

const schema = yup.object({
  nickname: yup.string().required(),
});

✅ 내비게이션 (react-navigation)
타입 안전성 확보를 위해 RootStackParamList 선언

모든 navigate 함수는 타입 기반 접근

screen/ 폴더는 라우팅 구성에 맞춰 정리

✅ UI 컴포넌트 (RN UI Lib)
모든 기본 UI는 RN UI Lib 사용: Button, Text, Card, Dialog 등

커스텀 스타일은 theme/Colors.ts 또는 Typography.ts에서 관리

스켈레톤은 shimmer-placeholder로 구현

✅ 이미지 처리
사진 업로드/촬영: expo-image-picker

크롭: expo-image-cropper, expo-image-manipulator

결과는 API 전송 전 리사이즈 및 압축

✅ 더미 데이터(mock)
경로: __mocks__/, fixtures/

예시: mockUsers.ts, mockMatches.ts

실 타입 기준으로 생성하며, 테스트/디자인에 활용

export const mockUsers: User[] = [ { user_id: '1', name: 'Alice', ... } ];


✅ 코드 스타일 & 규약
모든 컴포넌트는 .tsx + 명시적 Props 타입 사용

상태/이벤트 명은 onSubmit, setUser 등 일관되게

API 모듈은 services/ 내에 함수형으로 구성

// services/match.ts
export async function fetchRecommendations(userId: string): Promise<Match[]> {
  return axios.get(`/recommendations/${userId}`);
}

🔁 커밋 & PR 규칙
🔖 커밋 메시지 예시
feat: 프로필 카드 UI 구현
fix: 일정 제안 시 포맷 오류 수정
refactor: Zustand 스토어 분리feat: 프로필 카드 UI 구현
fix: 일정 제안 시 포맷 오류 수정
refactor: Zustand 스토어 분리

✅ PR 체크리스트
 Props/State 명시

 Zustand 모듈화 적용

 Form은 yup + hook-form

 Shimmer 로딩 적용

 Navigation 타입 적용

 Dummy data로 화면 개발 완료

 🔧 디버깅 & 실행 명령어

npm install
npm run start          # Expo 실행
npm run android        # Android 빌드
npm run ios            # iOS 빌드
npm run lint           # ESLint 검사
npm run type-check     # TS 타입 체크

📘 기타 팁
알림: expo-notifications → 당일 소개팅 리마인더 등

진동 피드백: react-native-haptic-feedback

아이콘: react-native-vector-icons (UI/UX 강화)

차트: react-native-chart-kit → 후기 통계 시각화 등

---

## ✅ MVVM 패턴 준수
- View(화면), ViewModel(로직/상태), Model(데이터) 역할을 분리하여 유지보수성과 확장성을 높임
- View는 screens/, ViewModel은 hooks/ 또는 store/, Model은 types/ 및 services/에 위치
- View는 ViewModel에서 제공하는 데이터/이벤트만 사용하며, 직접 비즈니스 로직을 구현하지 않음

## ✅ 목업 데이터 기반 개발 & REST API 연동 구조화
- REST API 연동 전, mocks/ 또는 fixtures/의 목업 데이터로 화면/로직을 우선 개발
- 실제 API가 준비되면 services/의 함수만 교체하면 되도록 View/ViewModel/Model 구조를 설계
- API 응답 타입과 목업 데이터 타입을 일치시켜, API 적용 시 최소한의 코드 변경으로 연동 가능하게 함

## ✅ 네이밍/파일명 규칙
- 컴포넌트: PascalCase (예: UserCard.tsx)
- 훅: use로 시작 (예: useAuth.ts)
- Zustand store: ~Store.ts (예: userStore.ts)
- 타입/인터페이스: types/에 정의, I~, ~Type, ~Props 등 명확히

## ✅ 타입스크립트
- any 사용 금지, 타입 안전성 최우선
- Props/State/함수 반환값 모두 타입 명시
- 공통 타입은 types/에 분리

## ✅ 테스트
- 테스트 파일은 __tests__/ 또는 *.test.tsx
- 주요 컴포넌트/로직 커버리지 80% 이상 목표

## ✅ API
- axios 인스턴스 사용, 공통 에러 핸들링
- API 함수는 services/에 함수형으로 작성

## ✅ 협업/PR
- PR 리뷰어 지정, 라벨/체크리스트 활용
- 머지 전 lint/type-check 필수

## ✅ UI/UX 가이드
- 컬러/폰트/여백 등 디자인 시스템(theme/) 적극 활용
- Chip, Card, Modal 등 자주 쓰는 UI 패턴 예시 추가
- 주요 정보/소개/관심사 등은 Card 스타일로 일관성 있게

## ✅ 주석/문서화
- 함수/컴포넌트 상단 JSDoc 주석 권장
- 복잡한 로직은 인라인 주석 필수

## 테스트 및 개발 완료 규칙
- 모든 화면(컴포넌트) 및 비즈니스 로직은 반드시 `frontend/test` 폴더에 테스트 코드를 작성한다.
- 저장 등 API 호출이 포함된 경우, API 문제와 프론트엔드 문제를 구분할 수 있도록 테스트 코드를 작성한다.
- 테스트 코드는 실제로 실행하여 통과 여부를 확인한다.
- 테스트가 통과된 경우에만 해당 화면/기능 개발이 완료된 것으로 간주한다.
- 테스트 코드 없이 개발 완료로 처리하지 않는다.

## Frontend Development Rules

## 상태관리 규칙
- **AuthContext**: 사용자 인증 상태 관리 (로그인/로그아웃, user 정보)
- **AsyncStorage**: 사용자 정보 영구 저장 (앱 재시작 시 로그인 상태 유지)
- **로컬 상태**: 컴포넌트 내부 상태는 useState/useReducer 사용
- **불필요한 상태관리 라이브러리 사용 금지**: zustand, redux 등 외부 라이브러리 사용 금지

## 코드 구조 규칙
- **MVVM 패턴**: View(화면) / ViewModel(로직) / Model(데이터) 분리
- **컴포넌트 분리**: 재사용 가능한 컴포넌트는 components 폴더에 분리
- **타입 정의**: 모든 인터페이스는 types 폴더에 정의
- **서비스 분리**: API 호출은 services 폴더에 분리

## 네비게이션 규칙
- **Stack Navigator**: 인증/온보딩 플로우
- **Tab Navigator**: 메인 앱 플로우
- **타입 안전성**: RootStackParamList, MainTabParamList 사용

## 폼 관리 규칙
- **React Hook Form**: 모든 폼은 react-hook-form 사용
- **Yup 검증**: 스키마 기반 폼 검증
- **동적 폼**: profileForm.json 기반 동적 폼 렌더링

## 스타일링 규칙
- **React Native UI Lib**: 기본 UI 컴포넌트 사용
- **일관된 색상**: Colors 테마 시스템 사용
- **반응형 디자인**: 다양한 화면 크기 대응

## 에러 처리 규칙
- **토스트 메시지**: Android는 ToastAndroid, iOS는 Alert 사용
- **에러 바운더리**: 주요 화면에 에러 처리 추가
- **로딩 상태**: 비동기 작업 시 로딩 인디케이터 표시

## 성능 최적화 규칙
- **메모이제이션**: React.memo, useMemo, useCallback 적절히 사용
- **이미지 최적화**: expo-image-manipulator로 이미지 압축
- **지연 로딩**: 필요시에만 컴포넌트 로드

## 개발 워크플로우
- **핫 리로드**: Expo Go 환경에서 빠른 개발 반복
- **타입 체크**: TypeScript 엄격 모드 사용
- **린트**: ESLint 규칙 준수
- **코드 리뷰**: 주요 변경사항은 코드 리뷰 필수

## 상태관리 정리 완료 (2024-07-04)
- ✅ zustand 기반 userPreferencesStore 제거
- ✅ AuthContext + AsyncStorage 기반 단일 상태관리로 통합
- ✅ 불필요한 dependencies 제거 (zustand)
- ✅ RootNavigator 리팩토링 완료

