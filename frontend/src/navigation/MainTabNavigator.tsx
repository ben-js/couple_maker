import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
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
        tabBarLabelStyle: { fontSize: 10, marginTop: 0, marginBottom: 4 },
        tabBarStyle: {
          height: 48 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: 'home' | 'star' | 'mail' | 'file-text' | 'menu' = 'home';
          let useFontAwesome = false;
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Tips':
              iconName = 'star';
              break;
            case 'Cards':
              iconName = 'mail';
              break;
            case 'Reviews':
              iconName = 'file-text';
              useFontAwesome = true;
              break;
            case 'Menu':
              iconName = 'menu';
              break;
            default:
              iconName = 'home';
          }
          
          if (useFontAwesome) {
            return <FontAwesome5 name="history" size={24} color={color} style={{ marginBottom: 0 }} />;
          }
          return <Feather name={iconName} size={24} color={color} style={{ marginBottom: 0 }} />;
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