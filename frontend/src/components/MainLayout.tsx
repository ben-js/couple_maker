import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, RefreshControl } from 'react-native';
import ProfileHeader from './ProfileHeader';

interface MainLayoutProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  useScrollView?: boolean; // FlatList 사용 시 false로 설정
}

const onChargePress = () => {};

/**
 * MainLayout - 메인 화면용 레이아웃
 * ProfileHeader + ScrollView + 새로고침 기능
 * Main, Insight, Reviews, Reward, Menu 화면에서 사용
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  containerStyle,
  contentStyle,
  onRefresh,
  refreshing,
  useScrollView = true, // 기본값은 true
}) => (
  <View style={[styles.container, containerStyle]}>
    <ProfileHeader onChargePress={onChargePress} />
    {useScrollView ? (
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        refreshControl={onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined}
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { 
    flexGrow: 1, 
    paddingBottom: 10,
    width: '90%', // 90% 너비 직접 적용
    alignSelf: 'center' // 중앙 정렬
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
  },
});

export default MainLayout; 