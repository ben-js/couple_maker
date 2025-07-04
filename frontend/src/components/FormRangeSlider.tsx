import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const [range, setRange] = useState<[number, number]>(value);

  const handleValueChange = (newRange: [number, number]) => {
    setRange(newRange);
    onValueChange(newRange);
  };

  const decreaseMin = () => {
    if (range[0] > min) {
      handleValueChange([range[0] - step, range[1]]);
    }
  };

  const increaseMin = () => {
    if (range[0] < range[1] - step) {
      handleValueChange([range[0] + step, range[1]]);
    }
  };

  const decreaseMax = () => {
    if (range[1] > range[0] + step) {
      handleValueChange([range[0], range[1] - step]);
    }
  };

  const increaseMax = () => {
    if (range[1] < max) {
      handleValueChange([range[0], range[1] + step]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <Text style={styles.valueText}>
          {range[0]} - {range[1]}
        </Text>
      </View>
      
      <View style={styles.rangeContainer}>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>최소</Text>
          <View style={styles.rangeControls}>
            <TouchableOpacity onPress={decreaseMin} style={styles.controlButton}>
              <Text style={styles.controlText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.rangeValue}>{range[0]}</Text>
            <TouchableOpacity onPress={increaseMin} style={styles.controlButton}>
              <Text style={styles.controlText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>최대</Text>
          <View style={styles.rangeControls}>
            <TouchableOpacity onPress={decreaseMax} style={styles.controlButton}>
              <Text style={styles.controlText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.rangeValue}>{range[1]}</Text>
            <TouchableOpacity onPress={increaseMax} style={styles.controlButton}>
              <Text style={styles.controlText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
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
  valueText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  rangeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 5,
  },
}); 