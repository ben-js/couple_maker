import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FormChipsProps {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  min?: number;
  max?: number;
  error?: string;
  label?: string;
  placeholder?: string;
}

const FormChips: React.FC<FormChipsProps> = ({ options, value, onChange, min, max, error, label, placeholder }) => {
  // 옵션이 없을 때 안내
  if (!options || options.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.emptyText}>옵션이 없습니다</Text>
      </View>
    );
  }

  // 칩 선택/해제
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(v => v !== item));
    } else {
      if (typeof max !== 'number' || value.length < max) {
        onChange([...value, item]);
      }
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
      <View style={styles.chipWrap}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            style={[
              styles.chip,
              value.includes(opt) ? styles.chipSelected : styles.chipUnselected,
              typeof max === 'number' && value.length >= max && !value.includes(opt) ? styles.chipDisabled : null
            ]}
            activeOpacity={0.85}
            disabled={typeof max === 'number' && value.length >= max && !value.includes(opt)}
          >
            <Text style={value.includes(opt) ? styles.chipTextSelected : styles.chipTextUnselected}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {typeof max === 'number' && (
        <View style={styles.maxInfoWrap}>
          <Text style={styles.info}>최대 {max}개 선택</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  emptyWrap: {
    marginBottom: 16,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 15,
    marginVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
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
  chipUnselected: {
    backgroundColor: '#f6f6f6',
    borderColor: '#ddd',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  chipTextUnselected: {
    color: '#222',
    fontWeight: '400',
    fontSize: 16,
  },
  label: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginLeft: 8,
    fontSize: 13,
  },
  info: {
    color: '#bbb',
    fontSize: 13,
  },
  maxInfoWrap: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default FormChips; 