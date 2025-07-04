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

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    onChange({ region: selectedRegion, district });
    setModalVisible(false);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontWeight: '700', color: '#222', fontSize: 16 }}>{label}</Text>
        {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => { setModalVisible(true); setShowDistricts(false); }}
        activeOpacity={0.8}
        style={{
          backgroundColor: '#fff',
          minHeight: 48,
          justifyContent: 'center',
          paddingHorizontal: 0,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: value.region ? '#222' : '#bbb', fontSize: 16 }}>
          {value.region ? (value.district && value.district !== value.region ? `${value.region} ${value.district}` : value.region) : '사는 곳 선택'}
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
                    onPress={() => { 
                      setSelectedRegion(r); 
                      // 하위 지역이 1개이고 상위 지역과 같은 경우 바로 선택
                      if (regionData[r].length === 1 && regionData[r][0] === r) {
                        onChange({ region: r, district: r });
                        setModalVisible(false);
                      } else {
                        setShowDistricts(true);
                      }
                    }}
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
                    onPress={() => handleDistrictSelect(d)}
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
    </View>
  );
};

export default FormRegionModal; 