import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import LockedCard from '../components/LockedCard';
import MainLayout from '../components/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/apiUtils';
import { useAuth } from '../store/AuthContext';
import { InsightResponse, InsightCard } from '../types/insight';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const useInsight = (userId?: string) =>
  useQuery({
    queryKey: ['insight', userId],
    queryFn: () => apiGet(`/insight/${userId}`, undefined, userId),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });

const InsightCardComponent = ({ card }: { card: InsightCard }) => {
  console.log('인사이트 카드 렌더링:', card);
  
  if (card.isLocked) {
    return (
      <LockedCard
        icon={getCardIcon(card.id)}
        title={card.title}
        description={card.description}
        sample={card.sample}
      />
    );
  }

  return (
    <TouchableOpacity style={styles.insightCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{getCardIcon(card.id)}</Text>
        <Text style={styles.cardTitle}>{card.title}</Text>
      </View>
      <Text style={styles.cardDescription}>{card.description}</Text>
      {card.data && renderCardData(card)}
    </TouchableOpacity>
  );
};

const getCardIcon = (id: string): string => {
  switch (id) {
    case 'personality': return '👤';
    case 'success_rate': return '📊';
    case 'conversation_style': return '💬';
    case 'custom_feedback': return '💡';
    default: return '📋';
  }
};

const renderCardData = (card: InsightCard): React.ReactNode => {
  if (!card.data) return null;

  switch (card.id) {
    case 'personality':
      return (
        <View style={styles.dataContainer}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>총 소개팅:</Text>
            <Text style={styles.dataValue}>{card.data.totalMatches}회</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>성공률:</Text>
            <Text style={styles.dataValue}>{card.data.successRate}%</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>평균 평점:</Text>
            <Text style={styles.dataValue}>{card.data.averageRating}/5.0</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>선호 지역:</Text>
            <Text style={styles.dataValue}>{card.data.favoriteRegion}</Text>
          </View>
        </View>
      );
    
    case 'success_rate':
      return (
        <View style={styles.dataContainer}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>성공률:</Text>
            <Text style={[styles.dataValue, { color: card.data.successRate! >= 50 ? colors.success : colors.error }]}>
              {card.data.successRate}%
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>성공한 매칭:</Text>
            <Text style={styles.dataValue}>{card.data.successfulMatches}회</Text>
          </View>
        </View>
      );
    
    case 'conversation_style':
      return (
        <View style={styles.dataContainer}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>주요 스타일:</Text>
            <Text style={styles.dataValue}>{card.data.dominantStyle}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>리뷰 작성:</Text>
            <Text style={styles.dataValue}>{card.data.totalReviews}회</Text>
          </View>
        </View>
      );
    
    case 'custom_feedback':
      return (
        <View style={styles.dataContainer}>
          <Text style={styles.feedbackText}>{card.data.feedback}</Text>
        </View>
      );
    
    default:
      return null;
  }
};

const InsightScreen: React.FC = () => {
  const { user } = useAuth();
  const { data: insightData, refetch, isLoading, error } = useInsight(user?.userId);
  const [refreshing, setRefreshing] = useState(false);
  
  console.log('인사이트 화면 렌더링:', {
    userId: user?.userId,
    isLoading,
    error,
    insightData
  });
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>인사이트를 분석하고 있습니다...</Text>
        </View>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>인사이트 로딩 중 오류가 발생했습니다.</Text>
          <Text style={styles.loadingText}>{error.message}</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout onRefresh={handleRefresh} refreshing={refreshing}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI 인사이트</Text>
          <Text style={styles.subtitle}>
            {insightData?.totalMatches && insightData.totalMatches > 0 
              ? `${insightData.totalMatches}회의 소개팅 데이터를 기반으로 분석한 결과입니다.`
              : '아직 충분한 소개팅 데이터가 없습니다. 매칭을 시작하면 아래 정보를 AI가 분석해드립니다.'
            }
          </Text>
        </View>

        {insightData?.insightCards?.map((card) => (
          <InsightCardComponent key={card.id} card={card} />
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>해금 조건</Text>
          <Text style={styles.infoText}>• 성향 분석: 소개팅 1회 완료</Text>
          <Text style={styles.infoText}>• 대화 스타일: 소개팅 1회 완료</Text>
          <Text style={styles.infoText}>• 맞춤 피드백: 소개팅 2회 완료</Text>
          <Text style={styles.infoText}>• 성공률 추이: 소개팅 3회 완료</Text>
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    flex: 1,
  },
  cardDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  dataContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  dataValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  feedbackText: {
    ...typography.body,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: 16,
  },
  infoTitle: {
    ...typography.headingMedium,
    color: colors.primary,
    marginBottom: 8,
  },
  infoText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

export default InsightScreen; 