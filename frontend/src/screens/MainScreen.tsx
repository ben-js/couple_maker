import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Image, ActivityIndicator, ToastAndroid, Alert, Platform } from 'react-native';
import { View, Card, Text, Button, Avatar, TouchableOpacity } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { NAVIGATION_ROUTES, colors, typography, spacing } from '@/constants';
import { useUserProfile } from '../hooks/useUserProfile';
import { apiGet } from '@/utils/apiUtils';
import PrimaryButton from '../components/PrimaryButton';
import StepProgressBar from '../components/StepProgressBar';

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { getProfilePhoto, getUserDisplayName, getUserInitial } = useUserProfile();

  // 메인 프로필 카드 API 연동
  const [mainCard, setMainCard] = useState<any>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    setLoadingCard(true);
    apiGet('/main-card', { userId: user.userId })
      .then(setMainCard)
      .catch(e => setCardError(e.message || '프로필 카드를 불러오지 못했습니다.'))
      .finally(() => setLoadingCard(false));
  }, [user?.userId]);

  // 매칭 상태 (예시 데이터)
  const matchingStatus = {
    currentStep: -1, // -1: 신청 안함, 0: 신청완료, 1: 매칭 중, 2: 일정 조율, 3: 소개팅 예정
    steps: ['신청완료', '매칭 중', '일정 조율', '소개팅 예정']
  };

  // KST 기준 오늘 날짜 0시 (타임존 보정)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const todayKST = new Date(utc + 9 * 60 * 60 * 1000);
  todayKST.setHours(0, 0, 0, 0); // 0시로 강제

  // 소개팅 날짜 예시 (KST 9시)
  const meetingDate = new Date('2025-07-09T09:00:00+09:00');
  meetingDate.setHours(0, 0, 0, 0); // 0시로 강제

  // D-day 계산
  const diffTime = meetingDate.getTime() - todayKST.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let ddayText = '';
  if (diffDays > 0) {
    ddayText = `D-${diffDays}`;
  } else if (diffDays === 0) {
    ddayText = 'D-day';
  } // 이미 지난 경우는 빈 문자열 유지

  // 소개팅 사진 공개 여부 (정책 적용)
  const isPhotoOpen = matchingStatus.currentStep === 3 && todayKST.getTime() >= meetingDate.getTime();

 // 매칭 단계별 고객 안내 문구
  const matchingStepDescriptions = [
    '신청이 완료되었어요.\n매칭 소식을 곧 알려드릴게요!',
    '매칭이 진행 중이에요.\n잠시만 기다려주세요!',
    '매칭 성공!\n일정 조율 중이에요.',
    isPhotoOpen
      ? `${ddayText ? ddayText + '\n' : ''}프로필이 공개되었습니다!`
      : `${ddayText ? ddayText + '\n' : ''}소개팅이 곧 시작돼요.\n당일 오전 9시에 프로필이 공개됩니다.`,
  ];

  /*
   [매칭 상태(currentStep) 값 의미 - flow.md 기준]
   0: '신청완료'      // 사용자가 소개팅 신청만 한 상태 (아직 매칭 시작 전)
   1: '매칭 중'        // 매칭 상대를 찾는 중 (아직 상대 확정 전)
   2: '일정 조율'      // 매칭이 성사되어 일정 조율 중 (프로필 카드 도착 가능)
   3: '소개팅 예정'    // 소개팅 일정 확정, 당일(사진 공개 등)
   ※ 2, 3에서만 프로필 카드 도착/공개 가능, 0~1에서는 프로필 카드 없음
  */

  // 소개팅 신청 여부 (임시)
  const isRequested = true; // true면 매칭 상태/프로필 카드만, false면 CTA만

  const handleCtaPress = () => {
    if (typeof user.points !== 'number' || user.points <= 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('포인트가 부족합니다. 충전하기로 이동합니다.', ToastAndroid.SHORT);
      } else {
        Alert.alert('포인트가 부족합니다. 충전하기로 이동합니다.');
      }
      navigation.navigate(NAVIGATION_ROUTES.POINT_CHARGE);
      return;
    }
    navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT, { mode: 'apply' });
  };

  const renderMatchingProgress = () => {
    return (
      <View style={styles.matchingProgressContainer}>
        <Text style={styles.matchingProgressTitle}>매칭 진행 상황</Text>
        <Text style={styles.matchingProgressDesc}>{matchingStepDescriptions[matchingStatus.currentStep]}</Text>
        <StepProgressBar
          total={4}
          current={matchingStatus.currentStep}
          labels={['신청완료', '매칭 중', '일정 조율', '소개팅 예정']}
        />
      </View>
    );
  };

  const renderProfileCard = () => {
    if (loadingCard) {
      return <View flex center style={{ minHeight: 180 }}><ActivityIndicator size="large" color={colors.text.primary} /></View>;
    }
    if (cardError) {
      return <View flex center style={{ minHeight: 180 }}><Text>{cardError}</Text></View>;
    }
    if (!mainCard) {
      return <View flex center style={{ minHeight: 180 }}><Text>도착한 프로필 카드가 없습니다.</Text></View>;
    }
    return (
      <Card enableShadow style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.profileCardTitle, { textAlign: 'center' }]}>프로필 카드가 도착했어요!</Text>
            <Feather name="mail" size={24} color={colors.text.primary} style={{ marginLeft: 8, marginTop: 2 }} />
          </View>
        </View>
        <View style={styles.profileCardContent}>
            <View style={[styles.blurredImage, { justifyContent: 'center', alignItems: 'center' }]}> 
              <Feather name={isPhotoOpen ? 'unlock' : 'lock'} size={40} color={colors.accent} />
            </View>
          <Text style={styles.profileCardDesc}>{mainCard.name}님의 프로필이 도착했습니다.</Text>
          <PrimaryButton
            title="지금 확인하러 가기"
            onPress={() => navigation.navigate(NAVIGATION_ROUTES.USER_DETAIL, { userId: mainCard.userId })}
            style={{ marginTop: 12, minWidth: 140, height: 40, alignSelf: 'center' }}
          />
        </View>
      </Card>
    );
  };
  
  const renderCtaCard = () => {
    return (
      <TouchableOpacity onPress={handleCtaPress} activeOpacity={0.85} style={{ width: '100%' }}>
        <Card enableShadow style={[styles.profileCard, { minHeight: 180, justifyContent: 'center', alignItems: 'center' }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.profileCardTitle, { textAlign: 'center', flex: 0 }]}>지금 소개팅 신청하기</Text>
            <Feather name="edit-3" size={24} color={colors.text.primary} style={{ marginLeft: 8 }} />
          </View>
          <Text style={[styles.ctaButtonSubtext, { textAlign: 'center', alignSelf: 'center', marginTop: 8 }]}>AI + 매니저가 어울리는 상대를 찾아드려요!</Text>
        </Card>
      </TouchableOpacity>
    );
  };
  const showCtaCard = matchingStatus.currentStep === -1 || !isRequested;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {getProfilePhoto() ? (
            <Image 
              source={{ uri: getProfilePhoto() }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Avatar 
              size={44} 
              label={getUserInitial()} 
              backgroundColor={colors.primary} 
              labelColor={colors.surface}
            />
          )}
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>{getUserDisplayName()}</Text>
            <Text style={styles.pointsText}>보유 포인트: {typeof user.points === 'number' ? user.points : 0}P</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <PrimaryButton
            title="충전하기"
            onPress={() => {/* 충전 로직 또는 네비게이션 */}}
            style={{ minWidth: 80, height: 36, marginRight: 8, paddingHorizontal: 16, paddingVertical: 0 }}
          />
          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={28} color={colors.text.primary} style={{ opacity: 0.9 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 소개팅 신청 CTA: 신청 전(currentStep -1) 또는 isRequested false일 때만 */}
      {showCtaCard && renderCtaCard()}

      {/* 매칭 상태 뷰/프로필 카드: 신청 이후(currentStep >= 0) */}
      {!showCtaCard && renderMatchingProgress()}
      {!showCtaCard && (matchingStatus.currentStep === 2 || matchingStatus.currentStep === 3) && mainCard && renderProfileCard()}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: spacing.md,
  },
  welcomeTitle: {
    ...typography.title,
    marginBottom: 2,
  },
  pointsText: {
    ...typography.caption,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chargeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  chargeButtonText: {
    ...typography.button,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor, border, shadow 등 배경/테두리/그림자 제거
  },
  ctaButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg + 4,
    borderRadius: spacing.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...typography.button,
    marginBottom: 4,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  ctaButtonSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    opacity: 0.9,
  },
  progressContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  progressTitle: {
    ...typography.title,
    marginBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotInactive: {
    backgroundColor: colors.border,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  progressTextInactive: {
    color: colors.border,
  },
  progressLine: {
    position: 'absolute',
    top: 12,
    left: '50%',
    width: '100%',
    height: 2,
    zIndex: -1,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  progressLineInactive: {
    backgroundColor: colors.border,
  },
  progressSubtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg + 4,
    borderRadius: spacing.lg,
    backgroundColor: colors.background, // 완전 흰색 배경
    minHeight: 180,
    textAlign: 'center',
  },
  profileCardHeader: {
    marginBottom: spacing.md,
  },
  profileCardTitle: {
    ...typography.title,
  },
  profileCardContent: {
    alignItems: 'center',
  },
  blurredImage: {
    marginBottom: spacing.md,
  },
  profileCardDesc: {
    ...typography.caption,
    textAlign: 'center',
  },
  profileCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  profileCardButtonText: {
    ...typography.button,
  },
  tipsContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.title,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  tipsScroll: {
    paddingHorizontal: 24,
  },
  tipCard: {
    width: 120,
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    marginRight: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIcon: {
    marginBottom: 8,
  },
  tipTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipSubtitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg + 4,
    borderRadius: 16,
    backgroundColor: colors.surface,
    minHeight: 180,
  },
  statsContent: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    marginBottom: 8,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValueText: {
    ...typography.body,
    fontWeight: '600',
  },
  statSubtext: {
    ...typography.caption,
    marginLeft: 8,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  matchingProgressContainer: {
    backgroundColor: '#F8FBFF', // 연한 파랑
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24, // profileCard와 동일하게 좌우 마진 적용
    minHeight: 180,
  },
  matchingProgressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
  },
  matchingProgressDesc: {
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default MainScreen; 