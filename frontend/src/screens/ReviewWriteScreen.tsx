import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, Alert, Platform, ToastAndroid, TextInput } from 'react-native';
import { View, Text, TouchableOpacity } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { colors, typography, spacing } from '@/constants';
import { apiPost } from '@/utils/apiUtils';
import PageLayout from '../components/PageLayout';
import PrimaryButton from '../components/PrimaryButton';

interface RouteParams {
  userId: string;
  matchId: string;
}

interface ReviewData {
  rating: {
    appearance: number;
    conversation: number;
    manners: number;
    honesty: number;
  };
  want_to_meet_again: boolean;
  tags: string[];
  comment: string;
}

const ReviewWriteScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userId, matchId } = route.params;

  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: {
      appearance: 0,
      conversation: 0,
      manners: 0,
      honesty: 0,
    },
    want_to_meet_again: null as any,
    tags: [],
    comment: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 평가 항목들
  const ratingItems = [
    { key: 'appearance', label: '외모', icon: 'eye' },
    { key: 'conversation', label: '대화력', icon: 'message-circle' },
    { key: 'manners', label: '매너', icon: 'heart' },
    { key: 'honesty', label: '진정성', icon: 'shield' },
  ];

  // 태그 옵션들
  const tagOptions = [
    '친절해요', '재미있어요', '진지해요', '유머러스해요', '지적이에요',
    '부담스러워요', '무뚝뚝해요', '성의없어요', '거짓말해요', '무례해요'
  ];

  // 별점 렌더링
  const renderStars = (ratingKey: keyof ReviewData['rating'], currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              setReviewData(prev => ({
                ...prev,
                rating: {
                  ...prev.rating,
                  [ratingKey]: star
                }
              }));
            }}
          >
            <Feather
              name={star <= currentRating ? 'star' : 'star'}
              size={24}
              color={star <= currentRating ? colors.primary : colors.border}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 태그 렌더링
  const renderTags = () => {
    return (
      <View style={styles.tagsContainer}>
        {tagOptions.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tag,
              reviewData.tags.includes(tag) && styles.tagSelected
            ]}
            onPress={() => {
              setReviewData(prev => ({
                ...prev,
                tags: prev.tags.includes(tag)
                  ? prev.tags.filter(t => t !== tag)
                  : [...prev.tags, tag]
              }));
            }}
          >
            <Text style={[
              styles.tagText,
              reviewData.tags.includes(tag) && styles.tagTextSelected
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 재만남 의사 버튼
  const renderMeetAgainButtons = () => {
    return (
      <View style={styles.meetAgainContainer}>
        <Text style={styles.sectionTitle}>다시 만나고 싶으신가요?</Text>
        <View style={styles.meetAgainButtons}>
          <TouchableOpacity
            style={[
              styles.meetAgainButton,
              reviewData.want_to_meet_again && styles.meetAgainButtonSelected
            ]}
            onPress={() => setReviewData(prev => ({ ...prev, want_to_meet_again: true }))}
          >
            <Feather name="heart" size={20} color={reviewData.want_to_meet_again ? colors.surface : colors.primary} />
            <Text style={[
              styles.meetAgainButtonText,
              reviewData.want_to_meet_again && styles.meetAgainButtonTextSelected
            ]}>
              네
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.meetAgainButton,
              !reviewData.want_to_meet_again && reviewData.want_to_meet_again !== null && styles.meetAgainButtonSelected
            ]}
            onPress={() => setReviewData(prev => ({ ...prev, want_to_meet_again: false }))}
          >
            <Feather name="user-x" size={20} color={!reviewData.want_to_meet_again && reviewData.want_to_meet_again !== null ? colors.surface : colors.text.primary} />
            <Text style={[
              styles.meetAgainButtonText,
              !reviewData.want_to_meet_again && reviewData.want_to_meet_again !== null && styles.meetAgainButtonTextSelected
            ]}>
              아니오
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 리뷰 제출
  const handleSubmit = async () => {
    // 필수 항목 검증
    if (Object.values(reviewData.rating).some(rating => rating === 0)) {
      Alert.alert('평가를 완료해주세요', '모든 항목에 별점을 매겨주세요.');
      return;
    }

    if (reviewData.want_to_meet_again === null) {
      Alert.alert('재만남 의사를 선택해주세요', '다시 만나고 싶으신지 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiPost('/reviews', {
        match_id: matchId,
        reviewer_id: user?.userId,
        target_id: userId,
        ...reviewData
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show('리뷰가 성공적으로 작성되었습니다!', ToastAndroid.SHORT);
      } else {
        Alert.alert('완료', '리뷰가 성공적으로 작성되었습니다!');
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('리뷰 작성 실패:', error);
      Alert.alert('오류', '리뷰 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모든 필수 값이 입력되었는지 확인
  const isFormValid = useMemo(() => {
    const allRatingsFilled = Object.values(reviewData.rating).every(rating => rating > 0);
    const meetAgainSelected = reviewData.want_to_meet_again !== null;
    const tagsSelected = reviewData.tags.length > 0;
    const commentWritten = reviewData.comment.trim().length > 0;
    return allRatingsFilled && meetAgainSelected && tagsSelected && commentWritten;
  }, [reviewData.rating, reviewData.want_to_meet_again, reviewData.tags, reviewData.comment]);

  return (
    <View style={styles.pageContainer}>
      <PageLayout title="소개팅 후기 작성">
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* 평가 항목들 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>평가해주세요  *</Text>
            {ratingItems.map((item) => (
              <View key={item.key} style={styles.ratingItem}>
                <View style={styles.ratingHeader}>
                  <Feather name={item.icon as any} size={20} color={colors.text.primary} />
                  <Text style={styles.ratingLabel}>{item.label}</Text>
                </View>
                {renderStars(item.key as keyof ReviewData['rating'], reviewData.rating[item.key as keyof ReviewData['rating']])}
              </View>
            ))}
          </View>

                    {/* 태그 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>인상적인 점을 선택해주세요 * (복수 선택 가능)</Text>
            {renderTags()}
          </View>

          {/* 코멘트 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추가 코멘트 *</Text>
            <View style={styles.commentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="소개팅에 대한 추가 의견을 자유롭게 작성해주세요..."
                value={reviewData.comment}
                onChangeText={(text) => setReviewData(prev => ({ ...prev, comment: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* 재만남 의사 */}
          {renderMeetAgainButtons()}

          {/* 스크롤 영역 하단 여백 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </PageLayout>

      {/* 하단 고정 제출 버튼 */}
      <View style={styles.fixedSubmitContainer}>
        <PrimaryButton
          title={isSubmitting ? "제출 중..." : "리뷰 제출하기"}
          onPress={handleSubmit}
          disabled={isSubmitting || !isFormValid}
          style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
          textColor={colors.surface}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 0,
    marginTop: 16,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: 16,
    color: colors.text.primary,
  },
  ratingItem: {
    marginBottom: 24,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    ...typography.body,
    marginLeft: 8,
    color: colors.text.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 4,
  },
  meetAgainContainer: {
    marginTop: 16,
    marginBottom: 0,
    paddingHorizontal: spacing.sm,
  },
  meetAgainButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  meetAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
  },
  meetAgainButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  meetAgainButtonText: {
    ...typography.body,
    marginLeft: 8,
    color: colors.text.primary,
  },
  meetAgainButtonTextSelected: {
    color: colors.surface,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  tagTextSelected: {
    color: colors.surface,
  },
  commentContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  commentInput: {
    padding: 16,
    minHeight: 100,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
  },
  submitContainer: {
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  bottomSpacer: {
    height: 100,
  },
  fixedSubmitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 16,
  },
});

export default ReviewWriteScreen; 