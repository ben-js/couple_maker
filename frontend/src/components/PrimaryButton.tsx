import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
  title: string;
  onPress: () => void;
  style?: object;
  textColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
};

const PrimaryButton = ({ title, onPress, style, textColor, backgroundColor, disabled = false }: Props) => (
  <TouchableOpacity
    style={[
      styles.button,
      backgroundColor ? { backgroundColor } : {},
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    activeOpacity={disabled ? 1 : 0.8}
    disabled={disabled}
  >
    <Text style={[styles.text, textColor ? { color: textColor } : {}, disabled && styles.textDisabled]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface, // '#FAFAFA'
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 120,
    borderWidth: 0,
    marginVertical: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  text: {
    color: colors.text.primary, // '#262626'
    fontSize: 15,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.text.secondary,
  },
});

export default PrimaryButton; 