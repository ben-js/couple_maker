# Frontend Cursor Rules

## 🎯 핵심 개발 규칙

### 1. 기술 스택
- **프레임워크**: React Native + Expo SDK 53
- **언어**: TypeScript (strict mode)
- **상태관리**: React Context + AsyncStorage
- **UI 라이브러리**: react-native-ui-lib
- **폼 관리**: react-hook-form + yup
- **네비게이션**: react-navigation

### 2. 디렉토리 구조
```
frontend/src/
├── screens/          # 화면 단위 구성
├── components/       # 재사용 UI 컴포넌트
├── navigation/       # react-navigation 설정
├── services/         # API 모듈
├── store/            # Context 스토어
├── hooks/            # 커스텀 훅
├── utils/            # 공통 유틸 함수
├── types/            # TypeScript 타입 정의
└── constants/        # 상수 정의
```

### 3. 상태관리 규칙
- **AuthContext**: 사용자 인증 상태 관리
- **AsyncStorage**: 사용자 정보 영구 저장
- **로컬 상태**: useState/useReducer 사용
- **외부 라이브러리 사용 금지**: zustand, redux 등

```typescript
// AuthContext 사용
const { user, login, logout } = useAuth();

// AsyncStorage 사용
await AsyncStorage.setItem('user', JSON.stringify(userData));
```

### 4. 폼 관리 규칙
- **모든 폼**: useForm + yup 스키마 조합 사용
- **Controller**: RN UI Lib와 연결

```typescript
const schema = yup.object({
  nickname: yup.string().required(),
});

const { control, handleSubmit } = useForm({
  resolver: yupResolver(schema)
});
```

### 5. 네비게이션 규칙
- **타입 안전성**: RootStackParamList 선언
- **타입 기반 접근**: 모든 navigate 함수

```typescript
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};
```

### 6. API 통신 규칙
- **프론트엔드 코드**: camelCase 사용
- **API 요청/응답**: camelCase 사용 (변환 불필요)
- **URL**: kebab-case 사용 (`/user-preferences`)

```typescript
// services/userPreferencesService.ts
export async function saveUserPreferences(data: UserPreferences): Promise<void> {
  const response = await fetch('/api/user-preferences', {
    method: 'POST',
    body: JSON.stringify(data) // camelCase 그대로 전송
  });
  return response.json(); // 백엔드에서 camelCase로 변환 후 반환
}
```

### 7. UI 컴포넌트 규칙
- **기본 UI**: RN UI Lib 사용 (Button, Text, Card, Dialog 등)
- **커스텀 스타일**: theme/Colors.ts 또는 Typography.ts에서 관리
- **스켈레톤**: shimmer-placeholder로 구현

### 8. 이미지 처리 규칙
- **사진 업로드/촬영**: expo-image-picker
- **크롭**: expo-image-cropper, expo-image-manipulator
- **최적화**: API 전송 전 리사이즈 및 압축

## 🔧 개발 체크리스트

- [ ] Props/State 명시적 타입 정의
- [ ] AuthContext + AsyncStorage 적용
- [ ] Form은 yup + hook-form 사용
- [ ] Shimmer 로딩 적용
- [ ] Navigation 타입 적용
- [ ] API 통신 규칙 준수

## 🚀 실행 명령어

```bash
npm install
npm run start          # Expo 실행
npm run android        # Android 빌드
npm run ios           # iOS 빌드
npm test              # 테스트 실행
```

---

**마지막 업데이트**: 2024년 12월

