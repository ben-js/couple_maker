import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface FormInputProps {
  label: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  [key: string]: any;
}

const FormInput: React.FC<FormInputProps> = ({ label, error, placeholder, value, onChangeText, ...props }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#bbb"
      style={[
        styles.input,
        { color: value ? '#222' : '#bbb' }
      ]}
      {...props}
    />
    <View style={styles.underline} />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
  },
  input: {
    minHeight: 48,
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  underline: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    marginBottom: 32,
  },
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 13,
  },
});

export default FormInput; 