# Date Sense Frontend - 개발 가이드

## 📋 목차
- [개요](#개요)
- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [컴포넌트 개발](#컴포넌트-개발)
- [상태 관리](#상태-관리)
- [네비게이션](#네비게이션)
- [API 연동](#api-연동)
- [테스트](#테스트)
- [빌드 및 배포](#빌드-및-배포)
- [성능 최적화](#성능-최적화)
- [트러블슈팅](#트러블슈팅)

## 🎯 개요

Date Sense Frontend는 React Native와 Expo를 기반으로 한 크로스 플랫폼 모바일 앱입니다.

### 주요 특징
- ✅ TypeScript로 타입 안전성 확보
- ✅ 컴포넌트 기반 아키텍처
- ✅ 상태 관리 최적화
- ✅ 자동화된 테스트
- ✅ 성능 모니터링

## ⚙️ 개발 환경 설정

### 필수 요구사항
```bash
# Node.js 18.x 이상
node --version

# npm 9.x 이상
npm --version

# Expo CLI
npm install -g @expo/cli

# Watchman (macOS)
brew install watchman
```

### 프로젝트 설정
```bash
# 1. 의존성 설치
npm install

# 2. Expo 의존성 설치
npx expo install

# 3. 환경 변수 설정
cp .env.example .env
```

### 환경 변수 설정
```env
# .env 파일
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 컴포넌트
│   │   ├── forms/          # 폼 컴포넌트
│   │   └── cards/          # 카드 컴포넌트
│   ├── screens/            # 화면 컴포넌트
│   │   ├── auth/          # 인증 관련 화면
│   │   ├── main/          # 메인 화면
│   │   ├── profile/       # 프로필 관련 화면
│   │   └── settings/      # 설정 화면
│   ├── navigation/         # 네비게이션 설정
│   │   ├── RootNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── services/           # API 서비스
│   │   ├── api.ts         # API 클라이언트
│   │   ├── authService.ts # 인증 서비스
│   │   └── userService.ts # 사용자 서비스
│   ├── store/              # 상태 관리
│   │   ├── AuthContext.tsx
│   │   └── ProfileContext.tsx
│   ├── types/              # TypeScript 타입 정의
│   │   ├── api.ts         # API 타입
│   │   ├── navigation.ts  # 네비게이션 타입
│   │   └── index.ts       # 공통 타입
│   ├── utils/              # 유틸리티 함수
│   │   ├── apiUtils.ts    # API 유틸리티
│   │   ├── validation.ts  # 검증 함수
│   │   └── helpers.ts     # 헬퍼 함수
│   └── constants/          # 상수 정의
│       ├── colors.ts      # 색상 상수
│       ├── messages.ts    # 메시지 상수
│       └── index.ts       # 공통 상수
├── assets/                 # 이미지, 폰트 등
├── test/                   # 테스트 파일들
├── storybook/              # Storybook 설정
├── App.tsx                # 앱 진입점
└── package.json           # 의존성 관리
```

## 🔧 컴포넌트 개발

### 컴포넌트 작성 규칙

#### 1. TypeScript 인터페이스 정의
```typescript
// src/components/UserCard/UserCard.tsx
interface UserCardProps {
  user: User;
  onLike: (userId: string) => void;
  onPass: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onLike,
  onPass,
  onViewProfile
}) => {
  // 컴포넌트 구현
};
```

#### 2. 스타일 정의
```typescript
// src/components/UserCard/UserCard.styles.ts
import { StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 300,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 16,
  },
  name: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  age: {
    ...Typography.body1,
    color: Colors.text.secondary,
  },
});
```

#### 3. 컴포넌트 테스트
```typescript
// src/components/UserCard/__tests__/UserCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UserCard from '../UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: 'user_123',
    name: '김민수',
    age: 28,
    photos: ['photo1.jpg'],
  };

  const mockProps = {
    user: mockUser,
    onLike: jest.fn(),
    onPass: jest.fn(),
    onViewProfile: jest.fn(),
  };

  it('사용자 정보를 올바르게 표시한다', () => {
    const { getByText } = render(<UserCard {...mockProps} />);
    expect(getByText('김민수')).toBeTruthy();
    expect(getByText('28')).toBeTruthy();
  });

  it('좋아요 버튼 클릭 시 콜백이 호출된다', () => {
    const { getByTestId } = render(<UserCard {...mockProps} />);
    fireEvent.press(getByTestId('like-button'));
    expect(mockProps.onLike).toHaveBeenCalledWith('user_123');
  });
});
```

### 컴포넌트 라이브러리

#### 공통 컴포넌트
```typescript
// src/components/common/Button/Button.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], styles[size]]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
```

## 🔄 상태 관리

### Context API 사용

#### 1. 인증 상태 관리
```typescript
// src/store/AuthContext.tsx
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authService.login(email, password);
      
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. 사용자 프로필 상태 관리
```typescript
// src/store/ProfileContext.tsx
interface ProfileState {
  profile: Profile | null;
  preferences: Preferences | null;
  isLoading: boolean;
}

interface ProfileContextType extends ProfileState {
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  updatePreferences: (preferences: Partial<Preferences>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    preferences: null,
    isLoading: false,
  });

  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const updatedProfile = await userService.updateProfile(profileData);
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return (
    <ProfileContext.Provider value={{ ...state, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
```

## 🧭 네비게이션

### 네비게이션 구조
```typescript
// src/navigation/RootNavigator.tsx
const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // 인증되지 않은 사용자
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        // 인증된 사용자
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="UserDetail" component={UserDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
```

### 탭 네비게이션
```typescript
// src/navigation/MainTabNavigator.tsx
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Matches':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
```

## 🌐 API 연동

### API 클라이언트 설정
```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃
      await AsyncStorage.removeItem('authToken');
      // 로그인 화면으로 리다이렉트
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 서비스 레이어
```typescript
// src/services/authService.ts
import apiClient from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }
}

export default new AuthService();
```

## 🧪 테스트

### 단위 테스트
```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('버튼 클릭 시 onPress가 호출된다', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="테스트 버튼" onPress={onPress} />
    );
    
    fireEvent.press(getByText('테스트 버튼'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태일 때 클릭이 비활성화된다', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="테스트 버튼" onPress={onPress} disabled />
    );
    
    fireEvent.press(getByText('테스트 버튼'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 통합 테스트
```typescript
// src/screens/__tests__/LoginScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../../store/AuthContext';
import LoginScreen from '../LoginScreen';

describe('LoginScreen', () => {
  it('로그인 성공 시 메인 화면으로 이동한다', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    fireEvent.changeText(getByPlaceholderText('이메일'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('비밀번호'), 'password123');
    fireEvent.press(getByText('로그인'));

    await waitFor(() => {
      // 메인 화면으로 이동 확인
    });
  });
});
```

### E2E 테스트
```typescript
// e2e/login.test.ts
describe('Login Flow', () => {
  it('should login successfully', async () => {
    await device.launchApp();
    
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('main-screen'))).toBeVisible();
  });
});
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

### EAS Build 설정
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

## ⚡ 성능 최적화

### 이미지 최적화
```typescript
// src/components/OptimizedImage.tsx
import { Image } from 'expo-image';

const OptimizedImage: React.FC<{ uri: string; style: any }> = ({ uri, style }) => {
  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
};
```

### 리스트 최적화
```typescript
// src/components/VirtualizedList.tsx
import { FlatList } from 'react-native';

const VirtualizedList: React.FC<{ data: any[] }> = ({ data }) => {
  const renderItem = useCallback(({ item }) => (
    <ListItem item={item} />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={5}
    />
  );
};
```

## 🐛 트러블슈팅

### 일반적인 문제들

#### 1. Metro 번들러 오류
```bash
# 캐시 클리어
npx expo start --clear

# node_modules 재설치
rm -rf node_modules
npm install
```

#### 2. iOS 빌드 오류
```bash
# iOS 캐시 클리어
cd ios && rm -rf build && cd ..

# Pod 재설치
cd ios && pod install && cd ..
```

#### 3. Android 빌드 오류
```bash
# Android 캐시 클리어
cd android && ./gradlew clean && cd ..

# Gradle 캐시 클리어
rm -rf ~/.gradle/caches
```

#### 4. 네비게이션 오류
```typescript
// 네비게이션 타입 정의 확인
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Home: undefined;
      Profile: { userId: string };
      Settings: undefined;
    }
  }
}
```

### 디버깅 팁
1. **React Native Debugger** 사용
2. **Flipper** 플러그인 활용
3. **Performance Monitor** 활성화
4. **Network Inspector** 사용

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0 