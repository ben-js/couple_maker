import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, TextField } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/PrimaryButton';
import { colors, typography } from '@/constants';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextField
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
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.background, 
    padding: 24 
  },
  title: { 
    ...typography.h1,
    marginBottom: 32,
  },
  input: { 
    width: '100%', 
    maxWidth: 320, 
    height: 48, 
    borderColor: colors.border, 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    marginBottom: 16, 
    fontSize: 16 
  },
});

export default SignupScreen; 