import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  style?: object;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children, style }) => (
  <View style={[styles.section, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12
  },
  sectionTitle: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
});

export default ProfileSection; 