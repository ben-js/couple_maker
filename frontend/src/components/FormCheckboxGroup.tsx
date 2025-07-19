import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface FormCheckboxGroupProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  min?: number;
  max?: number;
  error?: string;
}

const FormCheckboxGroup: React.FC<FormCheckboxGroupProps> = ({ label, options, value, onChange, min, max, error }) => {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(v => v !== item));
    } else {
      if (!max || value.length < max) {
        onChange([...value, item]);
      }
    }
  };
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontWeight: 'bold' }}>{label}</Text>
        {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: value.includes(opt) ? '#3B82F6' : '#eee',
              marginRight: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: value.includes(opt) ? '#fff' : '#333' }}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {max && <Text style={{ color: '#888', fontSize: 12 }}>최대 {max}개 선택</Text>}
    </View>
  );
};

export default FormCheckboxGroup; 