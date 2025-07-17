import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FormModalSelectorProps {
  label: string;
  value: string[];
  options: string[];
  onChange: (val: string[]) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  error?: string;
}

const FormModalSelector: React.FC<FormModalSelectorProps> = ({
  label,
  value,
  options,
  onChange,
  min = 0,
  max = 5,
  placeholder = '',
  error
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(value || []);

  const toggle = (item: string) => {
    if (tempSelected.includes(item)) {
      setTempSelected(tempSelected.filter(v => v !== item));
    } else {
      if (tempSelected.length < max) {
        setTempSelected([...tempSelected, item]);
      }
    }
  };

  const handleConfirm = () => {
    console.log('FormModalSelector - handleConfirm called');
    console.log('FormModalSelector - tempSelected:', tempSelected);
    console.log('FormModalSelector - min:', min);
    console.log('FormModalSelector - tempSelected.length >= min:', tempSelected.length >= min);
    
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

  return (
    <View style={{ marginBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{label}</Text>
        {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
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
              <Feather name="x" size={16} color="#888" />
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
              <Feather name="x" size={26} color="#bbb" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-start', padding: 24 }}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => toggle(opt)}
                style={[
                  { borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: tempSelected.includes(opt) ? '#3B82F6' : '#f6f6f6', margin: 6, paddingVertical: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }
                ]}
                activeOpacity={0.85}
                disabled={tempSelected.length >= max && !tempSelected.includes(opt)}
              >
                <Text style={{ color: tempSelected.includes(opt) ? '#fff' : '#222', fontWeight: tempSelected.includes(opt) ? '700' : '400', fontSize: 16 }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ padding: 24, paddingTop: 0 }}>
            <TouchableOpacity
              style={{ 
                backgroundColor: tempSelected.length >= min ? '#3B82F6' : '#f3f4f6', 
                borderRadius: 12, 
                paddingVertical: 14, 
                alignItems: 'center',
                borderWidth: 0,
                borderColor:'transparent'
              }}
              onPress={handleConfirm}
              disabled={tempSelected.length < min}
            >
              <Text style={{ 
                color: tempSelected.length >= min ? '#fff' : '#4b5563', 
                fontWeight: 'bold', 
                fontSize: 16 
              }}>
                {tempSelected.length >= min ? '확인' : `${min - tempSelected.length}개 더 선택하세요`}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default FormModalSelector; 