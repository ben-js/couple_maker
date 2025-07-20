# Frontend - 개발 규칙

## 🎯 개발 규칙

### 1. 상태관리 규칙
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

### 2. 폼 관리 규칙
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

### 3. 네비게이션 규칙
- **타입 안전성**: RootStackParamList 선언
- **타입 기반 접근**: 모든 navigate 함수

```typescript
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};
```

### 4. API 통신 규칙
- **프론트엔드 코드**: camelCase 사용
- **API 요청/응답**: camelCase 사용 (변환 불필요)
- **URL**: kebab-case 사용 (`/user-preferences`)

```typescript
// services/preferenceService.ts
export async function savePreferences(data: Preferences): Promise<void> {
  const response = await fetch('/api/user-preferences', {
    method: 'POST',
    body: JSON.stringify(data) // camelCase 그대로 전송
  });
  return response.json(); // 백엔드에서 camelCase로 변환 후 반환
}
```

### 5. UI 컴포넌트 규칙
- **기본 UI**: RN UI Lib 사용 (Button, Text, Card, Dialog 등)
- **커스텀 스타일**: theme/Colors.ts 또는 Typography.ts에서 관리
- **스켈레톤**: shimmer-placeholder로 구현

### 6. 이미지 처리 규칙
- **사진 업로드/촬영**: expo-image-picker
- **크롭**: expo-image-cropper, expo-image-manipulator
- **최적화**: API 전송 전 리사이즈 및 압축

### 7. TypeScript 규칙
- **엄격한 타입 체크**: `strict: true` 설정 유지
- **Props 인터페이스**: 명확한 Props 타입 정의
- **API 타입**: 백엔드 API 응답 타입 정의
- **제네릭 활용**: 재사용 가능한 타입 정의

### 8. 성능 최적화 규칙
- **메모이제이션**: React.memo, useMemo, useCallback 적절히 사용
- **이미지 최적화**: expo-image 사용
- **번들 크기**: 불필요한 의존성 제거
- **로딩 상태**: 스켈레톤 UI 구현

## 🔧 개발 체크리스트

- [ ] Props/State 명시적 타입 정의
- [ ] AuthContext + AsyncStorage 적용
- [ ] Form은 yup + hook-form 사용
- [ ] Shimmer 로딩 적용
- [ ] Navigation 타입 적용
- [ ] API 통신 규칙 준수

## 🚀 개발 워크플로우

### 1. 컴포넌트 개발
```typescript
// 1. Props 인터페이스 정의
interface UserCardProps {
  user: User;
  onPress: (userId: string) => void;
}

// 2. 컴포넌트 작성
const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  return (
    <Card onPress={() => onPress(user.id)}>
      <Text>{user.name}</Text>
    </Card>
  );
};
```

### 2. 화면 개발
```typescript
// screens/HomeScreen.tsx
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  return (
    <View>
      <Text>안녕하세요, {user?.name}님!</Text>
    </View>
  );
};
```

### 3. API 서비스 개발
```typescript
// services/userService.ts
import { apiClient } from '../utils/apiClient';

export const userService = {
  async getProfile(userId: string): Promise<Profile> {
    const response = await apiClient.get(`/user/${userId}`);
    return response.data;
  },

  async updateProfile(userId: string, data: UpdateProfileData): Promise<Profile> {
    const response = await apiClient.put(`/user/${userId}`, data);
    return response.data;
  }
};
```

## 🧪 테스트 규칙
- **단위 테스트**: Jest + React Native Testing Library
- **컴포넌트 테스트**: 사용자 인터랙션 테스트
- **API 모킹**: MSW 또는 Jest Mock 사용
- **E2E 테스트**: Detox 사용

## 📦 빌드 및 배포 규칙
- **EAS Build**: 클라우드 빌드 사용
- **환경 변수**: Expo 환경 변수 관리
- **코드 푸시**: OTA 업데이트 활용
- **스토어 배포**: App Store, Play Store 자동화

## 🔒 보안 규칙
- **환경 변수**: 민감한 정보는 Expo 환경 변수로 관리
- **토큰 관리**: AsyncStorage에 안전하게 저장
- **API 보안**: HTTPS 필수, 토큰 검증
- **입력 검증**: 사용자 입력 데이터 검증

## 📝 코딩 컨벤션
- **네이밍**: camelCase (변수, 함수), PascalCase (컴포넌트)
- **주석**: 복잡한 로직에 한글 주석 작성
- **에러 처리**: try-catch로 에러 핸들링
- **로깅**: 적절한 로그 레벨 사용

## 🚨 주의사항
- **플랫폼 차이**: iOS/Android 플랫폼별 처리
- **성능 최적화**: 메모리 누수 방지
- **접근성**: 스크린 리더 지원
- **국제화**: 다국어 지원 고려

## 📚 참고 자료
- [React Native 공식 문서](https://reactnative.dev/docs/getting-started)
- [Expo 문서](https://docs.expo.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [React Navigation 문서](https://reactnavigation.org/docs/getting-started)

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0

