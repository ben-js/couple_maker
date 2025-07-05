import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Card, Text, Icon, Avatar } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';

const ReviewsScreen = () => {
  const reviews = [
    {
      id: 1,
      userName: '김소영',
      date: '2024.01.15',
      rating: {
        appearance: 5,
        conversation: 4,
        manners: 5,
        honesty: 4
      },
      tags: ['친화력 좋음', '매너 좋음', '대화 재미있음'],
      comment: '정말 좋은 시간이었어요. 대화도 잘 통하고 매너도 좋으셨어요.',
      wantToMeetAgain: true
    },
    {
      id: 2,
      userName: '이미나',
      date: '2024.01.10',
      rating: {
        appearance: 4,
        conversation: 5,
        manners: 4,
        honesty: 5
      },
      tags: ['대화 잘됨', '성격 좋음'],
      comment: '편안하게 대화할 수 있어서 좋았습니다.',
      wantToMeetAgain: true
    },
    {
      id: 3,
      userName: '박지민',
      date: '2024.01.05',
      rating: {
        appearance: 3,
        conversation: 4,
        manners: 4,
        honesty: 4
      },
      tags: ['괜찮음'],
      comment: '무난했어요.',
      wantToMeetAgain: false
    }
  ];

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>후기</Text>
      <Text style={styles.headerSubtitle}>소개팅 상대가 남긴 후기</Text>
      
      {reviews.map(review => (
        <Card key={review.id} enableShadow style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Avatar size={40} label={review.userName[0]} backgroundColor={colors.primary} labelColor={colors.surface} />
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewUserName}>{review.userName}</Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
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
            {review.tags.map((tag, index) => (
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
    ...typography.h3,
    marginBottom: 2,
  },
  reviewDate: {
    ...typography.small,
  },
  overallRating: {
    alignItems: 'center',
  },
  ratingText: {
    ...typography.h3,
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
    ...typography.bodySmall,
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
    ...typography.small,
  },
  comment: {
    ...typography.bodySmall,
    lineHeight: 20,
    marginBottom: 12,
  },
  meetAgainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetAgainText: {
    ...typography.small,
    marginLeft: 6,
  },
});

export default ReviewsScreen; 