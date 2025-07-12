import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, Alert, Platform, ToastAndroid, Image } from 'react-native';
import { View, Card, Text, Avatar, TouchableOpacity } from 'react-native-ui-lib';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserInfo } from '../hooks/useUserStatus';
import { useAuth } from '../store/AuthContext';
import { colors, typography } from '@/constants';
import { TOAST_MESSAGES, NAVIGATION_ROUTES, BUTTON_TEXTS } from '@/constants';
import MainLayout from '../components/MainLayout';

const MenuScreen = () => {
  const navigation = useNavigation<any>();
  const auth = useAuth();
  const { user } = auth;
  const { data: userInfo, refetch } = useUserInfo(user?.userId);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  
  // 로그아웃 처리 함수
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: BUTTON_TEXTS.CANCEL,
          style: 'cancel',
        },
        {
          text: BUTTON_TEXTS.LOGOUT,
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.logout();
              if (Platform.OS === 'android') {
                ToastAndroid.show(TOAST_MESSAGES.LOGOUT_SUCCESS, ToastAndroid.SHORT);
              } else {
                Alert.alert(TOAST_MESSAGES.LOGOUT_SUCCESS);
              }
              navigation.reset({
                index: 0,
                routes: [{ name: NAVIGATION_ROUTES.LOGIN }],
              });
            } catch (error) {
              if (Platform.OS === 'android') {
                ToastAndroid.show('로그아웃 중 오류가 발생했습니다.', ToastAndroid.SHORT);
              } else {
                Alert.alert('로그아웃 중 오류가 발생했습니다.');
              }
            }
          },
        },
      ]
    );
  };

  // 후기 통계 데이터
  const reviewStats = {
    mannerLevel: '상',
    recentReviews: 3,
    aiFeedback: '친화력 높음',
    conversationSkill: '말문 안 막힘'
  };

  const renderReviewStats = () => {
    return (
      <Card enableShadow style={styles.statsCard}>
        <Text style={styles.sectionTitle}>나의 매너 레벨</Text>
        <View style={styles.statsContent}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>매너 등급</Text>
              <View style={styles.statValue}>
                <Text style={styles.statValueText}>{reviewStats.mannerLevel}</Text>
                <Text style={styles.statSubtext}>(최근 {reviewStats.recentReviews}회)</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>AI 분석</Text>
              <Text style={styles.statValueText}>{reviewStats.aiFeedback}</Text>
              <Text style={styles.statSubtext}>{reviewStats.conversationSkill}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const menuItems = [
    {
      id: 1,
      title: '프로필 수정',
      subtitle: '내 프로필 수정하기',
      icon: 'user',
      action: () => navigation.navigate(NAVIGATION_ROUTES.PROFILE_EDIT, { isEditMode: true, fromMenu: true })
    },
    {
      id: 2,
      title: '이상형 수정',
      subtitle: '이상형 조건 변경하기',
      icon: 'heart',
      action: () => navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT, { isEditMode: true })
    },
    {
      id: 3,
      title: '포인트 충전',
      subtitle: `현재 보유: ${typeof userInfo?.points === 'number' ? userInfo.points : 0}P`,
      icon: 'credit-card',
      action: () => navigation.navigate(NAVIGATION_ROUTES.POINT_CHARGE)
    },
    {
      id: 4,
      title: '알림 설정',
      subtitle: '푸시 알림 관리',
      icon: 'bell',
      action: () => console.log('알림 설정')
    },
    {
      id: 6,
      title: '이용약관',
      subtitle: '서비스 이용약관',
      icon: 'file-text',
      action: () => navigation.navigate('Terms', { type: 'terms' })
    },
    {
      id: 7,
      title: '개인정보처리방침',
      subtitle: '개인정보 보호정책',
      icon: 'shield',
      action: () => navigation.navigate('Terms', { type: 'privacy' })
    },
    {
      id: 8,
      title: '고객센터 안내',
      subtitle: '문의사항 및 도움말',
      icon: 'help-circle',
      action: () => navigation.navigate('Terms', { type: 'customer' })
    },
    {
      id: 9,
      title: '로그아웃',
      subtitle: '계정에서 로그아웃',
      icon: 'log-out',
      action: handleLogout
    }
  ];

  return (
    <MainLayout onRefresh={handleRefresh} refreshing={refreshing}>
      {/* 메뉴 아이템들 */}
      {menuItems.map(item => {
        let iconComponent;
        if (item.icon === 'log-out') {
          iconComponent = <MaterialIcons name="logout" size={24} color={colors.primary} />;
        } else if (item.icon === 'shield') {
          iconComponent = <FontAwesome5 name="shield-alt" size={24} color={colors.primary} />;
        } else {
          const useFontAwesome = ['credit-card', 'help-circle'].includes(item.icon);
          iconComponent = useFontAwesome
            ? <FontAwesome5 name={item.icon as any} size={24} color={colors.primary} />
            : <Feather name={item.icon as any} size={24} color={colors.primary} />;
        }
        return (
          <TouchableOpacity key={item.id} onPress={item.action}>
            <Card enableShadow style={styles.menuCard}>
              <View style={styles.menuItem}>
                <View style={styles.menuIcon}>
                  {iconComponent}
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.text.disabled} style={{ marginLeft: 8 }} />
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
      
      <View style={{ height: 100 }} />
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  userCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  userEmail: {
    ...typography.caption,
    color: colors.text.disabled,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 0,
  },
  menuCard: {
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    ...typography.caption,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  statsCard: {
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    minHeight: 180,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: 12,
    color: colors.text.primary,
  },
  statsContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValueText: {
    ...typography.title,
    color: colors.text.primary,
    marginRight: 4,
  },
  statSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});

export default MenuScreen; 