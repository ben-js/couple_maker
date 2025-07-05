import React from 'react';
import { View, Text, Button } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '@/constants';

const FilterScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ ...typography.h2, marginBottom: 16 }}>FilterScreen (필터 화면)</Text>
      <Button
        label="Go to Home"
        onPress={() => navigation.navigate('Main')}
      />
    </View>
  );
};

export default FilterScreen; 