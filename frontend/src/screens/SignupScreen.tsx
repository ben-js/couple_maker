import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Platform, ToastAndroid, Alert, TextInput } from 'react-native';
import { View, Text, Button } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { NAVIGATION_ROUTES, colors, typography, BUTTON_TEXTS } from '@/constants';
import { signup } from '../services/userService';

const logo = require('../../assets/logo.png');

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigation = useNavigation<any>();

  const isSignupEnabled = email.length > 0 && password.length > 0 && password === confirmPassword && !passwordError;

  // 비밀번호 확인 검증
  const validatePassword = () => {
    console.log('🔍 비밀번호 검증:', {
      password: password ? `${password.substring(0, 2)}***` : 'empty',
      confirmPassword: confirmPassword ? `${confirmPassword.substring(0, 2)}***` : 'empty',
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
      isEqual: password === confirmPassword,
      passwordChars: password.split('').map(c => `${c}(${c.charCodeAt(0)})`),
      confirmPasswordChars: confirmPassword.split('').map(c => `${c}(${c.charCodeAt(0)})`)
    });
    
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordError('');
    }
  };

  // password나 confirmPassword가 변경될 때마다 검증 실행
  useEffect(() => {
    validatePassword();
  }, [password, confirmPassword]);

  // 비밀번호 변경 시 검증
  const handlePasswordChange = (text: string) => {
    console.log('📝 비밀번호 입력:', { text, length: text.length });
    setPassword(text);
  };

  // 비밀번호 확인 변경 시 검증
  const handleConfirmPasswordChange = (text: string) => {
    console.log('📝 비밀번호 확인 입력:', { text, length: text.length });
    setConfirmPassword(text);
  };

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
      navigation.navigate(NAVIGATION_ROUTES.EMAIL_VERIFICATION, { email });
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
        <TextInput
          style={styles.emailInput}
          placeholder="이메일"
          placeholderTextColor={colors.text.disabled}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.emailInput}
          placeholder="비밀번호"
          placeholderTextColor={colors.text.disabled}
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
          autoCapitalize="none"
          maxLength={50}
        />
        <TextInput
          style={[styles.emailInput, passwordError && styles.inputError]}
          placeholder="비밀번호 확인"
          placeholderTextColor={colors.text.disabled}
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry
          autoCapitalize="none"
          maxLength={50}
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
        <Text style={styles.passwordHint}>
          비밀번호는 8자 이상, 소문자와 숫자를 포함해야 합니다.
        </Text>
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
  },
});

export default SignupScreen; 