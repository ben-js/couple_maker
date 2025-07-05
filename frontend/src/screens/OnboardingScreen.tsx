import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';
import { useNavigation, CommonActions } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import { NAVIGATION_ROUTES, BUTTON_TEXTS } from '@/constants';
import { logger } from '@/utils/logger';

const logo = (() => {
  try {
    return require('../../assets/logo.png');
  } catch {
    return null;
  }
})();

interface OnboardingScreenProps {
  onStart: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  const navigation = useNavigation<any>();

  const handleStart = async () => {
    logger.navigation.navigate('OnboardingScreen', NAVIGATION_ROUTES.LOGIN);
    if (onStart) onStart();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: NAVIGATION_ROUTES.LOGIN }],
      })
    );
  };

  return (
    <View style={styles.container}>
      {logo ? (
        <Image source={logo} style={styles.logo} />
      ) : (
        <View style={[styles.logo, { backgroundColor: colors.border, borderRadius: 60 }]} />
      )}
      <Text style={styles.slogan}>당신의 인연은 지금 이곳에</Text>
      <PrimaryButton title={BUTTON_TEXTS.START} onPress={handleStart} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logo: { width: 120, height: 120, marginBottom: 24 },
  slogan: { ...typography.h2, marginBottom: 32 },
});

export default OnboardingScreen; 