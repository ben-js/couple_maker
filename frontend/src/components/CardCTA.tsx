import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import PrimaryButton from './PrimaryButton';
import { colors, typography, spacing } from '@/constants';

export interface CardCTAProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  onPress: () => void;
}

const CardCTA: React.FC<CardCTAProps> = ({ title, subtitle, buttonText, onPress }) => (
  <View style={styles.ctaCard}>
    <Text style={styles.ctaButtonText}>{title}</Text>
    {!!subtitle && <Text style={styles.ctaButtonSubtext}>{subtitle}</Text>}
    <PrimaryButton
      title={buttonText}
      onPress={onPress}
      style={styles.ctaButton}
      textColor={colors.surface}
    />
  </View>
);

const styles = StyleSheet.create({
  ctaCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg + 4,
    borderRadius: spacing.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...typography.button,
    marginBottom: 4,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  ctaButtonSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    opacity: 0.9,
  },
  ctaButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});

export default CardCTA; 