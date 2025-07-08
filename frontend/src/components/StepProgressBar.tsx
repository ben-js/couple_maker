import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants';

const CIRCLE_SIZE = 20;
const LINE_WIDTH = 44;
const ITEM_WIDTH = 64;

interface StepProgressBarProps {
  total: number;
  current: number; // 0부터 시작
  labels?: string[];
}

export default function StepProgressBar({ total, current, labels }: StepProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, idx) => (
        <React.Fragment key={idx}>
          <View style={styles.item}>
            <View
              style={[
                styles.circle,
                idx <= current ? styles.circleActive : styles.circleInactive,
              ]}
            >
              {idx <= current && (
                <Feather name="check" size={12} color="#fff" />
              )}
            </View>
            {labels && labels[idx] && (
              <Text style={styles.label} numberOfLines={1}>{labels[idx]}</Text>
            )}
            <View
              style={[
                styles.line,
                idx < current ? styles.lineActive : styles.lineInactive,
                idx === total - 1 && { opacity: 0 },
              ]}
            />
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  item: {
    alignItems: 'center',
    width: ITEM_WIDTH + 10,
    position: 'relative',
    minHeight: CIRCLE_SIZE + 18,
    padding: 0,
    margin: 0,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    zIndex: 1,
    
  },
  circleActive: {
    backgroundColor: colors.accent,
  },
  circleInactive: {
    backgroundColor: colors.stepInactive,
  },
  label: {
    marginTop: spacing.xs,
    ...typography.captionSmall,
    textAlign: 'center',
    width: ITEM_WIDTH,
  },
  line: {
    position: 'absolute',
    top: (CIRCLE_SIZE - 2) / 2,
    left: CIRCLE_SIZE + 20,
    width: LINE_WIDTH  + 17,
    height: 2,
    backgroundColor: colors.stepInactive,
    margin: 0,
    padding: 0,
  },
  lineActive: {
    backgroundColor: colors.accent,
  },
  lineInactive: {
    backgroundColor: colors.stepInactive,
  },
}); 