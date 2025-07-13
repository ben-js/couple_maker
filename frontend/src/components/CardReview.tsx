import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Card, Text } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors } from '@/constants';

export interface CardReviewProps {
  user: { userId: string; name: string; job: string };
  matchId: string;
  onPress: () => void;
  buttonText?: string;
  title?: string;
  subtitle?: string;
}

const CardReview: React.FC<CardReviewProps> = ({ user, matchId, onPress, buttonText, title, subtitle }) => (
  <Card enableShadow style={styles.reviewCard}>
    <View style={styles.reviewCardHeader}>
      <View style={styles.reviewCardHeaderRow}>
        <Text style={[styles.reviewCardTitle, { textAlign: 'center' }]}>
          {title || '소개팅은 잘 끝나셨나요?'}
        </Text>
      </View>
    </View>
    <View style={styles.reviewCardContent}>
      <View style={styles.reviewCardImageCenter}>
        <Feather name={'book-open'} size={40} color={colors.primary} />
      </View>
      <Text style={styles.reviewCardSubtitle}>
        {subtitle || `${user.name}님과의 소개팅 후기를 작성해주세요`}
      </Text>
      <PrimaryButton
        title={buttonText || '지금 에프터 유무 작성하러 가기'}
        onPress={onPress}
        style={styles.reviewCardButton}
        textColor={colors.surface}
      />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  reviewCard: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.background,
    height: 230,
    textAlign: 'center',
  },
  reviewCardHeader: {
    marginBottom: 16,
  },
  reviewCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  reviewCardHeartIcon: {
    marginLeft: 8,
  },
  reviewCardContent: {
    alignItems: 'center',
    flex: 1,
  },
  reviewCardImageCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  reviewCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
  },
});

export default CardReview; 