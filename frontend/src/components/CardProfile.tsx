import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Card, Text } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors } from '@/constants';

export interface CardProfileProps {
  user: { userId: string };
  matchId: string;
  onPress: () => void;
}

const CardProfile: React.FC<CardProfileProps> = ({ user, matchId, onPress }) => (
  <Card enableShadow style={styles.profileCard}>
    <View style={styles.profileCardHeader}>
      <View style={styles.profileCardHeaderRow}>
        <Text style={[styles.profileCardTitle, { textAlign: 'center' }]}>프로필 카드가 도착했어요!</Text>
        <Feather name="mail" size={24} color={colors.text.primary} style={styles.profileCardMailIcon} />
      </View>
    </View>
    <View style={styles.profileCardContent}>
      <View style={styles.profileCardImageCenter}>
        <Feather name={'unlock'} size={40} color={colors.primary} />
      </View>
      <PrimaryButton
        title="지금 확인하러 가기"
        onPress={onPress}
        style={styles.profileCardButton}
        textColor={colors.surface}
      />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  profileCard: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: colors.background,
    height: 210,
    textAlign: 'center',
  },
  profileCardHeader: {
    marginBottom: 16,
  },
  profileCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  profileCardContent: {
    alignItems: 'center',
  },
  profileCardImageCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardMailIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  profileCardButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 16,
  },
});

export default CardProfile; 