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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
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
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
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
  error: {
    color: 'red',
    marginLeft: 8,
    fontSize: 13,
  },
});

export default FormInput; 