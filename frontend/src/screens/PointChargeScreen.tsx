import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, Card } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import { colors, typography, spacing } from '@/constants';

const PointChargeScreen = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card} enableShadow>
        <View style={styles.header}>
          <Feather name="credit-card" size={32} color={colors.accent} />
          <Text style={styles.title}>포인트 충전</Text>
        </View>
        <Text style={styles.desc}>
          포인트가 부족할 때 이곳에서 간편하게 충전할 수 있습니다.
        </Text>
        <PrimaryButton
          title="10,000P 충전하기"
          onPress={() => {}}
          style={styles.chargeButton}
        />
        <Text style={styles.caption}>* 실제 결제 연동은 아직 구현되지 않았습니다.</Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    padding: spacing.lg + 4,
    borderRadius: spacing.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    marginLeft: 12,
  },
  desc: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  chargeButton: {
    minWidth: 180,
    height: 44,
    marginBottom: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default PointChargeScreen; 