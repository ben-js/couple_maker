// LoginScreen.tsx (AuthScreen.tsx에서 이름만 변경)
// ... (이전 AuthScreen.tsx의 최신 리팩토링된 코드 전체를 여기에 복사) ... 

import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Platform, ToastAndroid, Alert } from 'react-native';
import { View, Text, TextField, Button, Icon } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { login } from '../services/userService';
import { logger } from '@/utils/logger';
import { TOAST_MESSAGES, NAVIGATION_ROUTES, BUTTON_TEXTS, colors, typography } from '@/constants';
import { getUser } from '../db/user';
import { apiGet } from '@/utils/apiUtils';

const logo = require('../../assets/logo.png');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();

  // 최근 로그인한 이메일 자동 입력
  useEffect(() => {
    const loadLastEmail = async () => {
      const user = await getUser();
      if (user?.email) setEmail(user.email);
    };
    loadLastEmail();
  }, []);

  const isLoginEnabled = email.length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isLoginEnabled || isLoggingIn) return;
    
    setIsLoggingIn(true);
    try {
      logger.info('로그인 시도', { email, password: password ? '***' : 'empty' });
      logger.api.request('POST', '/login', { email });
      const user = await login({ email, password });
      if (!user || !user.userId) throw new Error('로그인에 실패했습니다. (user 정보 없음)');
      logger.api.response('POST', '/login', { success: true, userId: user.userId });
      // 로그인 응답에 이미 필요한 정보가 포함되어 있으므로 추가 API 호출 제거
      await setUser(user);
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.LOGIN_SUCCESS, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.LOGIN_SUCCESS);
      }
      // 분기 처리도 user 기준으로!
      if (!user.isVerified) {
        logger.info('이메일 인증이 완료되지 않은 사용자', { userId: user.userId, email: user.email });
        navigation.navigate(NAVIGATION_ROUTES.EMAIL_VERIFICATION, { email: user.email });
      } else if (!user.hasProfile) {
        logger.info('프로필이 없는 사용자', { userId: user.userId });
        navigation.navigate(NAVIGATION_ROUTES.PROFILE_EDIT);
      } else if (!user.hasPreferences) {
        logger.info('이상형이 없는 사용자', { userId: user.userId });
        navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT);
      } else {
        logger.info('모든 설정이 완료된 사용자', { userId: user.userId });
        navigation.navigate(NAVIGATION_ROUTES.MAIN, { screen: NAVIGATION_ROUTES.MAIN });
      }
    } catch (e) {
      const errorMessage = (e as Error).message;
      logger.error('로그인 실패', { error: errorMessage, email });
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${TOAST_MESSAGES.LOGIN_FAILED}: ${errorMessage}`, ToastAndroid.LONG);
      } else {
        Alert.alert(TOAST_MESSAGES.LOGIN_FAILED, errorMessage);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View flex center backgroundColor={colors.background} padding-24>
      <Image source={logo} style={styles.logo} />
      <View style={styles.inputGroup}>
        <TextField
          migrate
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
          migrate
          style={styles.emailInput}
          placeholder="비밀번호"
          placeholderTextColor={colors.text.disabled}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          enableErrors={false}
          underlineColor='transparent'
          floatingPlaceholder={false}
        />
        <Button
          label={isLoggingIn ? '로그인 중...' : BUTTON_TEXTS.LOGIN}
          style={[styles.loginBtn, (!isLoginEnabled || isLoggingIn) && styles.loginBtnDisabled]}
          labelStyle={isLoginEnabled && !isLoggingIn ? styles.loginBtnLabel : { ...styles.loginBtnLabel, color: '#222' }}
          onPress={handleLogin}
          fullWidth
          disabled={!isLoginEnabled || isLoggingIn}
        />
      </View>
      <Button
        link
        style={styles.forgotBtn}
        labelStyle={styles.forgotText}
        label="비밀번호를 잊으셨나요?"
        onPress={() => {}}
      />
      <View row centerV style={styles.signupRow}>
        <Text style={styles.signupText}>계정이 없으신가요?</Text>
        <Button
          link
          label="회원가입"
          labelStyle={styles.signupLink}
          onPress={() => navigation.navigate(NAVIGATION_ROUTES.SIGNUP)}
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
  passwordInput: {
    width: 320,
    maxWidth: '100%',
    marginBottom: 0,
    ...typography.body,
    backgroundColor: '#FAFAFA',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    color: colors.text.primary,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginRight: 8,
    marginBottom: 16,
  },
  forgotText: {
    ...typography.caption,
    color: colors.primary,
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
    color: colors.primary,
  },
  loginBtnLabel: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 16,
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
  inputGroup: {
    width: 320,
    maxWidth: '100%',
    alignSelf: 'center',
  },
});

export default LoginScreen; 