import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, FlatList, View as RNView } from 'react-native';
import { View, Text, TouchableOpacity, Chip } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '@/constants';
import { apiGet } from '@/utils/apiUtils';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { ProfileData } from '@/types/profile';
import { PreferenceData } from '@/types/preference';
import { MatchDetailData } from '@/types/match';

interface RouteParams {
  userId: string;
  matchId: string;
}

const { width: screenWidth } = Dimensions.get('window');

const UserDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userId, matchId } = route.params;

  const [matchDetail, setMatchDetail] = useState<MatchDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 매칭 상세 정보 가져오기
  const fetchMatchDetail = useCallback(async () => {
    if (!matchId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<MatchDetailData>(`/match-detail/${matchId}?userId=${user.id}`);
      setMatchDetail(response);
    } catch (e: any) {
      setError(e.message || '프로필 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [matchId, user?.id]);

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

  // 사진 슬라이드 상태
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoList = matchDetail?.profile?.photos || [];
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setPhotoIndex(viewableItems[0].index || 0);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // --- 사진 갤러리(카드형) UI 상수 정리 ---
  const GALLERY_SECTION_PADDING = 24; // section과 맞추려면 24
  const GALLERY_CARD_MARGIN = 0;      // 카드 style의 marginHorizontal (최종 중앙정렬은 0)
  const GALLERY_CARD_SPACING = 10;    // 카드 사이 여백
  const GALLERY_CARD_WIDTH = screenWidth * 0.9; // 카드(사진) width

  if (loading) return (<View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text></View>);
  if (error || !matchDetail) return (<View style={styles.errorContainer}><Feather name="alert-circle" size={48} color={colors.error} /><Text style={styles.errorText}>{error || '프로필 정보를 불러올 수 없습니다.'}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchMatchDetail}><Text style={styles.retryButtonText}>다시 시도</Text></TouchableOpacity></View>);

  const { profile, preference } = matchDetail;
  if (!profile) return null;
  const age = profile?.age || calculateAge(profile?.birthDate);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 사진 슬라이드 */}
      {photoList.length > 1 ? (
        <RNView style={styles.photoSliderWrap}>
          <FlatList
            data={photoList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{
                  width: GALLERY_CARD_WIDTH,
                  height: 320,
                  borderRadius: 24,
                  marginHorizontal: 0,
                  backgroundColor: '#eee',
                }}
                resizeMode="cover"
              />
            )}
            ItemSeparatorComponent={() => <RNView style={{ width: GALLERY_CARD_SPACING }} />}
            contentContainerStyle={{
              paddingHorizontal: (screenWidth - GALLERY_CARD_WIDTH) / 2,
              alignItems: 'center',
            }}
            snapToInterval={GALLERY_CARD_WIDTH + GALLERY_CARD_SPACING}
            decelerationRate="fast"
            snapToAlignment="start"
            pagingEnabled={false}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewConfigRef.current}
          />
          {/* 인디케이터 */}
          <RNView style={styles.photoIndicatorRow}>
            {photoList.map((_, idx) => (
              <RNView key={idx} style={[styles.photoDot, photoIndex === idx && styles.photoDotActive]} />
            ))}
          </RNView>
        </RNView>
      ) : (
        photoList.length === 1 && (
          <Image source={{ uri: photoList[0] }} style={styles.profilePhotoWide} resizeMode="cover" />
        )
      )}

      {/* introduction(자기소개) */}
      {profile.introduction && (
        <View style={styles.introductionBubble}>
          <Text style={styles.introductionBubbleText}>{profile.introduction}</Text>
        </View>
      )}

      {/* 기본 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        <View style={styles.chipRow}>
          {basicChips.map((chip, idx) => (
            <Chip key={idx} label={chip as string} containerStyle={styles.chip} labelStyle={styles.chipLabel} />
          ))}
        </View>
      </View>

      {/* 상세 정보 */}
      {(detailChips.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나는 이런 사람!</Text>
          <View style={styles.chipRow}>
            {detailChips.map((chip, idx) => (
              <Chip key={idx} label={chip as string} containerStyle={styles.chip} labelStyle={styles.chipLabel} />
            ))}
          </View>

        </View>
      )}

      {/* 관심사 */}
      {interestChips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>요즘 관심있는 것은</Text>
          <View style={styles.chipRow}>
            {interestChips.map((chip, idx) => (
              <Chip key={idx} label={chip as string} containerStyle={styles.chip} labelStyle={styles.chipLabel} />
            ))}
          </View>
        </View>
      )}

      {/* 이상형 정보 */}
      {(profile.idealType || preference) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이상형</Text>
          {profile.idealType && <Text style={styles.introductionText}>{profile.idealType}</Text>}
          {preference && (
            <View style={styles.chipRow}>
              {preference.ageRange && <Chip label={`나이: ${preference.ageRange.min}~${preference.ageRange.max}세`} containerStyle={styles.chip} labelStyle={styles.chipLabel} />}
              {preference.heightRange && <Chip label={`키: ${preference.heightRange.min}~${preference.heightRange.max}cm`} containerStyle={styles.chip} labelStyle={styles.chipLabel} />}
              {preference.regions && preference.regions.length > 0 && <Chip label={`지역: ${preference.regions.join(', ')}`} containerStyle={styles.chip} labelStyle={styles.chipLabel} />}
              {preference.jobs && preference.jobs.length > 0 && <Chip label={`직업: ${preference.jobs.join(', ')}`} containerStyle={styles.chip} labelStyle={styles.chipLabel} />}
            </View>
          )}
        </View>
      )}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { ...typography.body, color: colors.text.disabled, marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', marginTop: 16, marginBottom: 24 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: colors.surface, fontWeight: '600' },
  photoSliderWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 16,
  },
  profilePhotoWide: {
    width: screenWidth * 0.80,
    height: 320,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginLeft: 0,
    marginRight: 0,
    backgroundColor: '#eee',
  },
  photoIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  photoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  photoDotActive: {
    backgroundColor: colors.primary,
  },
  section: { backgroundColor: colors.surface, marginTop: 16, paddingHorizontal: 24, paddingVertical: 20, borderRadius: 16 },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { marginRight: 8, marginBottom: 8, backgroundColor: '#f3f3f3', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0 },
  chipLabel: { color: colors.text.disabled, fontSize: 15 },
  introductionText: { ...typography.body, color: colors.text.primary, lineHeight: 24, marginTop: 8 },
  introductionBubble: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'stretch',
    width: '90%',
  },
  introductionBubbleText: {
    color: colors.text.disabled,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
});

export default UserDetailScreen; 