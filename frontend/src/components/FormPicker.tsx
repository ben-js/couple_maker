import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FormPickerProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
}

const CHECK_COLOR = '#222';

const FormPicker: React.FC<FormPickerProps> = ({ label, options, value, onChange, error, placeholder }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 16 }}>{label}</Text>
        {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
        style={{ minHeight: 44, justifyContent: 'center', borderWidth: 0, borderRadius: 0, paddingHorizontal: 0, marginBottom: 16 }}
      >
        <Text style={{ fontSize: 16, color: value ? '#222' : '#bbb' }}>
          {value ? value : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent={false} animationType="slide">
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Feather name="x" size={26} color="#bbb" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item}
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
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    position: 'relative',
  },
  optionText: {
    fontSize: 17,
    color: '#222',
    textAlign: 'left',
    flex: 1,
    fontWeight: '400',
  },
  checkIcon: {
    marginLeft: 8,
    alignSelf: 'center',
  },
});

export default FormPicker; 