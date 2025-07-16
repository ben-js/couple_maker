import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, FlatList, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getOptionsByFormType, FormType } from '../utils/optionUtils';

const CHECK_COLOR = '#3897F0';

interface FormPickerProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  formType?: FormType; // 폼 타입 추가
  optionsKey?: string; // 옵션 키 추가 (formType과 함께 사용)
}

const FormPicker: React.FC<FormPickerProps> = ({ 
  label, 
  options, 
  value, 
  onChange, 
  error, 
  placeholder,
  formType,
  optionsKey 
}) => {
  const [visible, setVisible] = useState(false);
  
  // 폼 타입과 옵션 키가 제공된 경우 동적으로 옵션 필터링
  const displayOptions = formType && optionsKey 
    ? getOptionsByFormType(optionsKey, formType)
    : options;
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
        style={styles.pickerButton}
      >
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? value : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent={false} animationType="slide">
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Feather name="x" size={26} color="#bbb" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={displayOptions}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onChange(item);
                  setVisible(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.optionText}>{item}</Text>
                {value === item && (
                  <Feather name="check" size={22} color={CHECK_COLOR} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.optionList}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  pickerButton: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  valueText: {
    fontSize: 16,
    color: '#222',
  },
  placeholderText: {
    fontSize: 16,
    color: '#bbb',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#222',
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  optionList: {
    paddingBottom: 24,
  },
});

export default FormPicker; 