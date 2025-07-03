import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FormChipsProps {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  min?: number;
  max?: number;
  error?: string;
}

const FormChips: React.FC<FormChipsProps> = ({ options, value, onChange, min, max, error }) => {
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
    <View style={{ marginBottom: 0 }}>
      <View style={styles.chipWrap}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            style={[
              styles.chip,
              value.includes(opt) && styles.chipSelected
            ]}
            activeOpacity={0.85}
          >
            <Text style={[
              styles.chipText,
              value.includes(opt) && styles.chipTextSelected
            ]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {max && <Text style={styles.maxInfo}>최대 {max}개 선택</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 0,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f6f6f6',
    margin: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#222',
    fontWeight: '400',
    fontSize: 16,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 13,
  },
  maxInfo: {
    color: '#bbb',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default FormChips; 