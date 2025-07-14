import React, { useState } from 'react';
import { StyleSheet, Image, Platform, ToastAndroid, Alert } from 'react-native';
import { View, Text, TextField, Button } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { NAVIGATION_ROUTES, colors, typography, BUTTON_TEXTS } from '@/constants';
import { signup } from '../services/userService';

const logo = require('../../assets/logo.png');

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const isSignupEnabled = email.length > 0 && password.length > 0 && password === confirmPassword;

  const handleSignup = async () => {
    if (!isSignupEnabled) return;
    setLoading(true);
    try {
      const result = await signup({ email, password, name: '' });
      if (!result) throw new Error('회원가입에 실패했습니다.');
      if (Platform.OS === 'android') {
        ToastAndroid.show('인증 메일이 발송되었습니다. 메일을 확인해 주세요.', ToastAndroid.LONG);
      } else {
        Alert.alert('인증 메일이 발송되었습니다.', '메일을 확인해 주세요.');
      }
      navigation.navigate(NAVIGATION_ROUTES.LOGIN);
    } catch (e) {
      const errorMessage = (e as Error).message || '회원가입에 실패했습니다.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      } else {
        Alert.alert('회원가입 실패', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View flex center backgroundColor={colors.background} padding-24>
      <Image source={logo} style={styles.logo} />
      <View style={styles.inputGroup}>
        <TextField
          style={styles.emailInput}
          placeholder="이메일"
          placeholderTextColor={colors.text.disabled}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          enableErrors={false}
          underlineColor='transparent'
          floatingPlaceholder={false}
        />
        <TextField
          style={styles.emailInput}
          placeholder="비밀번호"
          placeholderTextColor={colors.text.disabled}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          enableErrors={false}
          underlineColor='transparent'
          floatingPlaceholder={false}
        />
        <TextField
          style={styles.emailInput}
          placeholder="비밀번호 확인"
          placeholderTextColor={colors.text.disabled}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          enableErrors={false}
          underlineColor='transparent'
          floatingPlaceholder={false}
        />
        <Button
          label="회원가입"
          style={[styles.loginBtn, !isSignupEnabled && styles.loginBtnDisabled]}
          labelStyle={isSignupEnabled ? styles.loginBtnLabel : { ...styles.loginBtnLabel, color: '#222' }}
          onPress={handleSignup}
          fullWidth
          disabled={!isSignupEnabled || loading}
          loading={loading}
        />
      </View>
      <Text style={styles.infoText}>
        회원가입 시 입력하신 이메일로 인증 메일이 발송됩니다. 메일의 안내에 따라 인증을 완료해 주세요.
      </Text>
      <View row centerV style={styles.signupRow}>
        <Text style={styles.signupText}>이미 계정이 있으신가요?</Text>
        <Button
          link
          label="로그인"
          labelStyle={styles.signupLink}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.LOGIN)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  emailInput: {
    width: '100%',
    marginBottom: 10,
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    color: colors.text.primary,
  },
  loginBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 20,  
    marginBottom: 28,
  },
  loginBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  loginBtnLabel: {
    color: colors.background, // 항상 흰색
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputGroup: {
    width: 320,
    maxWidth: '100%',
    alignSelf: 'center',
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  signupRow: {
    marginTop: 12,
  },
  signupText: {
    ...typography.caption,
    color: colors.text.disabled,
    marginRight: 4,
  },
  signupLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default SignupScreen; 