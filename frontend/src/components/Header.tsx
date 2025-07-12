import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

interface HeaderProps {
  title: string;
  rightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  rightComponent
}) => {
  const navigation = useNavigation();
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
      return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Feather name="arrow-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        {rightComponent ? (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
    );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 38,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 28,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text.primary,
    fontFamily: 'Pretendard-Bold',
    fontSize: 24,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  rightComponent: {
    width: 28,
    alignItems: 'center',
  },
}); 