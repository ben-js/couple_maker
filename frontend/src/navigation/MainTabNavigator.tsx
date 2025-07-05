import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons';
import MainScreen from '../screens/MainScreen';
import TipsScreen from '../screens/TipsScreen';
import CardsScreen from '../screens/CardsScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import MenuScreen from '../screens/MenuScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: { fontSize: 11, marginTop: 0, marginBottom: 6 },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 0,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = '';
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Tips':
              iconName = 'star';
              break;
            case 'Cards':
              iconName = 'envelope';
              break;
            case 'Reviews':
              iconName = 'file-text';
              break;
            case 'Menu':
              iconName = 'bars';
              break;
            default:
              iconName = 'home';
          }
          return <FontAwesome name={iconName} size={24} color={color} style={{ marginBottom: 0 }} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={MainScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Tips" component={TipsScreen} options={{ title: '소개팅팁' }} />
      <Tab.Screen name="Cards" component={CardsScreen} options={{ title: '카드함' }} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} options={{ title: '후기' }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ title: '메뉴' }} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 