import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/store/AuthContext';
import { RootStackParamList } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// 화면 컴포넌트들
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '@/screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileSetupScreen from '@/screens/ProfileSetupScreen';
import ProfileEditScreen from '@/screens/ProfileEditScreen';
import PreferenceSetupScreen from '@/screens/PreferenceSetupScreen';
import UserDetailScreen from '@/screens/UserDetailScreen';
import ChatScreen from '@/screens/ChatScreen';
import FilterScreen from '@/screens/FilterScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import LoadingScreen from '@/screens/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigation = useNavigation<any>();
  const [isOnboardingShown, setIsOnboardingShown] = React.useState<boolean | null>(null);
  const [showLoading, setShowLoading] = React.useState(true);

  // 0.5초만 로딩 화면 노출
  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // 온보딩 노출 여부 체크 (최초 1회만)
  useEffect(() => {
    (async () => {
      const shown = await AsyncStorage.getItem('onboarding_shown');
      setIsOnboardingShown(shown === 'true');
    })();
  }, []);

  // 온보딩 완료 콜백
  const handleOnboardingDone = React.useCallback(() => {
    AsyncStorage.setItem('onboarding_shown', 'true');
    setIsOnboardingShown(true);
  }, []);

  // 온보딩을 이미 본 사용자는 바로 로그인으로
  useEffect(() => {
    if (showLoading || isOnboardingShown === null) return;
    if (isOnboardingShown) {
      navigation.navigate('Login');
    }
  }, [showLoading, isOnboardingShown, navigation]);

  if (showLoading || isOnboardingShown === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isOnboardingShown ? ('Login' as keyof RootStackParamList) : ('Onboarding' as keyof RootStackParamList)}>
      <Stack.Screen name="Onboarding">
        {props => <OnboardingScreen {...props} onStart={handleOnboardingDone} />}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={require('@/screens/SignupScreen').default} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: true, title: '프로필 작성' }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: true, title: '프로필 수정' }} />
      <Stack.Screen name="PreferenceSetupScreen" component={PreferenceSetupScreen} options={{ headerShown: true, title: '이상형 설정' }} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ headerShown: true, title: '프로필' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: '채팅' }} />
      <Stack.Screen name="Filter" component={FilterScreen} options={{ headerShown: true, title: '필터' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: '설정' }} />
    </Stack.Navigator>
  );
};

export default RootNavigator; 