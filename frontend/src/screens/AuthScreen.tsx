import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { createUserTable, checkProfileExists } from '../db/user';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  useEffect(() => {
    createUserTable();
  }, []);

  const handleLogin = async () => {
    // 더미 유저 생성
    const now = new Date().toISOString();
    const user = {
      id: '1',
      email,
      name: '홍길동',
      gender: 'male' as 'male',
      birthDate: '1990-01-01',
      age: 33,
      location: { city: '서울', district: '강남구' },
      height: 175,
      bodyType: 'normal' as 'normal',
      job: '개발자',
      education: 'bachelor' as 'bachelor',
      religion: 'none' as 'none',
      smoking: 'no' as 'no',
      drinking: 'no' as 'no',
      mbti: 'INTJ',
      bio: '안녕하세요!',
      photos: [],
      interests: ['운동', '영화'],
      maritalStatus: 'single' as 'single',
      hasChildren: false,
      createdAt: now,
      updatedAt: now,
      isProfileComplete: true,
      isVerified: true,
      lastActive: now,
    };
    const token = 'dummy-token';
    await login(user, token);
    const exists = await checkProfileExists(user.id);
    if (exists) {
      navigation.navigate('Main');
    } else {
      navigation.navigate('ProfileSetup');
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