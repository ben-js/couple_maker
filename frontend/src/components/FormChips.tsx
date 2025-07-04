import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView } from 'react-native';

interface FormChipsProps {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  min?: number;
  max?: number;
  error?: string;
  label?: string;
  modal?: boolean;
  placeholder?: string;
}

const FormChips: React.FC<FormChipsProps> = ({ options, value, onChange, min, max, error, label, modal = true, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(value || []);

  const toggle = (item: string) => {
    if (tempSelected.includes(item)) {
      setTempSelected(tempSelected.filter(v => v !== item));
    } else {
      if (!max || tempSelected.length < max) {
        setTempSelected([...tempSelected, item]);
      }
    }
  };

  const handleConfirm = () => {
    setModalVisible(false);
    onChange(tempSelected);
  };

  const handleOpen = () => {
    setTempSelected(value);
    setModalVisible(true);
  };

  const removeSelected = (item: string) => {
    const filtered = value.filter(v => v !== item);
    onChange(filtered);
  };

  if (modal) {
    return (
      <View style={{ marginBottom: 0 }}>
        {label && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 16 }}>{label}</Text>
            {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
          </View>
        )}
        <TouchableOpacity
          onPress={handleOpen}
          activeOpacity={0.8}
          style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 0, marginBottom: 16 }}
        >
          <Text style={{ color: value.length ? '#222' : '#bbb', fontSize: 16, fontWeight: value.length ? 'normal' : '400' }}>
            {value.length ? value.join(', ') : placeholder}
          </Text>
        </TouchableOpacity>
        {/* 선택 리스트 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {value.map((item, idx) => (
            <View key={item + idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3e8f0', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, margin: 2 }}>
              <Text style={{ color: '#222', fontSize: 14 }}>{item}</Text>
              <TouchableOpacity onPress={() => removeSelected(item)} style={{ marginLeft: 4 }}>
                <Text style={{ color: '#888', fontWeight: 'bold' }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Modal visible={modalVisible} transparent={false} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 0, paddingHorizontal: 8, justifyContent: 'space-between' }}>
              <View style={{ width: 40 }} />
              <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#222' }}>{label} 선택</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Text style={{ color: '#bbb', fontSize: 26 }}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-start', padding: 24 }}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => toggle(opt)}
                  style={[
                    styles.chip,
                    tempSelected.includes(opt) && styles.chipSelected
                  ]}
                  activeOpacity={0.85}
                  disabled={max && tempSelected.length >= max && !tempSelected.includes(opt)}
                >
                  <Text style={[
                    styles.chipText,
                    tempSelected.includes(opt) && styles.chipTextSelected
                  ]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ padding: 24, paddingTop: 0 }}>
              {min && <Text style={{ color: '#bbb', fontSize: 13, marginBottom: 8 }}>최소 {min}개 선택</Text>}
              {max && <Text style={{ color: '#bbb', fontSize: 13, marginBottom: 8 }}>최대 {max}개 선택</Text>}
              <TouchableOpacity
                style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                onPress={handleConfirm}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  }

  // 인라인 chips (기존 방식)
  return (
    <View style={{ marginBottom: 0 }}>
      {label && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 16 }}>{label}</Text>
          {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
        </View>
      )}
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