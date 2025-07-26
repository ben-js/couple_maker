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
import CardRequest from '../components/CardRequest';
import CardCTA from '../components/CardCTA';
import CardScheduleChoice from '../components/CardScheduleChoice';
import CardReview from '../components/CardReview';
import { useUserStatus, useUserInfo } from '../hooks/useUserStatus';
import ContactExchangeModal from '../components/ContactExchangeModal';

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuth();
  // 로그인 시 이미 모든 정보를 가져왔으므로, 초기에는 API 호출하지 않음
  // 대신 로그인 시 받은 사용자 정보를 직접 사용
  const { data: statusData, refetch: refetchStatus } = useUserStatus(user?.userId);
  const { data: userInfo, refetch: refetchUser } = useUserInfo(user?.userId);
  
  // 로그인 시 받은 사용자 정보를 우선 사용 (API 호출 없이)
  const currentUser = user;
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [otherChoices, setOtherChoices] = useState<{ dates: string[]; locations: string[] } | null>(null);
  const [dateSelections, setDateSelections] = useState<(string|null)[]>([null, null, null]);
  const [showDatePickerIdx, setShowDatePickerIdx] = useState<number|null>(null);
  const [locationSelection, setLocationSelection] = useState<string[]>([]);
  const [showDateDuplicateModal, setShowDateDuplicateModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMatchId, setProposalMatchId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 현재 사용자가 연락처를 보냈는지 확인
  const hasSentContact = useMemo(() => {
    if (!statusData?.matchId || !user?.userId) return false;
    return statusData.review?.contact;
  }, [statusData?.matchId, statusData?.review?.contact, user?.userId]);
  
  // 상대방이 연락처를 보냈는지 확인
  const hasReceivedContact = useMemo(() => {
    if (!statusData?.matchId || !statusData?.matchedUser) return false;
    return !!statusData.otherUserContact;
  }, [statusData?.matchId, statusData?.matchedUser, statusData?.otherUserContact]);
  
  // 소개팅 완료 후 2시간이 지났는지 확인
  const isDatePassed = useMemo(() => {
    if (!statusData?.finalDate) return false;
    const finalDate = new Date(statusData.finalDate);
    const twoHoursLater = new Date(finalDate.getTime() + 2 * 60 * 60 * 1000); // 2시간 후
    const now = new Date();
    const isPassed = now > twoHoursLater;
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

  // 매칭 제안 확인 및 상태 자동 처리 (한 번만 실행)
  useEffect(() => {
    const checkProposalAndStatus = async () => {
      if (!user?.userId) return;
      
      try {
        // 로그인 후 즉시 매칭 상태 확인 (pending proposal 포함)
        console.log('로그인 후 매칭 상태 확인 시작:', { userId: user.userId });
        await refetchStatus();
        
        // 30초 후에 첫 번째 업데이트를 수행
        const timer = setTimeout(async () => {
          console.log('첫 번째 매칭 상태 업데이트 시작:', { userId: user.userId });
          apiPost('/process-matching-status', undefined, user.userId).catch(console.error);
        }, 30000); // 30초 후
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('매칭 제안 확인 실패:', error);
      }
    };

    checkProposalAndStatus();
  }, [user?.userId, refetchStatus]); // refetchStatus 의존성 추가

  // 매칭 제안 응답 처리
  const handleProposalResponse = async (response: 'accepted' | 'refused') => {
    console.log('🔍 handleProposalResponse 시작:', { response, proposalMatchId, statusData });
    
    const matchIdToUse = proposalMatchId || statusData?.proposalMatchId;
    console.log('🔍 matchIdToUse:', matchIdToUse);
    
    if (!matchIdToUse) {
      console.error('❌ matchIdToUse가 없습니다.');
      Alert.alert('오류', '매칭 ID를 찾을 수 없습니다.');
      return;
    }

    try {
      console.log('📡 API 요청 시작:', { url: `/propose/${matchIdToUse}/respond`, response, userId: user?.userId });
      
      const result = await apiPost(`/propose/${matchIdToUse}/respond`, {
        response
      }, user?.userId);

      console.log('✅ API 응답 성공:', result);

      setShowProposalModal(false);
      setProposalMatchId(null);

      if (response === 'accepted') {
        Alert.alert('수락 완료', '매칭 제안을 수락했습니다.');
        // 상태 새로고침
        await refetchStatus();
      } else {
        Alert.alert('거절 완료', '매칭 제안을 거절했습니다.');
        // 상태 새로고침
        await refetchStatus();
      }
    } catch (error: any) {
      console.error('❌ 매칭 제안 응답 실패:', error);
      console.error('❌ 오류 상세:', { 
        message: error?.message, 
        stack: error?.stack,
        matchIdToUse,
        response,
        userId: user?.userId
      });
      
      // 더 구체적인 오류 메시지 제공
      let errorMessage = '처리 중 오류가 발생했습니다.';
      if (error?.message?.includes('404')) {
        errorMessage = '매칭 제안을 찾을 수 없습니다.';
      } else if (error?.message?.includes('500')) {
        errorMessage = '서버 오류가 발생했습니다.';
      } else if (error?.message?.includes('network')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      Alert.alert('오류', errorMessage);
    }
  };

  // statusData에서 matchId 추출하여 세팅
  useEffect(() => {
    if (statusData?.matchId) {
      setMatchId(statusData.matchId);
    } else {
      setMatchId(null);
    }
  }, [statusData]);

  // pending 제안이 있을 때 모달 표시
  useEffect(() => {
    console.log('=== MainScreen - pending 제안 확인 시작 ===');
    console.log('전체 statusData:', JSON.stringify(statusData, null, 2));
    console.log('전체 user 정보:', JSON.stringify(user, null, 2));
    console.log('MainScreen - pending 제안 확인:', {
      hasPendingProposal: statusData?.hasPendingProposal,
      proposalMatchId: statusData?.proposalMatchId,
      proposalTargetId: statusData?.proposalTargetId,
      userId: user?.userId,
      statusData: statusData
    }); 
    
    // 각 조건을 개별적으로 체크
    const hasProposal = statusData?.hasPendingProposal;
    const targetIdMatch = statusData?.proposalTargetId === user?.userId;
    const hasMatchId = statusData?.proposalMatchId;
    
    console.log('조건 체크:', {
      hasProposal,
      targetIdMatch,
      hasMatchId,
      proposalTargetId: statusData?.proposalTargetId,
      userId: user?.userId,
      isEqual: statusData?.proposalTargetId === user?.userId,
      proposalTargetIdType: typeof statusData?.proposalTargetId,
      userIdType: typeof user?.userId
    });
    
    // proposalTargetId가 있을 때만 내 userId와 일치하는지 체크
    const isMyProposal = hasProposal && targetIdMatch;
    if (isMyProposal && hasMatchId) {
      console.log('✅ 모달 표시 조건 만족 - 모달 띄움');
      setShowProposalModal(true);
      setProposalMatchId(statusData.proposalMatchId);
    } else {
      console.log('❌ 모달 표시 조건 불만족 - 모달 숨김');
      console.log('❌ 실패 이유:', {
        hasProposal,
        targetIdMatch,
        hasMatchId,
        isMyProposal
      });
      setShowProposalModal(false);
      setProposalMatchId(null);
    }
    console.log('=== MainScreen - pending 제안 확인 끝 ===');
  }, [statusData?.hasPendingProposal, statusData?.proposalMatchId, statusData?.proposalTargetId, user?.userId]);

  // 화면이 포커스될 때 사용자 상태 확인만 (불필요한 refetch 제거)
  useFocusEffect(
    useCallback(() => {
      // 사용자 상태 확인 및 분기 처리만 수행
      if (currentUser) {   
        if (!currentUser.isVerified && currentUser.email) {
          // 이메일 인증이 필요한 경우
          navigation.navigate(NAVIGATION_ROUTES.EMAIL_VERIFICATION, { email: currentUser.email });
        } else if (!currentUser.hasProfile) {
          // 프로필이 없는 경우
          navigation.navigate(NAVIGATION_ROUTES.PROFILE_EDIT);
        } else if (!currentUser.hasPreferences) {
          // 이상형이 없는 경우
          navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT);
        }
      }
    }, [currentUser, navigation])
  );

  // 로그인 후 매칭 상태를 강제로 즉시 fetch
  useEffect(() => {
    if (user?.userId) {
      console.log('로그인 후 강제 매칭 상태 fetch:', user.userId);
      refetchStatus(); // 로그인 후 강제 fetch
    }
  }, [user?.userId, refetchStatus]);

  // otherUserChoices가 변경될 때 otherChoices 상태 업데이트
  useEffect(() => {
    if (statusData?.otherUserChoices) {
      setOtherChoices(statusData.otherUserChoices);
    } else {
      setOtherChoices(null);
    }
  }, [statusData?.otherUserChoices]);


  // 매칭 단계별 설명
  const matchingStepDescriptions: Record<string, string> = {
    waiting: '신청이 완료되었어요.\n매칭 소식을 곧 알려드릴게요!',
    matched: '매칭 성공!\n일정을 선택 해주세요.',
    mismatched: '일정이 겹치지 않았어요.\n다시 일정을 선택해 주세요!',
    confirmed: '매칭 확정!\n관리자가 최종 일정을 확정하고 있어요.',
    scheduled: '소개팅 일정이 확정됐어요!\n소개팅 30분 전에 사진이 공개됩니다.',
    review: '상대방이 리뷰를 아직 작성 하지 않았습니다.\n조금만더 기다려 주세요.',
    completed: '소개팅이 완료되었어요!\n연락처 교환이 가능합니다.',
    exchanged: '연락처 교환이 완료되었어요!\n확인해 보세요.',
    finished: '소개팅이 완료되었어요!\n상대방이 연락처를 확인, 또는 \n3일이 지나면 현재 소개팅은 종료 됩니다.',
    failed: '매칭이 실패했어요.\n포인트가 반환되었습니다.',
    none: '아직 소개팅 신청을 하지 않았습니다.',
  };

  // 매칭 진행 단계 정의
  const MATCHING_STEPS = {
    WAITING: 0,      // 신청완료
    MATCHED: 1,      // 매칭성공  
    CONFIRMED: 2,    // 일정 조율
    SCHEDULED: 3,    // 소개팅 예정
  } as const;

  const STEP_LABELS = ['신청완료', '매칭성공', '일정 조율', '소개팅 예정'];

  // 상태별 진행 단계 매핑
  const getCurrentStep = (status: string | undefined): number => {
    if (!status) return -1;

    // 특별한 상태들: 소개팅 예정 단계로 매핑
    const scheduledStepStatuses = ['review', 'completed', 'exchanged', 'finished'];
    if (scheduledStepStatuses.includes(status)) {
      return MATCHING_STEPS.SCHEDULED;
    }

    // mismatched 상태: 일정 조율 단계로 매핑
    if (status === 'mismatched') {
      return MATCHING_STEPS.CONFIRMED;
    }

    // 기본 상태들: 해당하는 단계로 매핑
    const stepMapping: Record<string, number> = {
      waiting: MATCHING_STEPS.WAITING,
      matched: MATCHING_STEPS.MATCHED,
      confirmed: MATCHING_STEPS.CONFIRMED,
      scheduled: MATCHING_STEPS.SCHEDULED,
    };

    return stepMapping[status] ?? -1;
  };

  const showCtaCard = (!statusData?.status || statusData?.status === '' || statusData?.status === 'none') && !statusData?.hasPendingProposal;
  const showWaitingReviewMsg = statusData?.status === 'review' && !statusData?.bothReviewed;
  const currentStep = getCurrentStep(statusData?.status);

  const renderMatchingProgress = () => (
    <View style={styles.matchingProgressContainer}>
      <View style={styles.matchingProgressCenter}>
        <Text style={styles.matchingProgressTitle}>매칭 진행 상황</Text>
      </View>
      <Text style={styles.matchingProgressDesc}>
        {statusData?.status ? (matchingStepDescriptions[statusData.status] || '') : matchingStepDescriptions.none}
      </Text>
      <StepProgressBar
        total={STEP_LABELS.length}
        current={currentStep}
        labels={STEP_LABELS}
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
    if (!dateSelections.every(d => d) || !locationSelection?.length) {
      Alert.alert('입력 확인', '날짜와 장소를 모두 선택해주세요.');
      return;
    }
    if (!statusData?.requestId) {
      Alert.alert('오류', '매칭 요청 ID를 찾을 수 없습니다.');
      return;
    }
    try {
      const res = await apiPost('/submit-choices', {
        request_id: statusData.requestId,
        dates: dateSelections,
        locations: locationSelection,
      }, user?.userId);
    
      // mismatched 상태인 경우 추가 알림 표시
      if (res.status === 'mismatched') {
        const otherDates = statusData?.otherUserChoices?.dates || [];
        const otherLocations = statusData?.otherUserChoices?.locations || [];
        
        let message = '상대방과 일정이 맞지 않습니다.\n\n';
        message += `상대방이 선택한 날짜: ${otherDates.join(', ')}\n`;
        message += `상대방이 선택한 장소: ${otherLocations.join(', ')}\n\n`;
        message += '위 일정 중에서 선택하거나, 같은 지역의 장소를 선택해주세요.';
        
        Alert.alert(
          '일정이 맞지 않습니다', 
          message,
          [
            {
              text: '확인',
              onPress: () => {
                // 일정 선택 초기화
                setDateSelections([null, null, null]);
                setLocationSelection([]);
              }
            }
          ]
        );
      } else if (res.status === 'confirmed') {
        Alert.alert('일정 확정!', '상대방과 일정이 맞아서 소개팅이 확정되었습니다.');
      } else {
        Alert.alert('완료', '일정/장소를 선택하였습니다.', [
          {
            text: '확인',
            onPress: () => {
              // 상태 업데이트 후 화면 갱신
              refetchStatus();
            }
          }
        ]);
      }
    } catch (e: any) {
      console.error('❌ API 에러:', e);
      console.error('❌ 에러 상세:', { 
        message: e?.message, 
        stack: e?.stack,
        matchId,
        userId: user?.userId
      });
      
      // 더 구체적인 오류 메시지 제공
      let errorMessage = '일정/장소 저장에 실패했습니다.';
      if (e?.message?.includes('404')) {
        errorMessage = '매칭 정보를 찾을 수 없습니다.';
      } else if (e?.message?.includes('500')) {
        errorMessage = '서버 오류가 발생했습니다.';
      } else if (e?.message?.includes('network')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      Alert.alert('저장 실패', errorMessage);
    }
  };

  // 연락처 저장 핸들러
  const handleContactSubmit = async (contact: string) => {
    if (!statusData?.matchId || !user?.userId) return;
    setIsSavingContact(true);
    try {
      await apiPost('/reviews/contact', {
        match_id: statusData.matchId,
        reviewer_id: user.userId,
        contact,
      }, user.userId);
      setShowContactModal(false);
      refetchStatus();
      Alert.alert('완료', '연락처가 저장되었습니다.');
    } catch (e) {
      Alert.alert('오류', '연락처 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <MainLayout onRefresh={handleRefresh} refreshing={refreshing}>
      {renderMatchingProgress()}

      {/* 소개팅 신청 CTA: 신청 전(status 없음) */}
      {showCtaCard && (
        <CardRequest
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

      {/* 소개팅 완료 후 리뷰 작성 카드 - scheduled 상태 */}
      {!showCtaCard && (statusData?.status === 'scheduled') && statusData?.matchedUser && isDatePassed && (
        <CardReview
          user={statusData.matchedUser}
          matchId={matchId || ''}
          onPress={() => {
            if (statusData.review) {
              navigation.navigate(NAVIGATION_ROUTES.REVIEW_WRITE, {
                userId: statusData.matchedUser.userId,
                matchId,
                readonly: true,
                review: statusData.review,
              });
            } else {
              navigation.navigate(NAVIGATION_ROUTES.REVIEW_WRITE, {
                userId: statusData.matchedUser.userId,
                matchId,
                readonly: false,
              });
            }
          }}
          buttonText={statusData.review ? '리뷰 완료' : '리뷰/에프터 작성하기'}
        />
      )}

      {/* 리뷰 상태일 때 카드 - review 상태 */}
      {!showCtaCard && (statusData?.status === 'review') && statusData?.matchedUser && (
        <CardReview
          user={statusData.matchedUser}
          matchId={matchId || ''}
          onPress={() => {
            navigation.navigate(NAVIGATION_ROUTES.REVIEW_WRITE, {
              userId: statusData.matchedUser.userId,
              matchId,
              readonly: true,
              review: statusData.review,
            });
          }}
          buttonText="내가 작성한 리뷰 보기"
          title="리뷰 작성 완료!"
          subtitle={`${statusData.matchedUser.name}님이 리뷰를 작성 중입니다.`}
        />
      )}

      {/* 일정 선택 UI: status가 matched 또는 mismatched일 때 */}
      {!showCtaCard && (statusData?.status === 'matched' || statusData?.status === 'mismatched') && (
        <View style={{ 
          backgroundColor: statusData?.status === 'mismatched' ? '#FFF0F0' : '#FFF3F3', 
          borderRadius: 12, 
          marginTop: 0, 
          marginBottom: 12, 
          padding: 16, 
          alignItems: 'center' 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, lineHeight: 22, marginRight: 5 }}>
              {'💡'}
            </Text>
            <Text style={{ 
              fontWeight: 'bold', 
              fontSize: 16, 
              lineHeight: 22,
              color: '#222'
            }}>
              { '상대방이 선택한 일정/장소'}
            </Text>
          </View>
          {statusData?.status === 'mismatched' && (
            <Text style={{ marginBottom: 8, textAlign: 'center', color: '#E53E3E', fontSize: 14, fontWeight: '500' }}>
              위 일정 중에서 선택하고, 같은 지역의 장소를 선택해주세요
            </Text>
          )}
          <Text style={{ marginBottom: 2, textAlign: 'center' }}>날짜: {otherChoices?.dates?.join(', ') || '-'}</Text>
          <Text style={{ textAlign: 'center' }}>장소: {otherChoices?.locations?.join(', ') || '-'}</Text>
        </View>
      )}

      {/* 일정 선택 UI: matched 상태이고 아직 선택하지 않은 경우, 또는 mismatched 상태인 경우 (myChoices가 있어도 재선택 가능) */}
      {!showCtaCard && (
        (statusData?.status === 'matched' && !statusData?.myChoices) ||
        statusData?.status === 'mismatched'
      ) && (
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

      {/* 일정 선택 완료 후 메시지: matched 상태이고 선택을 완료한 경우에만 (mismatched 상태에서는 표시하지 않음) */}
      {!showCtaCard && statusData?.status === 'matched' && statusData?.myChoices && (
        <CardCTA
          title="일정/장소 선택 완료"
          subtitle={`선택한 날짜: ${statusData.myChoices.dates?.join(', ')}\n선택한 장소: ${statusData.myChoices.locations?.join(', ')}`}
          buttonText="상대방 선택 대기 중..."
          icon="clock"
          disabled={true}
          onPress={() => {}}
        />
      )}

      {/* completed 상태일 때 연락처 교환 카드 */}
      {!showCtaCard && statusData?.status === 'completed' && statusData?.matchedUser && statusData?.contactReady && !hasSentContact && (
        <CardCTA
          title="연락처 교환 가능!"
          subtitle={`${statusData.matchedUser.name}님과 서로 호감이 통했어요!\n연락처를 교환해보세요.`}
          buttonText="연락처 교환하기"
          icon="phone"
          onPress={() => setShowContactModal(true)}
        />
      )}

      {/* completed 상태에서 연락처를 보낸 후 */}
      {!showCtaCard && statusData?.status === 'completed' && statusData?.matchedUser && statusData?.contactReady && hasSentContact && !hasReceivedContact && (
        <CardCTA
          title="연락처를 보냈습니다"
          subtitle={`${statusData.matchedUser.name}님이 연락처를 작성 중에 있습니다.\n잠시만 기다려 주세요.`}
          buttonText="연락처 교환하기"
          icon="phone"
          disabled={true}
          onPress={() => {}}
        />
      )}

      {/* failed 상태일 때 실패 UI */}
      {!showCtaCard && statusData?.status === 'failed' && (
        <CardCTA
          title="매칭이 실패했어요"
          subtitle="포인트가 자동으로 반환되었습니다.\n다시 신청해보세요!"
          buttonText="다시 신청하기"
          icon="x-circle"
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
            <Text style={styles.proposalModalTitle}>소개팅 제안이 도착했습니다.</Text>
            <Text style={styles.proposalModalSubtitle}>소개팅을 받으시겠습니까? (포인트 미차감)</Text>
            <View style={styles.proposalButtonContainer}>
              <TouchableOpacity
                style={[styles.proposalButton, styles.proposalAcceptButton]}
                onPress={() => handleProposalResponse('accepted')}
              >
                <Text style={styles.proposalAcceptButtonText}>예</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.proposalButton, styles.proposalRefuseButton]}
                onPress={() => handleProposalResponse('refused')}
              >
                <Text style={styles.proposalRefuseButtonText}>아니오</Text>
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

      <ContactExchangeModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSubmit={handleContactSubmit}
      />

      {/* exchanged 상태일 때 연락처 도착 카드 */}
      {!showCtaCard && statusData?.status === 'exchanged' && statusData?.matchedUser && (
        <CardCTA
          title="연락처가 도착했습니다!"
          subtitle={`${statusData.matchedUser.name}님의 연락처가 도착했어요.`}
          buttonText="연락처 확인"
          icon="heart"
          iconColor="#E94F4F"
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.CONTACT_DETAIL, { matchId: statusData.matchId })}
        />
      )}

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
    marginTop: 0,
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
    width: '96%',
    maxWidth: 400,
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
  proposalRefuseButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    width: 100, 
    textAlign: 'center',
  },
  proposalRefuseButtonText: {
    ...typography.button,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default MainScreen; 