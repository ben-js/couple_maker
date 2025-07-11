import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import MainScreen from '../screens/MainScreen';
import InsightScreen from '../screens/InsightScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RewardScreen from '../screens/RewardScreen';
import MenuScreen from '../screens/MenuScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Main"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // 라벨 숨김
        tabBarActiveTintColor: '#262626', // 진한 검정
        tabBarInactiveTintColor: '#8E8E8E', // 연한 회색
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.2,
          borderTopColor: '#efefef',
          elevation: 0, // 그림자 제거
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: string = 'home';
          let useFontAwesome = false;
          switch (route.name) {
            case 'Main':
              iconName = 'home';
              break;
            case 'Insight':
              iconName = 'bar-chart-2';
              break;
            case 'History':
              iconName = 'clock';
              break;
            case 'Reward':
              iconName = 'gift';
              break;
            case 'Menu':
              iconName = 'menu';
              break;
            default:
              iconName = 'home';
          }
          return <Feather name={iconName as any} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Main" component={MainScreen} options={{ title: '메인인' }} />
      <Tab.Screen name="Insight" component={InsightScreen} options={{ title: '인사이트' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: '히스토리' }} />
      <Tab.Screen name="Reward" component={RewardScreen} options={{ title: '리워드' }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: '메뉴' }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 