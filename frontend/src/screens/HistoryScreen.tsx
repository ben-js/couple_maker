import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CARD_GAP = 12;
const TAG_GAP = 8;
const LINE_GAP = 12;

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
  const navigation = useNavigation();
  
  const { data: historyData, isLoading, error, refetch } = useHistory(user?.userId, page, filters);
  const [allHistory, setAllHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (page === 1 && historyData?.history) {
      setAllHistory(historyData.history);
    } else if (historyData?.history) {
      setAllHistory(prev => [...prev, ...historyData.history]);
    }
  }, [historyData, page]);

  // 필터 변경/새로고침 시 allHistory 초기화
  useEffect(() => {
    setAllHistory([]);
    setPage(1);
  }, [filters]);

  // 모든 console.log 삭제

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

  // 타입 확장: 태그/장소 등 확장 필드 지원
  interface HistoryCardItem extends HistoryItem {
    dateLocation?: string;
    contactShared?: boolean;
    bothInterested?: boolean;
    reviewSubmitted?: boolean;
  }

  const InfoRow: React.FC<{ label: string; value: string; marginBottom?: number }> = ({ label, value, marginBottom = 0 }) => (
    <View style={[styles.detailRow, { marginBottom }]}> 
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const TagRow: React.FC<{ item: HistoryCardItem; marginBottom?: number }> = ({ item, marginBottom = 0 }) => {
    const tags: string[] = [];
    if (item.contactShared) tags.push('# 연락처 교환');
    if (item.bothInterested) tags.push('# 서로 관심');
    if (item.reviewSubmitted) tags.push('# 후기 작성');
    if (tags.length === 0) return null;
    return (
      <View style={[styles.tagContainer, { marginBottom }]}> 
        {tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const cardItem = item as HistoryCardItem & { partnerName?: string; partner?: { name?: string } };
    return (
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => (navigation as any).navigate('HistoryDetail', { matchPairId: item.matchPairId || item.match_pair_id, history: item })}
      >
        {/* 상단: 이름/상태 */}
        <View style={[styles.itemHeader, { marginBottom: LINE_GAP }]}> 
          <View style={styles.partnerInfo}>
            <View style={styles.partnerDetails}>
              <Text style={styles.partnerName}>
                {cardItem.partnerName || cardItem.partner?.name || cardItem.partnerId || '알 수 없음'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cardItem.status), borderWidth: 0, borderColor: 'transparent'}]}>
            <Text style={styles.statusText}>{getStatusText(cardItem.status)}</Text>
          </View>
        </View>
        {/* 날짜/장소 */}
        <InfoRow label="소개팅 날짜:" value={formatDate(cardItem.createdAt)} marginBottom={LINE_GAP} />
        <InfoRow label="장소:" value={cardItem.dateLocation || '-'} marginBottom={LINE_GAP} />
        {/* 태그 */}
        <TagRow item={cardItem} marginBottom={0} />
      </TouchableOpacity>
    );
  };

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
          data={allHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => `${item.id}-${item.createdAt}`}
          contentContainerStyle={{ ...styles.listContainer, paddingBottom: 16}}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            <>
              {page < (historyData?.pagination?.totalPages || 0) ? (
                <View style={styles.loadingMore}>
                  <Text style={styles.loadingMoreText}>더 많은 기록을 불러오는 중...</Text>
                </View>
              ) : null}
              <View style={{ height: 184 }} />
            </>
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
    marginBottom: CARD_GAP, // 카드 간 간격만 유지
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    paddingBottom: 16, // 카드 내부 하단 여백 최소화
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 0, // 장소 아래 간격 제거
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  detailLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'left',
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
    flex: 2,
    textAlign: 'left',
  },
  itemFooter: {
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TAG_GAP,
    justifyContent: 'flex-end', // 오른쪽 정렬
    alignItems: 'center',
    marginBottom: 0,
    paddingBottom: 0,
    minHeight: 0,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 0,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 20,
    padding: 0,
    margin: 0,
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