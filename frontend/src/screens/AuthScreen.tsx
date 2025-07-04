import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ToastAndroid, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { loginUser } from '../services/userService';

const AuthScreen = () => {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('1234');
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();

  const handleLogin = async () => {
    try {
      // REST API로 로그인
      const user = await loginUser(email, password);
      // 로그인 성공 시 user 정보를 Context에 저장
      await setUser(user);
      console.log('로그인 후 user.hasProfile:', user.hasProfile, 'user.hasPreferences:', user.hasPreferences);
      // 로그인 성공 시 토스트 메시지
      if (Platform.OS === 'android') {
        ToastAndroid.show('로그인이 완료되었습니다.', ToastAndroid.SHORT);
      } else {
        Alert.alert('로그인이 완료되었습니다.');
      }
      if (!user.hasProfile) {
        navigation.navigate('ProfileSetup');
      } else if (!user.hasPreferences) {
        navigation.navigate('PreferenceSetupScreen');
      } else {
        navigation.navigate('HomeScreen');
      }
    } catch (e) {
      const errorMessage = (e as Error).message;
      console.error('Login error:', errorMessage);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(`로그인 실패: ${errorMessage}`, ToastAndroid.LONG);
      } else {
        Alert.alert('로그인 실패', errorMessage);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <PrimaryButton title="로그인" onPress={handleLogin} />
      <TouchableOpacity style={styles.signupBtn} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupText}>아직 회원이 아니신가요? <Text style={{color:'#FF5A5F', fontWeight:'bold'}}>회원가입</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, color: '#222' },
  input: { width: '100%', maxWidth: 320, height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  signupBtn: { marginTop: 24 },
  signupText: { color: '#666', fontSize: 15 },
});

export default AuthScreen; 