import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { createUserTable, checkProfileExists } from '../db/user';
import { getUserPreferences } from '../services/userPreferencesService';
import { loginUser } from '../services/userService';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<any>();

  useEffect(() => {
    createUserTable();
  }, []);

  const handleLogin = async () => {
    try {
      // REST API로 로그인
      const user = await loginUser(email, password);
      if (!user.hasProfile) {
        navigation.navigate('ProfileSetup');
      } else if (!user.hasPreferences) {
        navigation.navigate('PreferenceSetupScreen');
      } else {
        navigation.navigate('HomeScreen');
      }
    } catch (e) {
      alert('로그인 실패: ' + (e as Error).message);
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