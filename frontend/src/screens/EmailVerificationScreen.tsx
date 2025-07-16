import React, { useState } from 'react';
import { StyleSheet, Platform, ToastAndroid, Alert } from 'react-native';
import { View, Text, TextField, Button } from 'react-native-ui-lib';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NAVIGATION_ROUTES, colors, typography } from '@/constants';
import { confirmSignup, resendConfirmationCode } from '../services/userService';
import { useAuth } from '../store/AuthContext';

const EmailVerificationScreen = () => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateUser } = useAuth();
  
  // 회원가입에서 전달받은 이메일 또는 현재 사용자의 이메일
  const email = route.params?.email || user?.email || '';

  const isVerificationEnabled = confirmationCode.length === 6;

  const handleVerification = async () => {
    if (!isVerificationEnabled) return;
    setLoading(true);
    
    try {
      const result = await confirmSignup({ email, confirmationCode });
      if (!result) throw new Error('인증에 실패했습니다.');
      
      // 사용자 상태 업데이트 (이메일 인증 완료)
      if (user) {
        await updateUser({ isVerified: true });
      }
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('이메일 인증이 완료되었습니다!', ToastAndroid.LONG);
      } else {
        Alert.alert('인증 완료', '이메일 인증이 완료되었습니다!');
      }
      
      // 메인 화면으로 이동
      navigation.navigate(NAVIGATION_ROUTES.MAIN, { screen: NAVIGATION_ROUTES.MAIN });
    } catch (e) {
      const errorMessage = (e as Error).message || '인증에 실패했습니다.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      } else {
        Alert.alert('인증 실패', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const result = await resendConfirmationCode(email);
      if (!result) throw new Error('재발송에 실패했습니다.');
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('인증 코드가 재발송되었습니다.', ToastAndroid.LONG);
      } else {
        Alert.alert('재발송 완료', '인증 코드가 재발송되었습니다.');
      }
    } catch (e) {
      const errorMessage = (e as Error).message || '재발송에 실패했습니다.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      } else {
        Alert.alert('재발송 실패', errorMessage);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToSignup = () => {
    navigation.navigate(NAVIGATION_ROUTES.SIGNUP);
  };

  return (
    <View flex center backgroundColor={colors.background} padding-24>
      <View style={styles.container}>
        <Text style={styles.title}>이메일 인증</Text>
        <Text style={styles.subtitle}>
          {email}로 발송된 인증 코드를 입력해주세요
        </Text>
        
        <View style={styles.inputGroup}>
          <TextField
            migrate
            style={styles.codeInput}
            placeholder="인증 코드 6자리"
            placeholderTextColor={colors.text.disabled}
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            enableErrors={false}
            underlineColor='transparent'
            floatingPlaceholder={false}
          />
          
          <Button
            label="인증하기"
            style={[styles.verifyBtn, !isVerificationEnabled && styles.verifyBtnDisabled]}
            labelStyle={isVerificationEnabled ? styles.verifyBtnLabel : { ...styles.verifyBtnLabel, color: '#222' }}
            onPress={handleVerification}
            fullWidth
            disabled={!isVerificationEnabled || loading}
            loading={loading}
          />
        </View>

        <View style={styles.actionGroup}>
          <Button
            link
            label="인증 코드 재발송"
            labelStyle={styles.resendLink}
            onPress={handleResendCode}
            disabled={resendLoading}
            loading={resendLoading}
          />
          
          <Button
            link
            label="회원가입으로 돌아가기"
            labelStyle={styles.backLink}
            onPress={handleBackToSignup}
          />
        </View>

        <Text style={styles.infoText}>
          인증 코드는 10분 후 만료됩니다.{'\n'}
          이메일이 보이지 않는다면 스팸함을 확인해주세요.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 320,
    maxWidth: '100%',
    alignSelf: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  codeInput: {
    width: '100%',
    marginBottom: 20,
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    color: colors.text.primary,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
  },
  verifyBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  verifyBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  verifyBtnLabel: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionGroup: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  backLink: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmailVerificationScreen; 