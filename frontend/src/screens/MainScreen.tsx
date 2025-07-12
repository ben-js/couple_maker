import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Alert, Modal } from 'react-native';
import MainLayout from '../components/MainLayout';
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
import CardReview from '../components/CardReview';
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
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMatchId, setProposalMatchId] = useState<string | null>(null);
  
  // 디버깅용: 모달 상태 로그
  useEffect(() => {
    console.log('[매니저 제안] 모달 상태 변경:', { showProposalModal, proposalMatchId });
  }, [showProposalModal, proposalMatchId]);
  const [refreshing, setRefreshing] = useState(false);

  // 소개팅 완료 후 2시간이 지났는지 확인
  const isDatePassed = useMemo(() => {
    console.log('[MainScreen] finalDate 확인:', statusData?.finalDate);
    if (!statusData?.finalDate) return false;
    const finalDate = new Date(statusData.finalDate);
    const twoHoursLater = new Date(finalDate.getTime() + 2 * 60 * 60 * 1000); // 2시간 후
    const now = new Date();
    const isPassed = now > twoHoursLater;
    console.log('[MainScreen] 날짜 계산:', {
      finalDate: finalDate.toISOString(),
      twoHoursLater: twoHoursLater.toISOString(),
      now: now.toISOString(),
      isPassed
    });
    return isPassed;
  }, [statusData?.finalDate]);

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

  // 매칭 제안 확인 및 상태 자동 처리
  useEffect(() => {
    const checkProposalAndStatus = async () => {
      if (!user?.userId) return;
      
      try {
        // 매칭 상태 자동 처리 API 호출 (백그라운드)
        apiPost('/process-matching-status').catch(console.error);
        
        // 매칭 상태 조회 (제안 포함)
        const statusData = await apiGet('/matching-status', { userId: user.userId });
        
        console.log('[매니저 제안] API 응답:', JSON.stringify(statusData, null, 2));
        console.log('[매니저 제안] hasPendingProposal:', statusData.hasPendingProposal);
        console.log('[매니저 제안] proposalMatchId:', statusData.proposalMatchId);
        console.log('[매니저 제안] status:', statusData.status);
        
        if (statusData.hasPendingProposal) {
          console.log('[매니저 제안] 모달 표시 시도');
          setProposalMatchId(statusData.proposalMatchId);
          setShowProposalModal(true);
        } else {
          console.log('[매니저 제안] hasPendingProposal이 false');
        }
      } catch (error) {
        console.error('매칭 제안 확인 실패:', error);
      }
    };

    checkProposalAndStatus();
  }, [user?.userId]);

  // 매칭 제안 응답 처리
  const handleProposalResponse = async (response: 'accept' | 'reject') => {
    if (!proposalMatchId) return;

    try {
      const result = await apiPost(`/propose/${proposalMatchId}/respond`, {
        response
      });

      setShowProposalModal(false);
      setProposalMatchId(null);

      if (response === 'accept') {
        Alert.alert('수락 완료', '매칭 제안을 수락했습니다.');
        // 상태 새로고침
        await refetchStatus();
      } else {
        Alert.alert('거절 완료', '매칭 제안을 거절했습니다.');
      }
    } catch (error) {
      console.error('매칭 제안 응답 실패:', error);
      Alert.alert('오류', '처리 중 오류가 발생했습니다.');
    }
  };

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
    mismatched: '일정이 겹치지 않았어요.\n다시 일정을 선택해 주세요!',
    confirmed: '매칭 확정!\n관리자가 최종 일정을 확정하고 있어요.',
    scheduled: '소개팅 일정이 확정됐어요!\n당일 오전 9시에 프로필이 공개됩니다.',
    completed: '소개팅이 완료되었어요!\n후기를 작성해주세요.',
    failed: '매칭이 실패했어요.\n포인트가 반환되었습니다.',
    none: '아직 소개팅 신청을 하지 않았습니다.',
  };

  const statusSteps = ['waiting', 'matched', 'confirmed', 'scheduled'];
  const currentStep =
    statusData?.status === 'mismatched'
      ? statusSteps.indexOf('confirmed') // mismatched는 confirmed와 동일하게!
      : statusData?.status
        ? statusSteps.indexOf(statusData.status)
        : -1;

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
      // 정책상 제출하면 무조건 confirmed로 처리
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
    <MainLayout onRefresh={handleRefresh} refreshing={refreshing}>
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
      {!showCtaCard && (statusData?.status === 'scheduled') && statusData?.matchedUser && !isDatePassed && (
        <CardProfile
          user={statusData.matchedUser}
          matchId={matchId || ''}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.USER_DETAIL, { userId: statusData.matchedUser.userId, matchId })}
        />
      )}

      {/* 소개팅 완료 후 리뷰 작성 카드 */}
      {!showCtaCard && (statusData?.status === 'scheduled') && statusData?.matchedUser && isDatePassed && (
        <CardReview
          user={statusData.matchedUser}
          matchId={matchId || ''}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.REVIEW_WRITE, { userId: statusData.matchedUser.userId, matchId })}
        />
      )}

      {/* 일정 선택 UI: status가 matched일 때 */}
      {!showCtaCard && (statusData?.status === 'matched' || statusData?.status === 'mismatched') && statusData.otherUserChoices && (
        <View style={{ backgroundColor: '#FFF3F3', borderRadius: 12, marginTop: 0, marginBottom: 12, padding: 16, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, lineHeight: 22, marginRight: 5 }}>💡</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, lineHeight: 22 }}>상대방이 선택한 일정/장소</Text>
          </View>
          <Text style={{ marginBottom: 2, textAlign: 'center' }}>날짜: {statusData.otherUserChoices.dates?.join(', ') || '-'}</Text>
          <Text style={{ textAlign: 'center' }}>장소: {statusData.otherUserChoices.locations?.join(', ') || '-'}</Text>
        </View>
      )}

      {/* 일정 선택 UI: matched, mismatched 모두에서 노출 */}
      {!showCtaCard && (statusData?.status === 'matched' || statusData?.status === 'mismatched') && (
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

      {/* failed 상태일 때 실패 UI */}
      {!showCtaCard && statusData?.status === 'failed' && (
        <CardCTA
          title="매칭이 실패했어요"
          subtitle="포인트가 자동으로 반환되었습니다.\n다시 신청해보세요!"
          buttonText="다시 신청하기"
          onPress={handleCtaPress}
        />
      )}

      {/* 매칭 제안 모달 */}
      <Modal
        visible={showProposalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProposalModal(false)}
      >
        <View style={styles.proposalModalOverlay}>
          <View style={styles.proposalModalContainer}>
            <Text style={styles.proposalModalTitle}>매니저에게로 부터 소개팅 제안이 왔습니다.</Text>
            <Text style={styles.proposalModalSubtitle}>소개팅을 받으시겠습니까? (포인트 미차감)</Text>
            <View style={styles.proposalButtonContainer}>
              <TouchableOpacity
                style={[styles.proposalButton, styles.proposalAcceptButton]}
                onPress={() => handleProposalResponse('accept')}
              >
                <Text style={styles.proposalAcceptButtonText}>예</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.proposalButton, styles.proposalRejectButton]}
                onPress={() => handleProposalResponse('reject')}
              >
                <Text style={styles.proposalRejectButtonText}>아니오</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    </MainLayout>
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
    height: 200,
    marginBottom: 10,
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
  proposalModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  proposalModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    minWidth: 280,
  },
  proposalModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  proposalModalSubtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  proposalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  proposalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  proposalAcceptButton: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    width: 100, 
    textAlign: 'center',
  },
  proposalAcceptButtonText: {
    ...typography.button,
    color: '#fff', 
    textAlign: 'center',
  },
  proposalRejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    width: 100, 
    textAlign: 'center',
  },
  proposalRejectButtonText: {
    ...typography.button,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default MainScreen; 