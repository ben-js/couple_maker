import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, ActivityIndicator, Image, Dimensions, FlatList, View as RNView, ScrollView } from 'react-native';
import { View, Text, TouchableOpacity, Chip } from 'react-native-ui-lib';
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

    // 매칭 상세 정보 가져오기
    const fetchMatchDetail = useCallback(async () => {
      if (!matchId || !user?.userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<MatchDetailData>(`/match-detail/${matchId}?userId=${user.userId}`);
        setMatchDetail(response);
      } catch (e: any) {
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

    const photoList = matchDetail?.profile?.photos || [];

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
    <PageLayout title="프로필">
      {/* 프로필 사진 슬라이드 */}
      <PhotoSlider photoList={photoList} />

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

      {/* 이상형 정보 */}
      {(profile.idealType || preference) && (
        <ProfileSection title="이상형">
          {profile.idealType && <Text style={commonStyles.bodyText}>{profile.idealType}</Text>}
          {preference && (
            <View style={commonStyles.chipRow}>
              {preference.ageRange && <Chip label={`나이: ${preference.ageRange.min}~${preference.ageRange.max}세`} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />}
              {preference.heightRange && <Chip label={`키: ${preference.heightRange.min}~${preference.heightRange.max}cm`} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />}
              {preference.regions && preference.regions.length > 0 && <Chip label={`지역: ${preference.regions.join(', ')}`} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />}
              {preference.jobs && preference.jobs.length > 0 && <Chip label={`직업: ${preference.jobs.join(', ')}`} containerStyle={commonStyles.chip} labelStyle={commonStyles.chipLabel} />}
            </View>
          )}
        </ProfileSection>
      )}
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
});

export default UserDetailScreen; 