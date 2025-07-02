import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StoryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>스토리(피드) 화면입니다.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#333' },
});

export default StoryScreen; 