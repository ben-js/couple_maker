import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Card, Text } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors } from '@/constants';

export interface CardCTAProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: string;
  iconColor?: string;
}

const CardCTA: React.FC<CardCTAProps> = ({ 
  title, 
  subtitle, 
  buttonText, 
  onPress, 
  disabled = false,
  icon = 'heart',
  iconColor
}) => (
  <Card enableShadow style={styles.ctaCard}>
    <View style={styles.ctaCardHeader}>
      <View style={styles.ctaCardHeaderRow}>
        <Text style={[styles.ctaCardTitle, { textAlign: 'center' }]}>
          {title}
        </Text>
      </View>
    </View>
    <View style={styles.ctaCardContent}>
      <View style={styles.ctaCardImageCenter}>
        <Feather name={icon as any} size={40} color={iconColor || colors.primary} />
      </View>
      {!!subtitle && (
        <Text style={styles.ctaCardSubtitle}>
          {subtitle}
        </Text>
      )}
              <PrimaryButton
          title={buttonText}
          onPress={onPress}
          style={[styles.ctaCardButton, disabled && styles.ctaCardButtonDisabled]}
          textColor={disabled ? colors.text.secondary : colors.surface}
          disabled={disabled}
        />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  ctaCard: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.background,
    minHeight: 230, // 고정 높이 대신 최소 높이
    textAlign: 'center',
  },
  ctaCardHeader: {
    marginBottom: 16,
  },
  ctaCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  ctaCardContent: {
    alignItems: 'center' // 하단 여백 유지
  },
  ctaCardImageCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaCardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 200,
  },
  ctaCardButtonDisabled: {
    backgroundColor: colors.border,
  },
});

export default CardCTA; 