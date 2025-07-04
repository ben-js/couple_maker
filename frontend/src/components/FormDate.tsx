import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FormDateProps {
  label: string;
  value?: { year: number; month: number; day: number };
  onChange: (val: { year: number; month: number; day: number }) => void;
  onBlur?: () => void;
  error?: string;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
}

const getDefaultBirth = () => {
  const now = new Date();
  return { year: now.getFullYear() - 20, month: 1, day: 1 };
};

const FormDate: React.FC<FormDateProps> = ({ label, value, onChange, onBlur, error, minYear = 1950, maxYear = new Date().getFullYear(), placeholder }) => {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'year' | 'month' | 'day'>('year');
  const safeValue = value && value.year && value.month && value.day ? value : getDefaultBirth();
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSelect = (type: 'year' | 'month' | 'day', val: number) => {
    if (type === 'year') {
      onChange({ ...safeValue, year: val });
      onBlur && onBlur();
      setMode('month');
    } else if (type === 'month') {
      onChange({ ...safeValue, month: val });
      onBlur && onBlur();
      setMode('day');
    } else {
      onChange({ ...safeValue, day: val });
      onBlur && onBlur();
      setVisible(false);
      setMode('year');
    }
  };

  const getTitle = () => {
    if (mode === 'year') return '연도';
    if (mode === 'month') return '월';
    return '일';
  };

  const getList = () => {
    if (mode === 'year') return years.map(y => ({ label: `${y}년`, value: y }));
    if (mode === 'month') return months.map(m => ({ label: `${m}월`, value: m }));
    return days.map(d => ({ label: `${d}일`, value: d }));
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={styles.label}>{label}</Text>
        {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
        style={{ minHeight: 44, justifyContent: 'center', borderWidth: 0, borderRadius: 0, paddingHorizontal: 0, marginBottom: 0 }}
      >
        <Text style={{ fontSize: 16, color: safeValue.year ? '#222' : '#bbb' }}>
          {safeValue.year && safeValue.month && safeValue.day ? `${safeValue.year}년 ${safeValue.month}월 ${safeValue.day}일` : placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent={false} animationType="slide">
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>{getTitle()}</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setMode('year'); }} style={styles.closeBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Feather name="x" size={26} color="#bbb" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={getList()}
            keyExtractor={item => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect(mode, item.value)}
                activeOpacity={0.85}
              >
                <Text style={styles.optionText}>{item.label}</Text>
                {safeValue[mode] === item.value && (
                  <Feather name="check" size={22} color="#222" style={styles.checkIcon} />
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
  label: {
    fontWeight: '700',
    color: '#222',
    fontSize: 16,
    marginBottom: 0,
    textAlign: 'left',
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
  error: {
    color: 'red',
    marginTop: 4,
    fontSize: 13,
  },
});

export default FormDate; 