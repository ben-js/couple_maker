import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useNavigationState } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  // 현재 라우트 정보 확인
  // 인증된 사용자만 접근하도록 별도 분기 필요 (RootNavigator에서 이미 분기됨)
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home':
              return <Ionicons name="home" size={size} color={color} />;
            case 'Profile':
              return <Ionicons name="person-circle" size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '마이페이지' }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 