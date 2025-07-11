import React from 'react';
import { View, Text, Card } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/constants';

interface TipCardProps {
  icon: string;
  title: string;
  subtitle: string;
}

const TipCard: React.FC<TipCardProps> = ({ icon, title, subtitle }) => (
  <Card enableShadow style={{
    width: 120,
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    marginRight: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Feather name={icon as any} size={28} color={colors.primary} style={{ marginBottom: 8 }} />
    <Text style={{ ...typography.body, fontWeight: '600', marginBottom: 4, textAlign: 'center' }}>{title}</Text>
    <Text style={{ ...typography.caption, textAlign: 'center' }}>{subtitle}</Text>
  </Card>
);

export default TipCard; 