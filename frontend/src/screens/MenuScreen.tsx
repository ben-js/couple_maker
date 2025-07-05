import React from 'react';
import { StyleSheet, ScrollView, Alert, Platform, ToastAndroid, Image } from 'react-native';
import { View, Card, Text, Icon, Avatar, TouchableOpacity } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { colors, typography } from '@/constants';
import { TOAST_MESSAGES, NAVIGATION_ROUTES, BUTTON_TEXTS } from '@/constants';
import { useUserProfile } from '../hooks/useUserProfile';

const MenuScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const { getProfilePhoto, getUserDisplayName, getUserInitial } = useUserProfile();
  
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
              await logout();
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

  const menuItems = [
    {
      id: 1,
      title: '프로필 수정',
      subtitle: '내 프로필 수정하기',
      icon: 'user',
      action: () => navigation.navigate(NAVIGATION_ROUTES.PROFILE_EDIT, { isEditMode: true })
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
      subtitle: `현재 보유: ${user?.points || 120}P`,
      icon: 'credit-card',
      action: () => console.log('포인트 충전')
    },
    {
      id: 4,
      title: '알림 설정',
      subtitle: '푸시 알림 관리',
      icon: 'bell',
      action: () => console.log('알림 설정')
    },
    {
      id: 5,
      title: '고객센터',
      subtitle: '문의사항 및 도움말',
      icon: 'help-circle',
      action: () => console.log('고객센터')
    },
    {
      id: 6,
      title: '이용약관',
      subtitle: '서비스 이용약관',
      icon: 'file-text',
      action: () => console.log('이용약관')
    },
    {
      id: 7,
      title: '개인정보처리방침',
      subtitle: '개인정보 보호정책',
      icon: 'shield',
      action: () => console.log('개인정보처리방침')
    },
    {
      id: 8,
      title: '로그아웃',
      subtitle: '계정에서 로그아웃',
      icon: 'log-out',
      action: handleLogout
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 사용자 정보 카드 */}
      <Card enableShadow style={styles.userCard}>
        <View style={styles.userInfo}>
          {getProfilePhoto() ? (
            <Image 
              source={{ uri: getProfilePhoto() }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Avatar 
              size={60} 
              label={getUserInitial()} 
              backgroundColor={colors.primary} 
              labelColor={colors.surface}
            />
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {getUserDisplayName()}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'user@example.com'}
            </Text>
            <View style={styles.pointsContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.pointsText}>
                {user?.points || 120}P
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* 메뉴 아이템들 */}
      {menuItems.map(item => (
        <TouchableOpacity key={item.id} onPress={item.action}>
          <Card enableShadow style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Icon name={item.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.text.disabled} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
      
      <View style={{ height: 100 }} />
    </ScrollView>
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
    marginLeft: 16,
  },
  userName: {
    ...typography.h3,
    marginBottom: 4,
  },
  userEmail: {
    ...typography.bodySmall,
    color: colors.text.disabled,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
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
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
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
    ...typography.small,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default MenuScreen; 