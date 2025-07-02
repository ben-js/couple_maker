import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/store/AuthContext';
import { RootStackParamList } from '@/types';

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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // 인증되지 않은 사용자
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      ) : !user?.isProfileComplete ? (
        // 프로필이 완성되지 않은 사용자
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      ) : (
        // 인증되고 프로필이 완성된 사용자
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="ProfileEdit" 
            component={ProfileEditScreen}
            options={{
              headerShown: true,
              title: '프로필 수정',
            }}
          />
          <Stack.Screen 
            name="UserDetail" 
            component={UserDetailScreen}
            options={{
              headerShown: true,
              title: '프로필',
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{
              headerShown: true,
              title: '채팅',
            }}
          />
          <Stack.Screen 
            name="Filter" 
            component={FilterScreen}
            options={{
              headerShown: true,
              title: '필터',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: '설정',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator; 