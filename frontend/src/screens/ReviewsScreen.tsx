import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { View, Card, Text, Icon, Avatar } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';
import { apiGet } from '@/utils/apiUtils';
import { useAuth } from '../store/AuthContext';
import MainLayout from '../components/MainLayout';

const ReviewsScreen = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    setLoading(true);
    apiGet('/reviews', { userId: user.userId }, user.userId)
      .then(setReviews)
      .catch(e => setError(e.message || '후기 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const getAverageRating = (rating: any) => {
    const sum = rating.appearance + rating.conversation + rating.manners + rating.honesty;
    return (sum / 4).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Icon 
        key={i} 
        name={i < rating ? 'star' : 'star-o'} 
        size={12} 
        color={i < rating ? '#FFD700' : colors.text.disabled} 
      />
    ));
  };

  if (loading) {
    return <View flex center><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (error) {
    return <View flex center><Text>{error}</Text></View>;
  }

  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 리뷰 데이터 새로고침
      if (user?.userId) {
        const reviews = await apiGet('/reviews', { userId: user.userId });
        setReviews(reviews);
      }
    } catch (e: any) {
      setError(e.message || '후기 목록을 불러오지 못했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [user?.userId]);

  return (
    <MainLayout onRefresh={handleRefresh} refreshing={refreshing}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>후기</Text>
      <Text style={styles.headerSubtitle}>소개팅 상대가 남긴 후기</Text>
      {reviews.length === 0 && (
        <View flex center><Text>아직 후기가 없습니다.</Text></View>
      )}
      {reviews.map(review => (
        <Card key={review.reviewId} enableShadow style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Avatar size={40} label={review.reviewerId?.[0] || '?'} backgroundColor={colors.primary} labelColor={colors.surface} />
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewUserName}>{review.reviewerId}</Text>
              <Text style={styles.reviewDate}>{review.date || review.createdAt || '-'}</Text>
            </View>
            <View style={styles.overallRating}>
              <Text style={styles.ratingText}>{getAverageRating(review.rating)}</Text>
              <View style={styles.starsContainer}>
                {renderStars(Math.round(Number(getAverageRating(review.rating))))}
              </View>
            </View>
          </View>
          <View style={styles.ratingDetails}>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>외모</Text>
              <View style={styles.starsContainer}>
                {renderStars(review.rating.appearance)}
              </View>
            </View>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>대화</Text>
              <View style={styles.starsContainer}>
                {renderStars(review.rating.conversation)}
              </View>
            </View>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>매너</Text>
              <View style={styles.starsContainer}>
                {renderStars(review.rating.manners)}
              </View>
            </View>
            <View style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>성실성</Text>
              <View style={styles.starsContainer}>
                {renderStars(review.rating.honesty)}
              </View>
            </View>
          </View>
          <View style={styles.tagsContainer}>
            {review.tags?.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.comment}>{review.comment}</Text>
          <View style={styles.meetAgainContainer}>
            <Icon 
              name={review.wantToMeetAgain ? 'heart' : 'heart-o'} 
              size={16} 
              color={review.wantToMeetAgain ? colors.primary : colors.text.disabled} 
            />
            <Text style={styles.meetAgainText}>
              {review.wantToMeetAgain ? '다시 만나고 싶어요' : '다시 만나고 싶지 않아요'}
            </Text>
          </View>
        </Card>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  headerTitle: {
    ...typography.title,
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.disabled,
    marginBottom: 24,
  },
  reviewCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewUserName: {
    ...typography.title,
    marginBottom: 2,
  },
  reviewDate: {
    ...typography.caption,
  },
  overallRating: {
    alignItems: 'center',
  },
  ratingText: {
    ...typography.title,
    color: colors.primary,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingDetails: {
    marginBottom: 16,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    ...typography.caption,
    width: 60,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    ...typography.caption,
  },
  comment: {
    ...typography.caption,
    lineHeight: 20,
    marginBottom: 12,
  },
  meetAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetAgainText: {
    ...typography.caption,
    marginLeft: 6,
  },
});

export default ReviewsScreen; 