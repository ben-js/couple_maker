import React, { useEffect } from 'react';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/store/AuthContext';
import { RootStackParamList } from '@/types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NAVIGATION_ROUTES, NAVIGATION_OPTIONS } from '@/constants';

// 화면 컴포넌트들
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileEditScreen from '@/screens/ProfileEditScreen';
import PreferenceEditScreen from '@/screens/PreferenceEditScreen';
import UserDetailScreen from '@/screens/UserDetailScreen';
import ChatScreen from '@/screens/ChatScreen';
import FilterScreen from '@/screens/FilterScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import LoadingScreen from '@/screens/LoadingScreen';
import SignupScreen from '@/screens/SignupScreen';
import TermsScreen from '../screens/TermsScreen';
import PointChargeScreen from '@/screens/PointChargeScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
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
      navigation.navigate(NAVIGATION_ROUTES.LOGIN);
    }
  }, [showLoading, isOnboardingShown, navigation]);

  if (showLoading || isOnboardingShown === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isOnboardingShown ? (NAVIGATION_ROUTES.LOGIN as keyof RootStackParamList) : (NAVIGATION_ROUTES.ONBOARDING as keyof RootStackParamList)}>
      <Stack.Screen name={NAVIGATION_ROUTES.ONBOARDING}>
        {props => <OnboardingScreen {...props} onStart={handleOnboardingDone} />}
      </Stack.Screen>
      <Stack.Screen name={NAVIGATION_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.SIGNUP} component={SignupScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.MAIN} component={MainTabNavigator} />
      <Stack.Screen name={NAVIGATION_ROUTES.PROFILE_EDIT} component={ProfileEditScreen} options={NAVIGATION_OPTIONS.PROFILE_EDIT} />
      <Stack.Screen name={NAVIGATION_ROUTES.PREFERENCE_EDIT} component={PreferenceEditScreen} options={NAVIGATION_OPTIONS.PREFERENCE_EDIT} />
      <Stack.Screen name={NAVIGATION_ROUTES.USER_DETAIL} component={UserDetailScreen} options={NAVIGATION_OPTIONS.USER_DETAIL} />
      <Stack.Screen name={NAVIGATION_ROUTES.CHAT} component={ChatScreen} options={NAVIGATION_OPTIONS.CHAT} />
      <Stack.Screen name={NAVIGATION_ROUTES.FILTER} component={FilterScreen} options={NAVIGATION_OPTIONS.FILTER} />
      <Stack.Screen name={NAVIGATION_ROUTES.SETTINGS} component={SettingsScreen} options={NAVIGATION_OPTIONS.SETTINGS} />
      <Stack.Screen name={NAVIGATION_ROUTES.POINT_CHARGE} component={PointChargeScreen} options={{ headerShown: true, title: '포인트 충전' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
};

export default RootNavigator; 