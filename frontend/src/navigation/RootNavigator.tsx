import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/store/AuthContext';
import { RootStackParamList } from '@/types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAVIGATION_ROUTES } from '@/constants';
import { ActivityIndicator } from 'react-native';

// 화면 컴포넌트들
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileEditScreen from '@/screens/ProfileEditScreen';
import PreferenceEditScreen from '@/screens/PreferenceEditScreen';
import UserDetailScreen from '@/screens/UserDetailScreen';
import TermsScreen from '../screens/TermsScreen';
import PointChargeScreen from '@/screens/PointChargeScreen';
import ReviewWriteScreen from '@/screens/ReviewWriteScreen';
import ContactDetailScreen from '../screens/ContactDetailScreen';
import HistoryDetailScreen from '../screens/HistoryDetailScreen';
import SignupScreen from '../screens/SignupScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // 온보딩을 이미 본 사용자는 바로 로그인으로 이동 (네비게이션은 각 화면에서 처리)
  // useEffect(() => {
  //   if (showLoading || isOnboardingShown === null) return;
  //   if (isOnboardingShown) {
  //     navigation.navigate(NAVIGATION_ROUTES.LOGIN);
  //   }
  // }, [showLoading, isOnboardingShown, navigation]);

  // 인증된 사용자의 이메일 인증 상태 확인 (네비게이션은 각 화면에서 처리)
  // useEffect(() => {
  //   if (isAuthenticated && user && !user.isVerified && user.email) {
  //     // 이메일 인증이 완료되지 않은 사용자는 이메일 인증 화면으로 이동
  //     navigation.navigate(NAVIGATION_ROUTES.EMAIL_VERIFICATION, { email: user.email });
  //   }
  // }, [isAuthenticated, user, navigation]);

  if (showLoading || isOnboardingShown === null) {
    return (
      <ActivityIndicator
        size="large"
        color="#3897F0"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isOnboardingShown ? (NAVIGATION_ROUTES.LOGIN as keyof RootStackParamList) : (NAVIGATION_ROUTES.ONBOARDING as keyof RootStackParamList)}>
      <Stack.Screen name={NAVIGATION_ROUTES.ONBOARDING}>
        {props => <OnboardingScreen {...props} onStart={handleOnboardingDone} />}
      </Stack.Screen>
      <Stack.Screen name={NAVIGATION_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.MAIN} component={MainTabNavigator} />
      <Stack.Screen name={NAVIGATION_ROUTES.PROFILE_EDIT} component={ProfileEditScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.PREFERENCE_EDIT} component={PreferenceEditScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.USER_DETAIL} component={UserDetailScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.POINT_CHARGE} component={PointChargeScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.REVIEW_WRITE} component={ReviewWriteScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.CONTACT_DETAIL} component={ContactDetailScreen} options={{ title: '연락처 상세' }} />
      <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.SIGNUP} component={SignupScreen} />
      <Stack.Screen name={NAVIGATION_ROUTES.EMAIL_VERIFICATION} component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator; 