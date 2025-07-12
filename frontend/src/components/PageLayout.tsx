import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { colors } from '@/constants';
import { Header } from './Header';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  showVerticalScrollIndicator?: boolean;
  contentContainerStyle?: any;
}

/**
 * PageLayout - 상세 페이지용 레이아웃
 * Header(뒤로가기) + ScrollView + 90% 너비 자동 적용
 * UserDetail, PointCharge, Terms, ProfileEdit, PreferenceEdit 등에서 사용
 */
const PageLayout: React.FC<PageLayoutProps> = ({ 
  title, 
  children, 
  showVerticalScrollIndicator = false,
  contentContainerStyle
}) => {
  return (
    <>
      {/* 고정 헤더 */}
      <Header title={title} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={showVerticalScrollIndicator}
      >
        {children}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background
  },
  contentContainer: {
    width: '90%',
    alignSelf: 'center', 
    paddingBottom: 16
  },
});

export default PageLayout; 