import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert, Modal } from 'react-native';
import HeaderLayout from '../components/HeaderLayout';
import { View, Text, TouchableOpacity } from 'react-native-ui-lib';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { NAVIGATION_ROUTES, colors, typography, spacing } from '@/constants';
import { apiGet, apiPost } from '@/utils/apiUtils';
import StepProgressBar from '../components/StepProgressBar';
import regionData from '../data/regions.json';
import CardProfile from '../components/CardProfile';
import CardCTA from '../components/CardCTA';
import CardScheduleChoice from '../components/CardScheduleChoice';
import { useUserStatus, useUserInfo } from '../hooks/useUserStatus';

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuth();
  const { data: statusData, refetch: refetchStatus } = useUserStatus(user?.userId);
  const { data: userInfo, refetch: refetchUser } = useUserInfo(user?.userId);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [otherChoices, setOtherChoices] = useState<{ dates: string[]; locations: string[] } | null>(null);
  const [dateSelections, setDateSelections] = useState<(string|null)[]>([null, null, null]);
  const [showDatePickerIdx, setShowDatePickerIdx] = useState<number|null>(null);
  const [locationSelection, setLocationSelection] = useState<string[]>([]);
  const [showDateDuplicateModal, setShowDateDuplicateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStatus(),
        refetchUser(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchStatus, refetchUser]);

  // statusData에서 matchId 추출하여 세팅
  useEffect(() => {
    if (statusData?.matchId) {
      console.log('[매칭 상태] matchId 세팅:', statusData.matchId);
      setMatchId(statusData.matchId);
    } else {
      console.log('[매칭 상태] matchId 없음:', statusData);
      setMatchId(null);
    }
  }, [statusData]);

  // showCtaCard 조건을 status 값만으로 명확하게 처리
  const showCtaCard = !statusData?.status;

  const matchingStepDescriptions: Record<string, string> = {
    waiting: '신청이 완료되었어요.\n매칭 소식을 곧 알려드릴게요!',
    matched: '매칭 성공!\n일정을 선택 해주세요.',
    confirmed: '매칭 확정!\n일정 조율 중이에요.',
    scheduled: '소개팅 일정이 확정됐어요!\n당일 오전 9시에 프로필이 공개됩니다.',
    none: '아직 소개팅 신청을 하지 않았습니다.',
  };

  const statusSteps = ['waiting', 'matched', 'confirmed', 'scheduled'];
  const currentStep = statusData?.status ? statusSteps.indexOf(statusData.status) : -1;

  const renderMatchingProgress = () => (
    <View style={styles.matchingProgressContainer}>
      <View style={styles.matchingProgressCenter}>
        <Text style={styles.matchingProgressTitle}>매칭 진행 상황</Text>
      </View>
      <Text style={styles.matchingProgressDesc}>
        {statusData?.status ? (matchingStepDescriptions[statusData.status] || '') : matchingStepDescriptions.none}
      </Text>
      <StepProgressBar
        total={statusSteps.length}
        current={currentStep}
        labels={['신청완료', '매칭성공', '일정 조율', '소개팅 예정']}
      />
    </View>
  );

  const handleCtaPress = () => {
    if (!user || typeof user.points !== 'number' || user.points < 100) {
      Alert.alert(
        '포인트가 부족합니다',
        '충전하시겠습니까?',
        [
          { text: '아니오', style: 'cancel' },
          { text: '예', onPress: () => navigation.navigate(NAVIGATION_ROUTES.POINT_CHARGE) },
        ]
      );
      return;
    }
    navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT, { isEditMode: true, mode: 'apply' });
  };

  // 일정/장소 바텀시트 확인
  const handleConfirmSchedule = async () => {
    console.log('[일정/장소 저장] 시도', { dateSelections, locationSelection, matchId, userId: user?.userId });
    if (!dateSelections.every(d => d) || locationSelection.length === 0) {
      console.log('[일정/장소 저장] 날짜/장소 미입력');
      return;
    }
    if (!matchId) {
      console.log('[일정/장소 저장] matchId 없음');
      return;
    }
    try {
      const res = await apiPost('/matching-choices', {
        match_id: matchId,
        user_id: user?.userId,
        dates: dateSelections,
        locations: locationSelection,
      });
      console.log('[일정/장소 저장] API 응답', res);
      refetchStatus();
    } catch (e) {
      console.log('[일정/장소 저장] API 에러', e);
      Alert.alert('저장 실패', '일정/장소 저장에 실패했습니다.');
    }
  };

  return (
    <HeaderLayout onRefresh={handleRefresh} refreshing={refreshing}>
      {renderMatchingProgress()}

      {/* 소개팅 신청 CTA: 신청 전(status 없음) */}
      {showCtaCard && (
        <CardCTA
          title="지금 소개팅 신청하기"
          subtitle="AI + 매니저가 어울리는 상대를 찾아드려요!"
          buttonText="신청하기"
          onPress={handleCtaPress}
        />
      )}

      {/* 매칭 상대 카드 도착 시 카드 UI 노출 */}
      {!showCtaCard && (statusData?.status === 'scheduled') && userInfo && (
        <CardProfile
          user={userInfo}
          matchId={matchId || ''}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.USER_DETAIL, { userId: userInfo.userId, matchId })}
        />
      )}

      {/* 일정 선택 UI: status가 matched일 때 */}
      {!showCtaCard && statusData?.status === 'matched' && (
        <CardScheduleChoice
          otherChoices={otherChoices}
          dateSelections={dateSelections}
          setDateSelections={setDateSelections}
          showDatePickerIdx={showDatePickerIdx}
          setShowDatePickerIdx={setShowDatePickerIdx}
          locationSelection={locationSelection}
          setLocationSelection={setLocationSelection}
          regionData={regionData}
          showDateDuplicateModal={showDateDuplicateModal}
          setShowDateDuplicateModal={setShowDateDuplicateModal}
          onConfirm={handleConfirmSchedule}
        />
      )}

      <Modal
        visible={showDateDuplicateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateDuplicateModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', minWidth: 220 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>이미 선택된 날짜입니다</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#222', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 }}
              onPress={() => setShowDateDuplicateModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 20 }} />
    </HeaderLayout>
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
    height: 420,
    textAlign: 'center',
  },
  profileCardHeader: {
    marginBottom: spacing.md,
  },
  profileCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardTitle: {
    ...typography.title,
  },
  profileCardContent: {
    alignItems: 'center',
  },
  profileCardImageCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardMailIcon: {
    marginLeft: 8,
    marginTop: 2,
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
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'transparent',
    elevation: 0,
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
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'transparent',
    elevation: 0,
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
    minHeight: 190,
  },
  matchingProgressCenter: {
    alignItems: 'center',
    width: '100%',
  },
  matchingProgressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  matchingProgressDesc: {
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg + 4,
    borderRadius: spacing.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 1,
    padding: 2,
  },
});

export default MainScreen; 