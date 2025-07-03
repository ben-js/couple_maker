import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FormRegionModalProps {
  label: string;
  value: { region: string; district: string };
  onChange: (val: { region: string; district: string }) => void;
  regionData: Record<string, string[]>;
  error?: string;
}

const FormRegionModal: React.FC<FormRegionModalProps> = ({ label, value, onChange, regionData, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(value.region || '');
  const [selectedDistrict, setSelectedDistrict] = useState(value.district || '');
  const [showDistricts, setShowDistricts] = useState(false);
  const regionNames = Object.keys(regionData);

  const handleSelect = () => {
    onChange({ region: selectedRegion, district: selectedDistrict });
    setModalVisible(false);
  };

  return (
    <View style={{ marginBottom: 0 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => { setModalVisible(true); setShowDistricts(false); }}
        activeOpacity={0.8}
        style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 0, marginBottom: 16 }}
      >
        <Text style={{ color: value.region ? '#222' : '#bbb', fontSize: 16, fontWeight: value.region ? 'normal' : '400' }}>
          {value.region ? (value.district ? `${value.region} ${value.district}` : value.region) : '사는 곳 선택'}
        </Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent={false} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 0, paddingHorizontal: 8, justifyContent: 'space-between' }}>
            {showDistricts ? (
              <TouchableOpacity onPress={() => setShowDistricts(false)} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Feather name="arrow-left" size={24} color="#bbb" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#222' }}>{label} 선택</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Feather name="x" size={26} color="#bbb" />
            </TouchableOpacity>
          </View>
          {!showDistricts ? (
            <>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24 }}>
                {regionNames.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={{ padding: 8, margin: 4, borderRadius: 8, backgroundColor: selectedRegion === r ? '#3B82F6' : '#eee', minWidth: 80, alignItems: 'center' }}
                    onPress={() => { setSelectedRegion(r); setShowDistricts(true); }}
                  >
                    <Text style={{ color: selectedRegion === r ? '#fff' : '#222', fontWeight: 'bold', fontSize: 16 }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ padding: 24, paddingTop: 0 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, backgroundColor: '#fff', borderRadius: 8 }}>
                {regionData[selectedRegion]?.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={{ padding: 8, margin: 4, borderRadius: 8, backgroundColor: selectedDistrict === d ? '#3B82F6' : '#eee', minWidth: 80, alignItems: 'center' }}
                    onPress={() => { setSelectedDistrict(d); setModalVisible(false); handleSelect(); }}
                  >
                    <Text style={{ color: selectedDistrict === d ? '#fff' : '#222', fontWeight: 'bold', fontSize: 16 }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ padding: 24, paddingTop: 0 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
      {error && <Text style={{ color: 'red', marginTop: 4, fontSize: 13 }}>{error}</Text>}
    </View>
  );
};

export default FormRegionModal; 