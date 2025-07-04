import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';

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
    if (onStart) onStart();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  return (
    <View style={styles.container}>
      {logo ? (
        <Image source={logo} style={styles.logo} />
      ) : (
        <View style={[styles.logo, { backgroundColor: '#eee', borderRadius: 60 }]} />
      )}
      <Text style={styles.slogan}>당신의 인연은 지금 이곳에</Text>
      <PrimaryButton title="시작하기" onPress={handleStart} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  logo: { width: 120, height: 120, marginBottom: 24 },
  slogan: { fontSize: 20, fontWeight: 'bold', marginBottom: 32, color: '#222' },
});

export default OnboardingScreen; 