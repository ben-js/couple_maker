import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Image, ActivityIndicator, ToastAndroid, Alert, Platform, Modal, Dimensions, SafeAreaView } from 'react-native';
import { View, Card, Text, Button, Avatar, TouchableOpacity } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { NAVIGATION_ROUTES, colors, typography, spacing } from '@/constants';
import { useUserProfile } from '../hooks/useUserProfile';
import { apiGet, apiPost } from '@/utils/apiUtils';
import PrimaryButton from '../components/PrimaryButton';
import StepProgressBar from '../components/StepProgressBar';
import DateTimePicker from '@react-native-community/datetimepicker';
import regionData from '../data/regions.json';
import FormRegionChoiceModal from '../components/FormRegionChoiceModal';
import FormModalSelector from '../components/FormModalSelector';

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { getProfilePhoto, getUserDisplayName, getUserInitial } = useUserProfile();

  // mainCard 상태 및 setMainCard, renderProfileCard 등 제거
  // matchingStatus만으로 UI 처리
  const [matchingStatus, setMatchingStatus] = useState<{ status?: string; steps: string[] }>({ status: undefined, steps: ['신청완료', '매칭 중', '일정 조율', '소개팅 예정'] });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [myChoices, setMyChoices] = useState<{ dates: string[]; locations: string[] } | null>(null);
  const [otherChoices, setOtherChoices] = useState<{ dates: string[]; locations: string[] } | null>(null);
  const [showFailedModal, setShowFailedModal] = useState(false);
  // 일정 선택 상태
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [dateSelections, setDateSelections] = useState<(string|null)[]>([null, null, null]);
  const [showDatePickerIdx, setShowDatePickerIdx] = useState<number|null>(null);
  const [locationSelection, setLocationSelection] = useState<string[]>([]);
  // 장소 추천 리스트(profile 기반)
  const region = typeof user?.region === 'string' ? user?.region : user?.region?.region || '';
  const district = user?.region?.district || '';
  const [showDateDuplicateModal, setShowDateDuplicateModal] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    setLoadingStatus(true);
    apiGet('/matching-status', { userId: user.userId })
      .then(res => {
        setStatus(res.status);
        setMatchedUser(res.matchedUser || null);
        setMatchId(res.matchId || null);
        setMyChoices(res.myChoices || null);
        setOtherChoices(res.otherChoices || null);
        if (res.status === 'failed') setShowFailedModal(true);
        if (res.matchedUser) setShowCardModal(true);
      })
      .catch(e => setCardError(e.message || '매칭 상태를 불러오지 못했습니다.'))
      .finally(() => setLoadingStatus(false));
  }, [user?.userId]);

  // renderProfileCard 복원 (matchedUser 기반)
  const renderProfileCard = () => {
    if (!matchedUser) return null;
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
            <Feather name={'unlock'} size={40} color={colors.accent} />
            </View>
          <Text style={styles.profileCardDesc}>{matchedUser.name}님의 프로필이 도착했습니다.</Text>
          <PrimaryButton
            title="지금 확인하러 가기"
            onPress={() => navigation.navigate(NAVIGATION_ROUTES.USER_DETAIL, { userId: matchedUser.userId })}
            style={{ marginTop: 12, minWidth: 140, height: 40, alignSelf: 'center' }}
          />
        </View>
      </Card>
    );
  };

  // 모달: 매칭 상대 카드 도착 안내
  const [cardModalVisible, setCardModalVisible] = useState(false);
  useEffect(() => {
    if (matchedUser) setCardModalVisible(true);
  }, [matchedUser]);

  const handleCardModalConfirm = () => {
    setCardModalVisible(false);
    navigation.navigate(NAVIGATION_ROUTES.USER_DETAIL, { userId: matchedUser.userId });
  };

  // showCtaCard 조건을 status 값만으로 명확하게 처리
  const showCtaCard = !status;

  const matchingStepDescriptions: Record<string, string> = {
    waiting: '신청이 완료되었어요.\n매칭 소식을 곧 알려드릴게요!',
    matched: '매칭 성공!\n일정을 선택 해주세요.',
    confirmed: '매칭 확정!\n일정 조율 중이에요.',
    scheduled: '소개팅 일정이 확정됐어요!\n당일 오전 9시에 프로필이 공개됩니다.',
  };

  const statusSteps = ['waiting', 'matched', 'confirmed', 'scheduled'];
  const currentStep = statusSteps.indexOf(status ?? '');

  const handleRefreshStatus = () => {
    setLoadingStatus(true);
    apiGet('/matching-status', { userId: user?.userId })
      .then(res => {
        setStatus(res.status);
        setMatchedUser(res.matchedUser || null);
        setMatchId(res.matchId || null);
        setMyChoices(res.myChoices || null);
        setOtherChoices(res.otherChoices || null);
        if (res.status === 'failed') setShowFailedModal(true);
      })
      .finally(() => setLoadingStatus(false));
  };

  const renderMatchingProgress = () => {
    return (
      <View style={styles.matchingProgressContainer}>
        <TouchableOpacity onPress={handleRefreshStatus} style={{ position: 'absolute', top: 12, right: 16, zIndex: 1, padding: 2 }}>
          <Feather name="refresh-ccw" size={16} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.matchingProgressTitle}>매칭 진행 상황</Text>
        </View>
        <Text style={styles.matchingProgressDesc}>
          {matchingStepDescriptions[status ?? ''] || '상태를 불러올 수 없습니다.'}
        </Text>
        <StepProgressBar
          total={statusSteps.length}
          current={currentStep >= 0 ? currentStep : 0}
          labels={['신청완료', '매칭성공', '일정 조율', '소개팅 예정']}
        />
      </View>
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
    console.log('handleConfirmSchedule', dateSelections, locationSelection, matchId, user?.userId
      
    );
    if (!dateSelections.every(d => d) || locationSelection.length === 0) return;
    if (!matchId) return; // matchId가 없으면 호출하지 않음
    await apiPost('/matching-choices', {
      match_id: matchId,
      user_id: user?.userId,
      dates: dateSelections,
      locations: locationSelection,
    });
    setLoadingStatus(true);
    apiGet('/matching-status', { userId: user?.userId })
      .then(res => {
        setStatus(res.status);
        setMatchedUser(res.matchedUser || null);
        setMatchId(res.matchId || null);
        setMyChoices(res.myChoices || null);
        setOtherChoices(res.otherChoices || null);
        if (res.status === 'failed') setShowFailedModal(true);
      })
      .finally(() => setLoadingStatus(false));
  };

  // 일정 선택 UI
  const renderScheduleChoice = () => (
    <Card enableShadow style={styles.profileCard}>
      <Text style={styles.profileCardTitle}>일정/장소를 선택 하세요!</Text>
      {otherChoices && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.text.secondary, marginBottom: 4 }}>상대방이 선택한 일정</Text>
          <Text style={styles.profileCardDesc}>날짜: {otherChoices.dates.join(', ')}</Text>
          <Text style={styles.profileCardDesc}>장소: {otherChoices.locations.join(', ')}</Text>
        </View>
      )}
      <View style={{ marginBottom: 24 }} />
      {/* 1,2,3번 날짜/장소 선택 row를 바로 노출 */}
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch', padding: 0 }}>
        {[0,1,2].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 16, width: 90 }}>{i+1}. 날짜 선택</Text>
            <TouchableOpacity
              onPress={() => setShowDatePickerIdx(i)}
              activeOpacity={0.8}
              style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 0, minHeight: 44 }}
            >
              <Text style={{ color: dateSelections[i] ? '#222' : '#bbb', fontSize: 16 }}>
                {dateSelections[i] || '날짜를 선택해 주세요'}
              </Text>
            </TouchableOpacity>
            {showDatePickerIdx === i && (
              <DateTimePicker
                value={dateSelections[i] ? new Date(dateSelections[i]!) : new Date()}
                mode="date"
                display="default"
                minimumDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()}
                onChange={(_, date) => {
                  if (date) {
                    const d = date;
                    const formatted = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                    if (dateSelections.includes(formatted)) {
                      setShowDateDuplicateModal(true);
                    } else {
                      const newDates = [...dateSelections];
                      newDates[i] = formatted;
                      setDateSelections(newDates);
                    }
                  }
                  setShowDatePickerIdx(null);
                }}
              />
            )}
          </View>
        ))}
        {/* 장소 chips 선택 모달: showRegionModal이 true일 때만 Modal로 렌더링 */}
        {(
          <FormRegionChoiceModal
            label="장소 선택"
            value={locationSelection.map(loc => {
              const [region, district] = loc.split(' ');
              return { region, district: district || '' };
            })}
            onChange={val => {
              setLocationSelection(
                Array.from(new Set(val.map(v => v.region + (v.district ? ' ' + v.district : ''))))
              );
            }}
            regionData={regionData}
            placeholder="장소를 선택해 주세요"
            minSelect={1}
            maxSelect={3}
            error={undefined}
            type="same-line"
          />
        )}
      </View>
      {/* 하단 고정 버튼 */}
      <View style={{ paddingTop: 12 }}>
        <TouchableOpacity
          style={{ backgroundColor: dateSelections.every(d => d) && locationSelection.length > 0 ? colors.primary : '#eee', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          disabled={!dateSelections.every(d => d) || locationSelection.length === 0}
          onPress={handleConfirmSchedule}
        >
          <Text style={{ color: dateSelections.every(d => d) && locationSelection.length > 0 ? '#fff' : '#bbb', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // 일정 조율 실패 모달
  const handleAcceptOtherSchedule = async () => {
    await apiGet('/submit-choices', {
      match_id: matchId,
      user_id: user?.userId,
      acceptOtherSchedule: true,
    });
    setShowFailedModal(false);
    setLoadingStatus(true);
    apiGet('/matching-status', { userId: user?.userId })
      .then(res => {
        setStatus(res.status);
        setMatchedUser(res.matchedUser || null);
        setMatchId(res.matchId || null);
        setMyChoices(res.myChoices || null);
        setOtherChoices(res.otherChoices || null);
      })
      .finally(() => setLoadingStatus(false));
  };

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
            <Text style={styles.pointsText}>보유 포인트: {user && typeof user.points === 'number' ? user.points : 0}P</Text>
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

      {/* 소개팅 신청 CTA: 신청 전(status 없음) */}
      {showCtaCard && renderCtaCard()}

      {/* 매칭 상태 뷰: 신청 이후(status 있음) */}
      {!showCtaCard && renderMatchingProgress()}

      {/* 매칭 상대 카드 도착 시 카드 UI 노출 */}
      {!showCtaCard && (status === 'scheduled') && matchedUser && renderProfileCard()}

      {/* 일정 선택 UI: status가 matched일 때 */}
      {!showCtaCard && status === 'matched' && renderScheduleChoice()}

      {/* 일정 조율 실패 모달 */}
      {showFailedModal && (
        <Modal visible={showFailedModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', width: 300 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>상대방과 일정이 맞지 않습니다. 상대방 일정에 맞추시겠습니까?</Text>
              <PrimaryButton
                title="상대방 일정에 맞추기"
                onPress={handleAcceptOtherSchedule}
                style={{ marginTop: 16, minWidth: 120, height: 44 }}
              />
              <PrimaryButton
                title="다른 사람과 매칭"
                onPress={() => {/* 재매칭 로직 구현 필요 */}}
                style={{ marginTop: 8, minWidth: 120, height: 44, backgroundColor: colors.text.secondary }}
              />
            </View>
          </View>
        </Modal>
      )}


      {/* 매칭 상대 카드 도착 모달 */}
      {/* 
      {cardModalVisible && (
        <Modal
          visible={cardModalVisible}
          transparent
          animationType="fade"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', width: 300 }}>
              <Feather name="mail" size={40} color={colors.accent} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>커플 매니저가 소개팅 카드를 보냈습니다{"\n"}확인하세요</Text>
              <PrimaryButton
                title="확인"
                onPress={handleCardModalConfirm}
                style={{ marginTop: 16, minWidth: 120, height: 44 }}
              />
            </View>
          </View>
        </Modal>
      )}
      */}

      {/* 장소 선택 모달 */}
      {/* 이미 선택된 날짜 안내 모달 */}
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
    minHeight: 190,
  },
  matchingProgressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    textAlign: 'center',
    marginTop: 20,
  },
  matchingProgressDesc: {
    fontSize: 15,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default MainScreen; 