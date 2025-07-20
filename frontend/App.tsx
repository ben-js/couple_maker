import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { Colors, ThemeManager } from 'react-native-ui-lib';
import { View, Text } from 'react-native';

// 네비게이션 설정
import RootNavigator from '@/navigation/RootNavigator';

// 상태 관리
import { AuthProvider } from '@/store/AuthContext';
import { ProfileProvider } from '@/store/ProfileContext';

// 데이터베이스 초기화
import { initDatabase } from '@/db/user';

// 테마 설정
Colors.loadColors({
  primary: '#FF6B9D',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E9ECEF',
  error: '#E74C3C',
  success: '#27AE60',
  warning: '#F39C12',
  info: '#3498DB',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#95A5A6',
  lightGray: '#ECF0F1',
  darkGray: '#34495E',
  pink: '#FF6B9D',
  purple: '#9B59B6',
  blue: '#3498DB',
  green: '#2ECC71',
  yellow: '#F1C40F',
  orange: '#E67E22',
  red: '#E74C3C'
});

ThemeManager.setComponentTheme('Text', {
  textColor: Colors.text
});

ThemeManager.setComponentTheme('Button', {
  backgroundColor: Colors.primary,
  labelColor: Colors.white
});

ThemeManager.setComponentTheme('Card', {
  backgroundColor: Colors.white,
  borderRadius: 12,
  shadowColor: Colors.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();



export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        setIsReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsReady(true); // 에러가 있어도 앱은 시작
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>앱을 시작하는 중...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ProfileProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <RootNavigator />
              </NavigationContainer>
            </ProfileProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
} 