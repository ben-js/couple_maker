// LoginScreen.tsx (AuthScreen.tsx에서 이름만 변경)
// ... (이전 AuthScreen.tsx의 최신 리팩토링된 코드 전체를 여기에 복사) ... 

import React, { useState } from 'react';
import { StyleSheet, Image, Platform, ToastAndroid, Alert } from 'react-native';
import { View, Text, TextField, Button, Icon } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { login } from '../services/userService';
import { logger } from '@/utils/logger';
import { TOAST_MESSAGES, NAVIGATION_ROUTES, BUTTON_TEXTS, colors, typography } from '@/constants';

const logo = require('../../assets/logo.png');

const LoginScreen = () => {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();

  const isLoginEnabled = email.length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isLoginEnabled) return;
    try {
      logger.info('로그인 시도', { email, password: password ? '***' : 'empty' });
      logger.api.request('POST', '/login', { email });
      const user = await login({ email, password });
      if (!user || !user.userId) throw new Error('로그인에 실패했습니다. (user 정보 없음)');
      logger.api.response('POST', '/login', { success: true, userId: user.userId });
      await setUser(user);
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.LOGIN_SUCCESS, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.LOGIN_SUCCESS);
      }
      // 프로필/선호정보 여부 분기 로직은 실제 구현에 맞게 수정 필요
      navigation.navigate(NAVIGATION_ROUTES.MAIN, { screen: NAVIGATION_ROUTES.MAIN });
    } catch (e) {
      const errorMessage = (e as Error).message;
      logger.error('로그인 실패', { error: errorMessage, email });
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${TOAST_MESSAGES.LOGIN_FAILED}: ${errorMessage}`, ToastAndroid.LONG);
      } else {
        Alert.alert(TOAST_MESSAGES.LOGIN_FAILED, errorMessage);
      }
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
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          enableErrors={false}
          underlineColor='transparent'
          floatingPlaceholder={false}
        />
        <Button
          label={BUTTON_TEXTS.LOGIN}
          style={[styles.loginBtn, !isLoginEnabled && styles.loginBtnDisabled]}
          labelStyle={styles.loginBtnLabel}
          onPress={handleLogin}
          fullWidth
          disabled={!isLoginEnabled}
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
    marginBottom: 50,
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
    backgroundColor: '#000',
    marginTop: 20,  
    marginBottom: 28,
  },
  loginBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  loginBtnLabel: {
    color: colors.surface,
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