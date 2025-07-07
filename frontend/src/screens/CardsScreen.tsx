import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TextInput, Image, RefreshControl } from 'react-native';
import { View, Card, Text, Avatar, TouchableOpacity, Chip } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '@/constants';
import { apiGet } from '@/utils/apiUtils';
import { useAuth } from '../store/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';

// 타입 정의
interface CardData {
  userId: string;
  name?: string;
  age?: number;
  job?: string;
  region?: string;
  district?: string;
  photoUrl?: string;
  photos?: string[];
  status: 'pending' | 'revealed' | 'expired';
  isDeleted?: boolean;
  matchId: string;
  date?: string;
}

interface PaginationData {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface CardsResponse {
  cards: CardData[];
  pagination?: PaginationData;
}

interface SearchFilters {
  search: string;
  status: string;
}

// 상태 옵션 상수
const STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기 중' },
  { key: 'revealed', label: '공개됨' },
  { key: 'expired', label: '만료됨' },
] as const;

// 카드 컴포넌트
const CardItem: React.FC<{
  card: CardData;
  onPress: (card: CardData) => void;
}> = React.memo(({ card, onPress }) => {
  const photoUrl = card.photoUrl || (card.photos && card.photos[0]);
  
  if (!photoUrl) return null;

  const handlePress = useCallback(() => {
    onPress(card);
  }, [card, onPress]);

  const getStatusStyle = useMemo(() => {
    return card.status === 'revealed' ? styles.statusRevealed : styles.statusPending;
  }, [card.status]);

  const getStatusText = useMemo(() => {
    return card.status === 'revealed' ? '공개됨' : '대기 중';
  }, [card.status]);

  return (
    <TouchableOpacity
      style={styles.cardSquareTouchable}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={styles.cardSquareBox}>
        <Image 
          source={{ uri: photoUrl }} 
          style={styles.cardSquareImage} 
          resizeMode="cover" 
        />
        <View style={styles.cardOverlay}>
          <View style={styles.overlayTextWrap}>
            <View style={styles.overlayTextLeft}>
              <Text style={styles.overlayNameAge}>
                {card.name || ''}{card.age ? ` | ${card.age}세` : ''}
              </Text>
              <Text style={styles.overlayJob}>{card.job || ''}</Text>
              <Text style={styles.overlayRegion}>
                {card.region || ''} {card.district || ''}
              </Text>
            </View>
            <View style={styles.overlayStatusRow}>
              <Text style={[styles.overlayStatus, getStatusStyle]}>
                {getStatusText}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 검색 컴포넌트
const SearchSection: React.FC<{
  searchText: string;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
}> = React.memo(({ searchText, onSearchChange, onClearSearch }) => (
  <View style={styles.searchContainer}>
    <Feather name="search" size={20} color={colors.text.disabled} style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder="이름, 직업, 지역으로 검색"
      value={searchText}
      onChangeText={onSearchChange}
      placeholderTextColor={colors.text.disabled}
    />
    {searchText.length > 0 && (
      <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
        <Feather name="x" size={16} color={colors.text.disabled} />
      </TouchableOpacity>
    )}
  </View>
));

// 필터 컴포넌트
const FilterSection: React.FC<{
  showFilters: boolean;
  selectedStatus: string;
  onToggleFilters: () => void;
  onStatusChange: (status: string) => void;
}> = React.memo(({ showFilters, selectedStatus, onToggleFilters, onStatusChange }) => (
  <>
    <TouchableOpacity style={styles.filterButton} onPress={onToggleFilters}>
      <Feather name="filter" size={20} color={colors.primary} />
      <Text style={styles.filterButtonText}>필터</Text>
    </TouchableOpacity>
    
    {showFilters && (
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>상태별 필터</Text>
        <View style={styles.chipContainer}>
          {STATUS_OPTIONS.map(option => (
            <Chip
              key={option.key}
              label={option.label}
              containerStyle={[
                styles.statusChip,
                selectedStatus === option.key && styles.statusChipActive
              ]}
              labelStyle={[
                styles.statusChipLabel,
                selectedStatus === option.key && styles.statusChipLabelActive
              ]}
              onPress={() => onStatusChange(option.key)}
            />
          ))}
        </View>
      </View>
    )}
  </>
));

// 빈 상태 컴포넌트
const EmptyState: React.FC<{
  hasFilters: boolean;
  searchText: string;
}> = React.memo(({ hasFilters, searchText }) => (
  <View style={styles.emptyContainer}>
    <Feather name="inbox" size={48} color={colors.text.disabled} />
    <Text style={styles.emptyText}>
      {hasFilters ? '검색 결과가 없습니다.' : '카드가 없습니다.'}
    </Text>
  </View>
));

// 메인 컴포넌트
const CardsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  
  // 상태 관리
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  
  // 필터/검색 상태
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // API 호출 함수
  const fetchCards = useCallback(async (
    search?: string, 
    status?: string, 
    isRefresh: boolean = false
  ) => {
    if (!user?.id) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    const params: Record<string, any> = { userId: user.id };
    
    if (search && search.trim()) {
      params.search = search.trim();
    }
    
    if (status && status !== 'all') {
      params.status = status;
    }
    
    try {
      const response = await apiGet<CardsResponse>('/cards', params);
      console.log('[카드함] API 응답:', response);
      
      if (response.cards) {
        setCards(response.cards);
        setPagination(response.pagination || null);
      } else {
        // 기존 형식 호환성
        setCards(response as any);
        setPagination(null);
      }
    } catch (e: any) {
      console.error('[카드함] API 에러:', e);
      setError(e.message || '카드 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // 초기 로드
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // 검색어 변경 시 API 호출 (디바운스)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCards(searchText, selectedStatus);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText, selectedStatus, fetchCards]);

  // 카드 클릭 핸들러
  const handleCardPress = useCallback((card: CardData) => {
    if (card.isDeleted === true) {
      return; // 탈퇴한 회원은 클릭 불가
    }
    navigation.navigate('UserDetail', { 
      userId: card.userId,
      matchId: card.matchId 
    });
  }, [navigation]);

  // 검색 초기화
  const handleClearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  // 필터 토글
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // 상태 변경
  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
  }, []);

  // 새로고침
  const handleRefresh = useCallback(() => {
    fetchCards(searchText, selectedStatus, true);
  }, [fetchCards, searchText, selectedStatus]);

  // 필터 적용 여부
  const hasActiveFilters = useMemo(() => {
    return searchText.length > 0 || selectedStatus !== 'all';
  }, [searchText, selectedStatus]);

  // 결과 카운트 텍스트
  const resultCountText = useMemo(() => {
    const count = pagination ? pagination.total : cards.length;
    const loadingText = loading && cards.length > 0 ? ' (업데이트 중...)' : '';
    return `${count}개의 카드${loadingText}`;
  }, [pagination, cards.length, loading]);

  // 로딩 상태
  if (loading && cards.length === 0) {
    return (
      <View flex center>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 에러 상태
  if (error && cards.length === 0) {
    return (
      <View flex center>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCards()}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={styles.headerTitle}>카드함</Text>
      <Text style={styles.headerSubtitle}>소개팅 상대의 프로필 카드</Text>
      
      {/* 검색 및 필터 섹션 */}
      <View style={styles.searchSection}>
        <SearchSection
          searchText={searchText}
          onSearchChange={setSearchText}
          onClearSearch={handleClearSearch}
        />
        <FilterSection
          showFilters={showFilters}
          selectedStatus={selectedStatus}
          onToggleFilters={handleToggleFilters}
          onStatusChange={handleStatusChange}
        />
      </View>

      {/* 결과 카운트 */}
      <Text style={styles.resultCount}>{resultCountText}</Text>

      {/* 카드 목록 */}
      {cards.length === 0 && !loading ? (
        <EmptyState hasFilters={hasActiveFilters} searchText={searchText} />
      ) : (
        cards.map(card => (
          <CardItem
            key={card.userId}
            card={card}
            onPress={handleCardPress}
          />
        ))
      )}
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  headerTitle: {
    ...typography.h1,
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.disabled,
    marginBottom: 24,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterButtonText: {
    marginLeft: 4,
    color: colors.primary,
    fontWeight: '500',
  },
  filterSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    ...typography.h3,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipLabel: {
    color: colors.text.primary,
  },
  statusChipLabelActive: {
    color: colors.surface,
  },
  resultCount: {
    ...typography.bodySmall,
    color: colors.text.disabled,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.disabled,
    marginTop: 12,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  cardSquareTouchable: {
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  cardSquareBox: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardSquareImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 0,
  },
  overlayTextWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  overlayTextLeft: {
    flex: 1,
  },
  overlayStatusRow: {
    alignItems: 'flex-end',
  },
  overlayStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    opacity: 0.8,
  },
  statusRevealed: {
    backgroundColor: '#E94F4F',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: '#bbb',
    color: '#fff',
  },
  overlayNameAge: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  overlayJob: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
  },
  overlayRegion: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
  },
});

export default CardsScreen; 