import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';

const StoryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>스토리(피드) 화면입니다.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { ...typography.h2, color: colors.text.primary },
});

export default StoryScreen; 