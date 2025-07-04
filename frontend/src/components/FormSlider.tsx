import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Slider } from 'react-native-ui-lib';

interface FormSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  error?: string;
  placeholder?: string;
}

const FormSlider: React.FC<FormSliderProps> = ({ label, value, onChange, min = 140, max = 200, error }) => {
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.label}>{label}</Text>
        {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
        <Slider
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={1}
          onValueChange={onChange}
          containerStyle={{ flex: 1, marginRight: 12, height: 36 }}
          minimumTrackTintColor={'#3B82F6'}
          thumbTintColor={'#3B82F6'}
        />
        <Text style={styles.value}>{value}cm</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
    color: '#222',
    fontSize: 16,
    marginBottom: 0,
    textAlign: 'left',
  },
  value: {
    color: '#222',
    fontWeight: '400',
    fontSize: 17,
    minWidth: 56,
    textAlign: 'right',
  },
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 13,
  },
});

export default FormSlider; 