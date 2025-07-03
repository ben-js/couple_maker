import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/store/AuthContext';
import { RootStackParamList } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import { getUserPreferences } from '../services/userPreferencesService';
import { createOnboardingTable, getOnboardingShown } from '../db/user';

// 화면 컴포넌트들
import OnboardingScreen from '@/screens/OnboardingScreen';
import AuthScreen from '@/screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileSetupScreen from '@/screens/ProfileSetupScreen';
import ProfileEditScreen from '@/screens/ProfileEditScreen';
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
  const { preferences, setPreferences } = useUserPreferencesStore();
  const [prefsChecked, setPrefsChecked] = React.useState(false);

  React.useEffect(() => {
    createOnboardingTable();
    setIsOnboardingShown(getOnboardingShown());
  }, []);

  // 인증된 유저라면 이상형 프로필 유무 확인
  useEffect(() => {
    const checkPrefs = async () => {
      if (isAuthenticated && user?.id) {
        const prefs = await getUserPreferences(user.id);
        if (prefs) setPreferences(prefs);
        setPrefsChecked(true);
      } else {
        setPrefsChecked(true);
      }
    };
    if (isAuthenticated && user?.id && !prefsChecked) {
      checkPrefs();
    }
  }, [isAuthenticated, user, setPreferences, prefsChecked]);

  useEffect(() => {
    if (isLoading || isOnboardingShown === null || (isAuthenticated && !prefsChecked)) return;
    if (!isOnboardingShown) {
      navigation.navigate('Onboarding');
    } else if (!isAuthenticated) {
      navigation.navigate('Auth');
    } else if (isAuthenticated && user?.id) {
      if (!preferences || !preferences.user_id) {
        navigation.navigate('ProfileSetup', { user_id: user.id, isFirst: true });
      } else {
        navigation.navigate('Main');
      }
    }
  }, [isLoading, isOnboardingShown, isAuthenticated, navigation, preferences, user, prefsChecked]);

  if (isLoading || isOnboardingShown === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Signup" component={require('@/screens/SignupScreen').default} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: true, title: '프로필 작성' }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: true, title: '프로필 수정' }} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ headerShown: true, title: '프로필' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: '채팅' }} />
      <Stack.Screen name="Filter" component={FilterScreen} options={{ headerShown: true, title: '필터' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: '설정' }} />
    </Stack.Navigator>
  );
};

export default RootNavigator; 