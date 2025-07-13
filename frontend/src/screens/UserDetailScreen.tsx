import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, ActivityIndicator, Image, Dimensions, FlatList, View as RNView, ScrollView, Alert, Platform, ToastAndroid } from 'react-native';
import { View, Text, TouchableOpacity, Chip, Dialog, Button } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '@/constants';
import { commonStyles } from '@/constants/commonStyles';
import { apiGet } from '@/utils/apiUtils';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { MatchDetailData } from '@/types/match';
import PhotoSlider from '../components/PhotoSlider';
import PageLayout from '../components/PageLayout';
import ProfileSection from '../components/ProfileSection';
import * as Clipboard from 'expo-clipboard';

interface RouteParams {
  userId: string;
  matchId: string;
}

const UserDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userId, matchId } = route.params;

  const [matchDetail, setMatchDetail] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [showCopyModal, setShowCopyModal] = useState(false);

  // 매칭 상세 정보 가져오기
  const fetchMatchDetail = useCallback(async () => {
      if (!matchId || !user?.userId) {
        console.log('[UserDetailScreen] matchId 또는 userId 없음:', { matchId, userId: user?.userId });
        setError('매칭 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
    setLoading(true);
    setError(null);
    try {
        console.log('[UserDetailScreen] API 호출 시작:', { matchId, userId: user.userId });
      const response = await apiGet<MatchDetailData>(`/match-detail/${matchId}?userId=${user.userId}`, undefined, user.userId);
        console.log('[UserDetailScreen] API 응답:', JSON.stringify(response, null, 2));
      setMatchDetail(response);
    } catch (e: any) {
        console.error('[UserDetailScreen] API 에러:', e);
      setError(e.message || '프로필 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [matchId, user?.userId]);

  useEffect(() => { fetchMatchDetail(); }, [fetchMatchDetail]);

  const calculateAge = (birthDate?: { year: number; month: number; day: number }): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate.year, birthDate.month - 1, birthDate.day);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

    // 소개팅 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = date.getHours();
        const ampm = hours >= 12 ? '오후' : '오전';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        
        return `${year}.${month}.${day} ${ampm} ${displayHours}시`;
      } catch (error) {
        return dateString; // 파싱 실패시 원본 반환
      }
    };

  const photoList = matchDetail?.profile?.photos || [];

    // 디버깅용: matchDetail 데이터 확인
    useEffect(() => {
      console.log('[UserDetailScreen] matchDetail 상태 변경:', { 
        matchDetail: !!matchDetail, 
        loading, 
        error 
      });
      
      if (matchDetail) {
        console.log('[UserDetailScreen] matchDetail 전체 데이터:', JSON.stringify(matchDetail, null, 2));
        console.log('[UserDetailScreen] finalDate:', matchDetail.finalDate);
        console.log('[UserDetailScreen] dateAddress:', matchDetail.dateAddress);

        // 조건부 렌더링 조건 확인
        const hasFinalDate = !!matchDetail.finalDate;
        const hasDateAddress = !!matchDetail.dateAddress;
        const shouldShow = hasFinalDate && hasDateAddress;
        
        console.log('[UserDetailScreen] 조건 확인:', {
          hasFinalDate,
          hasDateAddress,
          shouldShow,
          finalDateValue: matchDetail.finalDate,
          dateAddressValue: matchDetail.dateAddress
        });
      }
    }, [matchDetail, loading, error]);

  if (loading) return (<View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text></View>);
  if (error || !matchDetail) return (<View style={styles.errorContainer}><Feather name="alert-circle" size={48} color={colors.error} /><Text style={styles.errorText}>{error || '프로필 정보를 불러올 수 없습니다.'}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchMatchDetail}><Text style={styles.retryButtonText}>다시 시도</Text></TouchableOpacity></View>);

  const { profile, preference } = matchDetail;
  if (!profile) return null;
  const age = profile?.age || calculateAge(profile?.birthDate);

  // 안내 문구 표시 조건
  const showWaitingReviewMsg = matchDetail?.status === 'review' && !matchDetail?.bothReviewed;

  // 기본 정보 칩 데이터
  const basicChips = [
    profile.name,
    age ? `${age}세` : undefined,
    profile.job,
    profile.region ? `${profile.region.region} ${profile.region.district}` : undefined,
    profile.height ? `${profile.height}cm` : undefined,
    profile.education,
    profile.company
  ].filter(Boolean);

  // 상세 정보 칩 데이터
  const detailChips = [
    profile.mbti,
    profile.smoking,
    profile.drinking,
    profile.religion,
    ...(profile.personality || []),
    ...(profile.favoriteFoods || [])
  ].filter(Boolean);

  // 관심사 칩 데이터
  const interestChips = (profile.interests || []).filter(Boolean);

    // 클립보드 복사 함수
    const handleCopyAddress = async () => {
      if (matchDetail?.dateAddress) {
        try {
          await Clipboard.setStringAsync(matchDetail.dateAddress);
          setShowCopyModal(false);
          
          if (Platform.OS === 'android') {
            ToastAndroid.show('클립보드에 저장되었습니다', ToastAndroid.SHORT);
          } else {
            Alert.alert('알림', '클립보드에 저장되었습니다');
          }
        } catch (error) {
          console.error('클립보드 복사 실패:', error);
          if (Platform.OS === 'android') {
            ToastAndroid.show('클립보드 복사에 실패했습니다', ToastAndroid.SHORT);
          } else {
            Alert.alert('오류', '클립보드 복사에 실패했습니다');
          }
        }
      }
    };

  return (
    <PageLayout title="프로필">
        {/* 프로필 사진 슬라이드 */}
      <PhotoSlider photoList={photoList} />

      {/* 소개팅 장소 박스 */}
      {(matchDetail?.finalDate && matchDetail?.dateAddress) && (
        <TouchableOpacity 
          style={styles.scheduleTipBox}
          onPress={() => setShowCopyModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.scheduleTipHeader}>
            <Text style={styles.scheduleTipIcon}>💡</Text>
            <Text style={styles.scheduleTipTitle}>소개팅 장소</Text>
          </View>
          {matchDetail.finalDate && (
            <Text style={styles.scheduleTipText}>
              소개팅 날짜: {formatDate(matchDetail.finalDate)}
            </Text>
          )}
          {matchDetail.dateAddress && (
            <Text style={styles.scheduleTipText}>
              소개팅 장소: {matchDetail.dateAddress}
            </Text>
          )}
        </TouchableOpacity>
        )}

        {/* 리뷰 대기 안내 문구 */}
        {showWaitingReviewMsg && (
          <View style={styles.waitingReviewMsgBox}>
            <Text style={styles.waitingReviewMsgText}>
              상대방이 리뷰를 아직 작성하지 않았습니다. 조금만더 기다려 주세요.
            </Text>
          </View>
        )}

        {/* introduction(자기소개) */}
        {profile.introduction && (
        <ProfileSection title="자기소개">
          <Text style={{ color: '#222', fontSize: 16 }}>{profile.introduction}</Text>
        </ProfileSection>
        )}

        {/* 기본 정보 */}
      <ProfileSection title="기본 정보">
        <View style={commonStyles.chipRow}>
            {basicChips.map((chip, idx) => (
            <Chip key={idx} label={chip as string} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />
            ))}
        </View>
      </ProfileSection>

        {/* 상세 정보 */}
      {detailChips.length > 0 && (
        <ProfileSection title="나는 이런 사람!">
          <View style={commonStyles.chipRow}>
              {detailChips.map((chip, idx) => (
              <Chip key={idx} label={chip as string} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />
              ))}
          </View>
        </ProfileSection>
        )}

        {/* 관심사 */}
        {interestChips.length > 0 && (
        <ProfileSection title="요즘 관심있는 것은">
          <View style={commonStyles.chipRow}>
              {interestChips.map((chip: string, idx: number) => (
              <Chip key={idx} label={chip as string} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />
              ))}
          </View>
        </ProfileSection>
        )}

      {/* 클립보드 복사 모달 */}
      <Dialog
        visible={showCopyModal}
        onDismiss={() => setShowCopyModal(false)}
        containerStyle={styles.copyModalContainer}
        width={320}
        panDirection={null}
      >
        <View style={styles.copyModalContent}>
          <View style={styles.copyModalHeader}>
            <Text style={styles.copyModalTitle}>주소 복사</Text>
            <TouchableOpacity 
              onPress={() => setShowCopyModal(false)}
              style={styles.copyModalCloseButton}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
              </View>
          <Text style={styles.copyModalText}>
            소개팅 장소 주소를 클립보드에 복사하시겠습니까?
          </Text>
          <View style={styles.copyModalButtonContainer}>
            <Button
              label="확인"
              onPress={handleCopyAddress}
              style={styles.copyModalConfirmButton}
              labelStyle={styles.copyModalConfirmButtonText}
            />
          </View>
        </View>
      </Dialog>

    </PageLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { ...typography.body, color: colors.text.disabled, marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: colors.surface, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.title,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  // 소개팅 장소 팁 박스 스타일
  scheduleTipBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    alignItems: 'center',
  },
  scheduleTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scheduleTipIcon: {
    fontSize: 12,
    lineHeight: 22,
    marginRight: 5,
  },
  scheduleTipTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
  },
  scheduleTipText: {
    marginBottom: 2,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  // 클립보드 복사 모달 스타일
  copyModalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  copyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  copyModalTitle: {
    ...typography.title,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  copyModalCloseButton: {
    padding: 4,
  },
  copyModalText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  copyModalButtonContainer: {
    width: '100%',
  },
  copyModalConfirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  copyModalConfirmButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // 리뷰 대기 안내 문구 스타일
  waitingReviewMsgBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  waitingReviewMsgText: {
    color: '#E65100',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default UserDetailScreen; 