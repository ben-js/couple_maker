import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/AuthContext';
import { getHistory } from '../services/historyService';
import { HistoryItem, HistoryFilter } from '../types';
import MainLayout from '../components/MainLayout';
import Skeleton from '../components/Skeleton';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

const { width } = Dimensions.get('window');

const useHistory = (userId?: string, page: number = 1, filters?: HistoryFilter) =>
  useQuery({
    queryKey: ['history', userId, page, filters],
    queryFn: () => getHistory(userId!, page, 10, filters),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });

const HistoryScreen = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<HistoryFilter>({});
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: historyData, isLoading, error, refetch } = useHistory(user?.userId, page, filters);

  // 히스토리 데이터 로깅
  React.useEffect(() => {
    if (historyData?.history) {
      console.log('=== 히스토리 데이터 ===');
      historyData.history.forEach((item, index) => {
        console.log(`[${index + 1}] 매칭 상태: ${item.status}`);
        console.log(`[${index + 1}] 매칭자 user_id: ${item.partnerId}`);
        console.log(`[${index + 1}] 매칭 페어 ID: ${item.matchPairId}`);
        console.log(`[${index + 1}] 파트너 이름: ${item.partner?.name || '알 수 없음'}`);
        console.log(`[${index + 1}] 연락처 교환: ${item.contactShared}`);
        console.log(`[${index + 1}] 서로 관심: ${item.bothInterested}`);
        console.log('---');
      });
    }
  }, [historyData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (historyData?.pagination && page < historyData.pagination.totalPages) {
      setPage(prev => prev + 1);
    }
  }, [historyData?.pagination, page]);

  const handleFilterChange = useCallback((newFilters: HistoryFilter) => {
    setFilters(newFilters);
    setPage(1); // 필터 변경 시 첫 페이지로 리셋
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '소개팅 완료';
      case 'exchanged': return '연락처 교환';
      case 'finished': return '소개팅 종료';
      case 'failed': return '매칭 실패';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.primary;
      case 'exchanged': return colors.success;
      case 'finished': return colors.secondary;
      case 'failed': return colors.error;
      default: return colors.secondary;
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => {
        // 히스토리 상세 화면으로 이동 (추후 구현)
        Alert.alert('히스토리 상세', '상세 정보는 추후 구현 예정입니다.');
      }}
    >
      <View style={styles.itemHeader}>
        <View style={styles.partnerInfo}>
          <View style={styles.partnerDetails}>
            <Text style={styles.partnerName}>
              {item.partner?.name || '알 수 없음'}
            </Text>
            <Text style={styles.partnerAge}>
              {item.partner?.age ? `${item.partner.age}세` : ''}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status), borderWidth: 0, borderColor: 'transparent'}]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>소개팅 날짜:</Text>
          <Text style={styles.detailValue}>{formatDate(item.scheduleDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>장소:</Text>
          <Text style={styles.detailValue}>{item.dateLocation}</Text>
        </View>
        {item.isProposed && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>제안 상태:</Text>
            <Text style={styles.detailValue}>
              {item.confirmProposed ? '제안 수락' : '제안 대기'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.tagContainer}>
          {item.contactShared && (
            <View style={styles.tag}>
              <Text style={styles.tagText}># 연락처 교환</Text>
            </View>
          )}
          {item.bothInterested && (
            <View style={styles.tag}>
              <Text style={styles.tagText}># 서로 관심</Text>
            </View>
          )}
          {item.reviewSubmitted && (
            <View style={styles.tag}>
              <Text style={styles.tagText}># 후기 작성</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>아직 소개팅 히스토리가 없어요</Text>
      <Text style={styles.emptyStateSubtitle}>
        첫 번째 소개팅을 신청하고 히스토리를 만들어보세요!
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} style={styles.skeletonItem} />
      ))}
    </View>
  );

  if (error) {
    return (
      <MainLayout useScrollView={false}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>히스토리를 불러올 수 없습니다</Text>
          <Text style={styles.errorSubtitle}>
            잠시 후 다시 시도해주세요
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout useScrollView={false}>
      <View style={styles.header}>
        <Text style={styles.title}>소개팅 히스토리</Text>
        <Text style={styles.subtitle}>
          총 {historyData?.pagination?.total || 0}건의 소개팅 기록
        </Text>
      </View>

      {isLoading && page === 1 ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={historyData?.history || []}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => `${item.matchPairId}-${item.timestamp}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            page < (historyData?.pagination?.totalPages || 0) ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>더 많은 기록을 불러오는 중...</Text>
              </View>
            ) : null
            }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 10,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.background,
  },
  listContainer: {
    marginTop: 16,
    paddingBottom: 80,
  },
  historyItem: {
    backgroundColor: '#F8FBFF', // 연한 파랑
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  partnerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  partnerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imagePlaceholder: {
    fontSize: 20,
  },
  partnerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  partnerName: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  partnerAge: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  partnerLocation: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  itemDetails: {  
    marginTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 0,
  },
  detailLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  itemFooter: {
    paddingTop: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingHorizontal: 20,
  },
  skeletonItem: {
    height: 120,
    marginBottom: 12,
    borderRadius: 12,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.background,
  },
});

export default HistoryScreen; 