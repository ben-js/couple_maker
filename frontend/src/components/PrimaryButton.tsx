import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
  title: string;
  onPress: () => void;
  style?: object;
  textColor?: string;
  backgroundColor?: string;
};

const PrimaryButton = ({ title, onPress, style, textColor, backgroundColor }: Props) => (
  <TouchableOpacity
    style={[
      styles.button,
      backgroundColor ? { backgroundColor } : {},
      style,
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.text, textColor ? { color: textColor } : {}]}>{title}</Text>
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
  text: {
    color: colors.text.primary, // '#262626'
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PrimaryButton; 