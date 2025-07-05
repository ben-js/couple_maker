import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { colors } from '../constants/colors';

interface FormRangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value?: [number, number];
  onValueChange: (value: [number, number]) => void;
  error?: string;
  required?: boolean;
}

export const FormRangeSlider: React.FC<FormRangeSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value = [min, max],
  onValueChange,
  error,
  required = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <Text style={styles.valueTextBlack}>
          {value[0]} - {value[1]}
        </Text>
      </View>
      <View style={styles.sliderRow}>
        <MultiSlider
          values={[value[0], value[1]]}
          min={min}
          max={max}
          step={step}
          onValuesChange={vals => onValueChange([vals[0], vals[1]])}
          selectedStyle={{ backgroundColor: '#3B82F6' }}
          unselectedStyle={{ backgroundColor: '#eee' }}
          markerStyle={styles.thumb}
          containerStyle={{ flex: 1, marginHorizontal: 12 }}
          trackStyle={{ height: 6, borderRadius: 3 }}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  required: {
    color: colors.error,
  },
  valueTextBlack: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 5,
  },
}); 