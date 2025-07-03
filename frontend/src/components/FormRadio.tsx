import React from 'react';
import { View, Text } from 'react-native';
import { RadioGroup, RadioButton } from 'react-native-ui-lib';

interface FormRadioProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

const FormRadio: React.FC<FormRadioProps> = ({ label, options, value, onChange, error }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}</Text>
    <RadioGroup
      initialValue={value}
      onValueChange={onChange}
      style={{ flexDirection: 'row', flexWrap: 'wrap' }}
    >
      {options.map(opt => (
        <RadioButton key={opt} value={opt} label={opt} style={{ marginRight: 16 }} />
      ))}
    </RadioGroup>
    {error && <Text style={{ color: 'red', marginTop: 4 }}>{error}</Text>}
  </View>
);

export default FormRadio; 