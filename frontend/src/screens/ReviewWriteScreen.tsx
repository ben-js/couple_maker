import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Alert, Platform, ToastAndroid, TextInput, KeyboardAvoidingView, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
  // AI 인사이트를 위한 추가 필드들
  overall_satisfaction: number;
  date_duration: string;
  location_satisfaction: number;
  conversation_initiative: string;
  first_impression_vs_reality: string;
  success_failure_factors: string[];
}

const ReviewWriteScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { userId, matchId, readonly = false, review } = route.params;




  const [reviewData, setReviewData] = useState<ReviewData>(() => {
    if (readonly && review) {
      const initialData = {
        rating: {
          appearance: review.rating?.appearance || 0,
          conversation: review.rating?.conversation || 0,
          manners: review.rating?.manners || 0,
          honesty: review.rating?.honesty || 0,
        },
        want_to_meet_again: review.want_to_meet_again,
        tags: review.tags || [],
        comment: review.comment || '',
        // 누락된 필드들에 기본값 설정
        overall_satisfaction: review.overall_satisfaction || 0,
        date_duration: review.date_duration || '',
        location_satisfaction: review.location_satisfaction || 0,
        conversation_initiative: review.conversation_initiative || '',
        first_impression_vs_reality: review.first_impression_vs_reality || '',
        success_failure_factors: review.success_failure_factors || [],
      };
      return initialData;
    } else {
      return {
        rating: {
          appearance: 0,
          conversation: 0,
          manners: 0,
          honesty: 0,
        },
        want_to_meet_again: null as any,
        tags: [],
        comment: '',
        overall_satisfaction: 0,
        date_duration: '',
        location_satisfaction: 0,
        conversation_initiative: '',
        first_impression_vs_reality: '',
        success_failure_factors: [],
      };
    }
  });



  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<KeyboardAwareScrollView | null>(null);
  const commentInputRef = useRef<TextInput>(null);

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

  // AI 인사이트를 위한 추가 옵션들
  const dateDurationOptions = [
    '30분 미만', '30분-1시간', '1시간-2시간', '2시간 이상'
  ];

  const conversationInitiativeOptions = [
    '나', '상대방', '비슷함'
  ];

  const firstImpressionOptions = [
    '더 좋아짐', '비슷함', '실망'
  ];

  const successFactorOptions = [
    '대화', '외모', '매너', '장소', '기타'
  ];





  // 별점 렌더링
  const renderStars = (ratingKey: keyof ReviewData['rating'], currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              if (!readonly) {
                setReviewData(prev => ({
                  ...prev,
                  rating: {
                    ...prev.rating,
                    [ratingKey]: star
                  }
                }));
              }
            }}
            disabled={readonly}
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
              reviewData.tags?.includes(tag) && styles.tagSelected
            ]}
            onPress={() => {
              if (!readonly) {
                setReviewData(prev => ({
                  ...prev,
                  tags: prev.tags?.includes(tag)
                    ? prev.tags.filter(t => t !== tag)
                    : [...(prev.tags || []), tag]
                }));
              }
            }}
            disabled={readonly}
          >
            <Text style={[
              styles.tagText,
              reviewData.tags?.includes(tag) && styles.tagTextSelected
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
            onPress={() => {
              if (!readonly) {
                setReviewData(prev => ({ ...prev, want_to_meet_again: true }));
              }
            }}
            disabled={readonly}
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
            onPress={() => {
              if (!readonly) {
                setReviewData(prev => ({ ...prev, want_to_meet_again: false }));
              }
            }}
            disabled={readonly}
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

  // 전체 만족도 렌더링
  const renderOverallSatisfaction = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>전체적인 소개팅 만족도 *</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => {
                if (!readonly) {
                  setReviewData(prev => ({
                    ...prev,
                    overall_satisfaction: star
                  }));
                }
              }}
              disabled={readonly}
            >
              <Feather
                name={star <= reviewData.overall_satisfaction ? 'star' : 'star'}
                size={24}
                color={star <= reviewData.overall_satisfaction ? colors.primary : colors.border}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 소개팅 지속 시간 렌더링
  const renderDateDuration = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>소개팅 지속 시간 *</Text>
        <View style={styles.dateDurationContainer}>
          <View style={styles.dateDurationRow}>
            {dateDurationOptions.slice(0, 2).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dateDurationButton,
                  reviewData.date_duration === option && styles.dateDurationButtonSelected
                ]}
                onPress={() => {
                  if (!readonly) {
                    setReviewData(prev => ({ ...prev, date_duration: option }));
                  }
                }}
                disabled={readonly}
              >
                <Text style={[
                  styles.dateDurationButtonText,
                  reviewData.date_duration === option && styles.dateDurationButtonTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dateDurationRow}>
            {dateDurationOptions.slice(2, 4).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dateDurationButton,
                  reviewData.date_duration === option && styles.dateDurationButtonSelected
                ]}
                onPress={() => {
                  if (!readonly) {
                    setReviewData(prev => ({ ...prev, date_duration: option }));
                  }
                }}
                disabled={readonly}
              >
                <Text style={[
                  styles.dateDurationButtonText,
                  reviewData.date_duration === option && styles.dateDurationButtonTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // 장소 만족도 렌더링
  const renderLocationSatisfaction = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>선택된 장소 만족도 *</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => {
                if (!readonly) {
                  setReviewData(prev => ({
                    ...prev,
                    location_satisfaction: star
                  }));
                }
              }}
              disabled={readonly}
            >
              <Feather
                name={star <= reviewData.location_satisfaction ? 'star' : 'star'}
                size={24}
                color={star <= reviewData.location_satisfaction ? colors.primary : colors.border}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 대화 주도성 렌더링
  const renderConversationInitiative = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>대화 주도성 *</Text>
        <View style={styles.conversationInitiativeContainer}>
          {conversationInitiativeOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.conversationInitiativeButton,
                reviewData.conversation_initiative === option && styles.conversationInitiativeButtonSelected
              ]}
              onPress={() => {
                if (!readonly) {
                  setReviewData(prev => ({ ...prev, conversation_initiative: option }));
                }
              }}
              disabled={readonly}
            >
              <Text style={[
                styles.conversationInitiativeButtonText,
                reviewData.conversation_initiative === option && styles.conversationInitiativeButtonTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 첫인상 vs 실제인상 렌더링
  const renderFirstImpressionVsReality = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>첫인상 vs 실제인상 *</Text>
        <View style={styles.firstImpressionContainer}>
          {firstImpressionOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.firstImpressionButton,
                reviewData.first_impression_vs_reality === option && styles.firstImpressionButtonSelected
              ]}
              onPress={() => {
                if (!readonly) {
                  setReviewData(prev => ({ ...prev, first_impression_vs_reality: option }));
                }
              }}
              disabled={readonly}
            >
              <Text style={[
                styles.firstImpressionButtonText,
                reviewData.first_impression_vs_reality === option && styles.firstImpressionButtonTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 소개팅 성공/실패 요인 렌더링
  const renderSuccessFactors = () => {
    const title = '소개팅 성공/실패 요인 * (복수 선택 가능)';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.tagsContainer}>
          {successFactorOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.tag,
                reviewData.success_failure_factors?.includes(option) && styles.tagSelected
              ]}
              onPress={() => {
                if (!readonly) {
                  setReviewData(prev => ({
                    ...prev,
                    success_failure_factors: prev.success_failure_factors?.includes(option)
                      ? prev.success_failure_factors.filter(factor => factor !== option)
                      : [...(prev.success_failure_factors || []), option]
                  }));
                }
              }}
              disabled={readonly}
            >
              <Text style={[
                styles.tagText,
                reviewData.success_failure_factors?.includes(option) && styles.tagTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
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

    if (reviewData.overall_satisfaction === 0) {
      Alert.alert('전체 만족도를 선택해주세요', '전체적인 소개팅 만족도를 평가해주세요.');
      return;
    }

    if (reviewData.date_duration === '') {
      Alert.alert('소개팅 지속 시간을 선택해주세요', '소개팅이 얼마나 지속되었는지 선택해주세요.');
      return;
    }

    if (reviewData.location_satisfaction === 0) {
      Alert.alert('장소 만족도를 선택해주세요', '선택된 장소에 대한 만족도를 평가해주세요.');
      return;
    }

    if (reviewData.conversation_initiative === '') {
      Alert.alert('대화 주도성을 선택해주세요', '누가 대화를 주도했는지 선택해주세요.');
      return;
    }

    if (reviewData.first_impression_vs_reality === '') {
      Alert.alert('첫인상 vs 실제인상을 선택해주세요', '첫인상과 실제 만난 후 인상의 차이를 선택해주세요.');
      return;
    }

    if (!reviewData.success_failure_factors?.length) {
      Alert.alert('소개팅 성공/실패 요인을 선택해주세요', '소개팅 성공/실패의 주요 원인을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {


      const response = await apiPost('/reviews', {
        match_id: matchId,
        reviewer_id: user?.userId,
        target_id: userId,
        rating: reviewData.rating,
        want_to_meet_again: reviewData.want_to_meet_again,
        tags: reviewData.tags,
        comment: reviewData.comment,
        overall_satisfaction: reviewData.overall_satisfaction,
        date_duration: reviewData.date_duration,
        location_satisfaction: reviewData.location_satisfaction,
        conversation_initiative: reviewData.conversation_initiative,
        first_impression_vs_reality: reviewData.first_impression_vs_reality,
        success_failure_factors: reviewData.success_failure_factors
      }, user?.userId);

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
    const tagsSelected = reviewData.tags?.length > 0;
    const commentWritten = reviewData.comment?.trim().length > 0;
    const overallSatisfactionFilled = reviewData.overall_satisfaction > 0;
    const dateDurationFilled = reviewData.date_duration !== '';
    const locationSatisfactionFilled = reviewData.location_satisfaction > 0;
    const conversationInitiativeFilled = reviewData.conversation_initiative !== '';
    const firstImpressionFilled = reviewData.first_impression_vs_reality !== '';
    const successFactorsFilled = reviewData.success_failure_factors?.length > 0;
    
    return allRatingsFilled && meetAgainSelected && tagsSelected && commentWritten && 
           overallSatisfactionFilled && dateDurationFilled && locationSatisfactionFilled && 
           conversationInitiativeFilled && firstImpressionFilled && successFactorsFilled;
  }, [reviewData.rating, reviewData.want_to_meet_again, reviewData.tags, reviewData.comment, 
      reviewData.overall_satisfaction, reviewData.date_duration, reviewData.location_satisfaction,
      reviewData.conversation_initiative, reviewData.first_impression_vs_reality, reviewData.success_failure_factors]);

  // 키보드가 내려갈 때 스크롤을 맨 위로 이동
  useEffect(() => {
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollToPosition?.(0, 0, true);
    });
    return () => {
      hideSub.remove();
    };
  }, []);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top','left','right','bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <PageLayout title="소개팅 후기 작성">
          <KeyboardAwareScrollView
            innerRef={ref => { scrollViewRef.current = ref; }}
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingBottom: 0 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraHeight={0}
            extraScrollHeight={0}
            enableResetScrollToCoords={true}
            resetScrollToCoords={{ x: 0, y: 0 }}
            keyboardOpeningTime={0}
          >
            {/* 소개팅 후기 작성 안내 */}
            <View style={styles.scheduleTipBox}>
              <View style={styles.scheduleTipHeader}>
                <Text style={styles.scheduleTipIcon}>💡</Text>
                <Text style={styles.scheduleTipTitle}>소개팅 후기 작성</Text>
              </View>
              <Text style={styles.scheduleTipText}>
                정성스러운 후기는 더 나은 소개팅을 만들어갑니다.
              </Text>
              <Text style={styles.scheduleTipText}>
                서로 호감이 통해다면 연락처 교환 카드가 도착합니다.
              </Text>
            </View>

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

            {/* 선택된 장소 만족도 */}
            {renderLocationSatisfaction()}

            {/* 전체적인 소개팅 만족도 */}
            {renderOverallSatisfaction()}

            {/* AI 인사이트를 위한 추가 필드들 */}
            {renderDateDuration()}
            {renderConversationInitiative()}
            {renderFirstImpressionVsReality()}

            {/* 태그 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>인상적인 점을 선택해주세요 * (복수 선택 가능)</Text>
              {renderTags()}
            </View>

            {renderSuccessFactors()}

            {/* 코멘트 입력 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>추가 코멘트 *</Text>
              <View style={styles.commentContainer}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder="소개팅에 대한 추가 의견을 자유롭게 작성해주세요..."
                  value={reviewData.comment}
                  onChangeText={(text) => setReviewData(prev => ({ ...prev, comment: text }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!readonly}
                />
              </View>
            </View>

            {/* 재만남 의사 */}
            {renderMeetAgainButtons()}

          </KeyboardAwareScrollView>
          {/* 버튼이 있을 때만 하단 패딩 적용 */}
          <View style={{
            backgroundColor: colors.background,
            alignItems: 'center',
            paddingBottom: 16,
            paddingTop: 0,
          }}>
            {(
              <PrimaryButton
                title={
                  readonly 
                    ? '리뷰 제출 완료' 
                    : isSubmitting 
                      ? '제출 중...' 
                      : '리뷰 제출하기'
                }
                onPress={handleSubmit}
                disabled={readonly || isSubmitting || !isFormValid}
                style={[
                  styles.submitButton,
                  !isFormValid && styles.submitButtonDisabled,
                  readonly && styles.submitButtonCompleted
                ]}
                textColor={readonly ? '#ccc' : colors.background}
              />
            )}
          </View>
        </PageLayout>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginBottom: 16,
  },
  meetAgainButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15
  },
  meetAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
    justifyContent: 'center',
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
    minHeight: 72, // 24px * 3줄
    maxHeight: 220,
    lineHeight: 24,
    paddingVertical: 12,
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
    width: '100%',
    alignSelf: 'center',
    marginBottom: 0,
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.disabled,
    color: colors.text.primary,
  },
  submitButtonCompleted: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  // submitButtonWrapper 제거
  // 소개팅 후기 작성 안내 박스 스타일 (UserDetailScreen과 동일)
  scheduleTipBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    alignItems: 'center',
  },
  scheduleTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scheduleTipIcon: {
    fontSize: 12,
    lineHeight: 22,
    marginRight: 5,
  },
  scheduleTipTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
  },
  scheduleTipText: {
    marginBottom: 2,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  optionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    ...typography.body,
    color: colors.text.primary,
  },
  optionButtonTextSelected: {
    color: colors.surface,
  },
  dateDurationContainer: {
    gap: 15,
  },
  dateDurationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  dateDurationButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  dateDurationButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDurationButtonText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dateDurationButtonTextSelected: {
    color: colors.surface,
  },
  conversationInitiativeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  conversationInitiativeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  conversationInitiativeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conversationInitiativeButtonText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  conversationInitiativeButtonTextSelected: {
    color: colors.surface,
  },
  firstImpressionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  firstImpressionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  firstImpressionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  firstImpressionButtonText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  firstImpressionButtonTextSelected: {
    color: colors.surface,
  },
  successFactorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  successFactorButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  successFactorButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  successFactorButtonText: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  successFactorButtonTextSelected: {
    color: colors.surface,
  },
});

export default ReviewWriteScreen; 