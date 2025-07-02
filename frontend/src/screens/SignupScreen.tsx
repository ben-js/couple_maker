import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <PrimaryButton title="회원가입" onPress={() => navigation.navigate('Auth')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, color: '#222' },
  input: { width: '100%', maxWidth: 320, height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
});

export default SignupScreen; 