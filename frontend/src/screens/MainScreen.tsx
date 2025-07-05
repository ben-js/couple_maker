import React from 'react';
import { StyleSheet, ScrollView, Image } from 'react-native';
import { View, Card, Text, Button, Avatar, Icon, TouchableOpacity } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { NAVIGATION_ROUTES, colors, typography } from '@/constants';
import { useUserProfile } from '../hooks/useUserProfile';

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { getProfilePhoto, getUserDisplayName, getUserInitial } = useUserProfile();

  // 매칭 상태 (예시 데이터)
  const matchingStatus = {
    currentStep: 2, // 0: 신청완료, 1: 매칭 중, 2: 일정 조율, 3: 소개팅 예정
    steps: ['신청완료', '매칭 중', '일정 조율', '소개팅 예정']
  };

  // 소개팅 팁 데이터
  const datingTips = [
    { id: 1, icon: 'star', title: '데이트룩', subtitle: '첫 만남 스타일링' },
    { id: 2, icon: 'message-circle', title: '대화 주제', subtitle: '편안한 대화 팁' },
    { id: 3, icon: 'map-pin', title: '장소 추천', subtitle: '좋은 만남 장소' },
    { id: 4, icon: 'gift', title: '선물 아이디어', subtitle: '기념품 추천' },
  ];

  // 후기 통계 데이터
  const reviewStats = {
    mannerLevel: '상',
    recentReviews: 3,
    aiFeedback: '친화력 높음',
    conversationSkill: '말문 안 막힘'
  };

  const renderMatchingProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>매칭 진행 상황</Text>
        <View style={styles.progressSteps}>
          {matchingStatus.steps.map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                index <= matchingStatus.currentStep ? styles.progressDotActive : styles.progressDotInactive
              ]}>
                {index < matchingStatus.currentStep && (
                  <Icon name="check" size={12} color={colors.surface} />
                )}
              </View>
              <Text style={[
                styles.progressText,
                index <= matchingStatus.currentStep ? styles.progressTextActive : styles.progressTextInactive
              ]}>
                {step}
              </Text>
              {index < matchingStatus.steps.length - 1 && (
                <View style={[
                  styles.progressLine,
                  index < matchingStatus.currentStep ? styles.progressLineActive : styles.progressLineInactive
                ]} />
              )}
            </View>
          ))}
        </View>
        <Text style={styles.progressSubtitle}>설레는 인연을 준비하고 있어요</Text>
      </View>
    );
  };

  const renderProfileCard = () => {
    return (
      <Card enableShadow style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <Text style={styles.profileCardTitle}>프로필 카드가 도착했어요!</Text>
          <Icon name="mail" size={24} color={colors.primary} />
        </View>
        <View style={styles.profileCardContent}>
          <View style={styles.blurredImage}>
            <Icon name="user" size={40} color={colors.text.disabled} />
          </View>
          <Text style={styles.profileCardDesc}>소개팅 당일 오전 9시에 사진이 공개돼요</Text>
          <Button 
            label="지금 확인하러 가기" 
            style={styles.profileCardButton}
            labelStyle={styles.profileCardButtonText}
            onPress={() => navigation.navigate(NAVIGATION_ROUTES.USER_DETAIL, { userId: 'temp' })}
          />
        </View>
      </Card>
    );
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
            <Text style={styles.welcomeTitle}>{getUserDisplayName()}님, 반가워요</Text>
            <Text style={styles.pointsText}>보유 포인트: {user?.points || 120}P</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.chargeButton}>
            <Text style={styles.chargeButtonText}>충전하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="bell" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 소개팅 신청 CTA */}
      <TouchableOpacity 
        style={styles.ctaButton} 
        onPress={() => navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT)}
      >
        <Text style={styles.ctaButtonText}>지금 소개팅 신청하기</Text>
        <Text style={styles.ctaButtonSubtext}>AI + 매니저가 어울리는 상대를 찾아드려요!</Text>
      </TouchableOpacity>

      {/* 매칭 상태 뷰 */}
      {renderMatchingProgress()}

      {/* 프로필 카드 수신 영역 */}
      {renderProfileCard()}

      {/* 후기/통계 요약 */}
      {renderReviewStats()}

      {/* 하단 여백 */}
      <View style={{ height: 100 }} />
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 12,
  },
  welcomeTitle: {
    ...typography.h3,
    marginBottom: 2,
  },
  pointsText: {
    ...typography.small,
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
    ...typography.buttonSmall,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: {
    ...typography.button,
    marginBottom: 4,
  },
  ctaButtonSubtext: {
    ...typography.caption,
    color: colors.surface,
    opacity: 0.9,
  },
  progressContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  progressTitle: {
    ...typography.h3,
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
    ...typography.small,
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
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  profileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileCardTitle: {
    ...typography.h3,
  },
  profileCardContent: {
    alignItems: 'center',
  },
  blurredImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileCardDesc: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: 16,
  },
  profileCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  profileCardButtonText: {
    ...typography.buttonSmall,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
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
    borderRadius: 16,
    marginRight: 12,
    padding: 16,
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
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipSubtitle: {
    ...typography.small,
    textAlign: 'center',
  },
  statsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
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
    ...typography.small,
    marginLeft: 8,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
});

export default MainScreen; 