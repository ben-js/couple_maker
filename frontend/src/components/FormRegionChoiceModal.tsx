import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FormRegionChoiceModalProps {
  label: string;
  value: Array<{ region: string; district: string }>;
  onChange: (val: Array<{ region: string; district: string }>) => void;
  regionData: Record<string, string[]>;
  error?: string;
  placeholder?: string;
  minSelect?: number;
  maxSelect?: number;
  type?: 'default' | 'same-line'; // type prop 추가
}

const FormRegionChoiceModal: React.FC<FormRegionChoiceModalProps> = ({ label, value = [], onChange, regionData, error, placeholder, minSelect = 1, maxSelect = 5, type = 'default' }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDistricts, setSelectedDistricts] = useState<Array<{ region: string; district: string }>>(value);

  // 지역 키 목록
  const regionNames = Object.keys(regionData);

  // 해당 지역의 value(하위지역) + '전체' 추가
  const getDistrictsWithAll = (region: string) => {
    const districts = regionData[region] || [];
    return ['전체', ...districts];
  };

  // chips 클릭 시 선택/해제
  const handleDistrictToggle = (district: string) => {
    if (!selectedRegion) return;
    if (district === '전체') {
      if (selectedDistricts.some(sel => sel.region === selectedRegion && sel.district === selectedRegion)) {
        setSelectedDistricts(selectedDistricts.filter(sel => !(sel.region === selectedRegion && sel.district === selectedRegion)));
      } else {
        setSelectedDistricts([
          ...selectedDistricts.filter(sel => sel.region !== selectedRegion),
          { region: selectedRegion, district: selectedRegion }
        ]);
      }
      return;
    }
    const exists = selectedDistricts.some(sel => sel.region === selectedRegion && sel.district === district);
    if (exists) {
      setSelectedDistricts(selectedDistricts.filter(sel => !(sel.region === selectedRegion && sel.district === district)));
    } else {
      let next = selectedDistricts.filter(sel => !(sel.region === selectedRegion && sel.district === selectedRegion));
      const regionCount = next.filter(sel => sel.region === selectedRegion).length;
      if (regionCount < maxSelect) {
        next = [...next, { region: selectedRegion, district }];
      }
      setSelectedDistricts(next);
    }
  };

  // chips 비활성화 조건
  const isDistrictDisabled = (district: string) => {
    if (!selectedRegion) return false;
    if (district === '전체') return false;
    const regionCount = selectedDistricts.filter(sel => sel.region === selectedRegion && sel.district !== selectedRegion).length;
    if (selectedDistricts.some(sel => sel.region === selectedRegion && sel.district === selectedRegion)) return true;
    return regionCount >= maxSelect && !selectedDistricts.some(sel => sel.region === selectedRegion && sel.district === district);
  };

  // chips 선택됨 여부
  const isDistrictSelected = (district: string) => {
    if (!selectedRegion) return false;
    if (district === '전체') return selectedDistricts.some(sel => sel.region === selectedRegion && sel.district === selectedRegion);
    return selectedDistricts.some(sel => sel.region === selectedRegion && sel.district === district);
  };

  // chips에서 X 클릭 시 해제 (선택 chips는 텍스트만, X 없음)
  // 확인 버튼 활성화 조건
  const isConfirmEnabled = selectedDistricts.length >= minSelect;

  // chips 바텀시트 닫기 및 값 반영
  const handleConfirm = () => {
    setModalVisible(false);
    onChange(selectedDistricts);
  };

  // chips 바텀시트 열기 시 현재 값 반영
  const handleOpen = () => {
    setSelectedDistricts(value);
    setModalVisible(true);
    setSelectedRegion(null);
  };

  // 뒤로가기 시 selectedDistricts 상태 유지
  const handleBackToRegions = () => {
    setSelectedRegion(null);
  };

  // chips 스타일 통일 (chips 타입과 완전히 동일하게)
  const chipStyle = (selected: boolean, disabled?: boolean) => ({
    borderRadius: 999,
    backgroundColor: disabled ? '#eee' : (selected ? '#3B82F6' : '#f6f6f6'),
    borderWidth: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 40,
    opacity: disabled ? 0.4 : 1,
  });
  const chipTextStyle = (selected: boolean, disabled?: boolean) => ({
    color: disabled ? '#bbb' : (selected ? '#fff' : '#222'),
    fontWeight: '400' as const,
    fontSize: 17,
    textAlign: 'center' as const
  });

  // chips 선택된 지역 텍스트 생성 (selectedDistricts 상태 반영)
  const selectedRegionText = selectedDistricts.length
    ? `선택 지역 : ${selectedDistricts.map(sel => sel.district === sel.region ? sel.region : `${sel.region} ${sel.district}`).join(', ')}`
    : `지역을 최소 ${minSelect}개 선택하세요`;

  return (
    <View style={{ marginBottom: 12 }}>
      {type === 'same-line' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontWeight: '700', color: '#222', fontSize: 16, marginRight: 8 }}>{label}</Text>
          <TouchableOpacity
            onPress={handleOpen}
            activeOpacity={0.8}
            style={{ backgroundColor: '#fff', minHeight: 48, justifyContent: 'center', paddingHorizontal: 0, paddingVertical: 12, flex: 1 }}
          >
            <Text style={{ color: value.length ? '#222' : '#bbb', fontSize: 16 }}>
              {value.length ? value.map(sel => sel.district === sel.region ? sel.region : `${sel.region} ${sel.district}`).join(', ') : (placeholder || '지역 선택')}
            </Text>
          </TouchableOpacity>
          {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontWeight: '700', color: '#222', fontSize: 16 }}>{label}</Text>
            {error && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error}</Text>}
          </View>
          <TouchableOpacity
            onPress={handleOpen}
            activeOpacity={0.8}
            style={{ backgroundColor: '#fff', minHeight: 48, justifyContent: 'center', paddingHorizontal: 0, paddingVertical: 12 }}
          >
            <Text style={{ color: value.length ? '#222' : '#bbb', fontSize: 16 }}>
              {value.length ? value.map(sel => sel.district === sel.region ? sel.region : `${sel.region} ${sel.district}`).join(', ') : (placeholder || '지역 선택')}
            </Text>
          </TouchableOpacity>
        </>
      )}
      <Modal visible={modalVisible} transparent={false} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 0, paddingHorizontal: 8, justifyContent: 'space-between' }}>
            {selectedRegion ? (
              <TouchableOpacity onPress={handleBackToRegions} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Feather name="arrow-left" size={26} color="#bbb" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#222' }}>{label} 선택</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Feather name="x" size={26} color="#bbb" />
            </TouchableOpacity>
          </View>
          {/* 안내문구 영역 항상 고정 */}
          <View style={{ paddingTop: 32, paddingBottom: 0, alignItems: 'center', minHeight: 32 }}>
            <Text style={{ color: '#222', fontSize: 16, textAlign: 'center' }}>
              {!selectedRegion ? selectedRegionText : (
                (() => {
                  // value 전체를 map해서 중복 없이 district/region을 쉼표로 구분해 표시
                  const allSelectedArr = value.map(sel => sel.district === sel.region ? sel.region : `${sel.region} ${sel.district}`);
                  // 현재 하위 chips에서 선택된 값(아직 value에 반영 전)이 있으면 미리 반영
                  const currentSelectedArr = selectedDistricts.filter(sel => sel.region === selectedRegion)
                    .map(sel => sel.district === sel.region ? sel.region : `${sel.region} ${sel.district}`);
                  // 중복 제거
                  const merged = Array.from(new Set([...allSelectedArr, ...currentSelectedArr]));
                  if (merged.length === 0) return `지역을 최소 ${minSelect}개 선택하세요`;
                  return `선택 지역 : ${merged.join(', ')}`;
                })()
              )}
            </Text>
          </View>
          {!selectedRegion ? (
            <>
              {/* chips 위에 label (상위 chips) */}
              <View style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 12 }}>
                <Text style={{ color: '#222', fontWeight: '700', fontSize: 16 }}>지역</Text>
              </View>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                marginTop: 0,
                paddingHorizontal: 0
              }}>
                {regionNames.map((r, idx) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      chipStyle(false, false),
                      {
                        width: 72,
                        marginHorizontal: 8,
                        marginBottom: 16,
                        height: 40,
                        paddingHorizontal: 0,
                      }
                    ]}
                    onPress={() => setSelectedRegion(r)}
                  >
                    <Text style={chipTextStyle(false, false)}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* 하단 고정 영역: 최대 N개 선택 안내 + 확인 버튼 */}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, marginBottom: 8 }}>
                  <Text style={{ color: '#bbb', fontSize: 13 }}>최대 {maxSelect}개 선택</Text>
                </View>
                <View style={{ padding: 24, paddingTop: 0 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: selectedDistricts.length >= minSelect ? '#3B82F6' : '#eee', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                    disabled={selectedDistricts.length < minSelect}
                    onPress={() => {
                      setModalVisible(false);
                      onChange(selectedDistricts);
                    }}
                  >
                    <Text style={{ color: selectedDistricts.length >= minSelect ? '#fff' : '#bbb', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* chips 위에 label (하위 chips) */}
              <View style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 12 }}>
                <Text style={{ color: '#222', fontWeight: '700', fontSize: 16 }}>지역</Text>
              </View>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%', marginTop: 0, paddingHorizontal: 0, paddingTop: 0 }}>
                {getDistrictsWithAll(selectedRegion).map((d, idx) => {
                  const disabled = isDistrictDisabled(d);
                  const selected = isDistrictSelected(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => handleDistrictToggle(d)}
                      style={[
                        chipStyle(selected, disabled),
                        {
                          width: 72,
                          marginHorizontal: 8,
                          marginBottom: 16,
                          height: 40,
                          paddingHorizontal: 0,
                        }
                      ]}
                      disabled={disabled}
                    >
                      <Text style={chipTextStyle(selected, disabled)}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {/* maxSelect 안내 우측 하단 */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, marginBottom: 8 }}>
                <Text style={{ color: '#bbb', fontSize: 13 }}>최대 {maxSelect}개 선택</Text>
              </View>
              {/* 확인 버튼 */}
              <View style={{ padding: 24, paddingTop: 0 }}>
                <TouchableOpacity
                  style={{ backgroundColor: isConfirmEnabled ? '#3B82F6' : '#eee', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                  disabled={!isConfirmEnabled}
                  onPress={handleConfirm}
                >
                  <Text style={{ color: isConfirmEnabled ? '#fff' : '#bbb', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default FormRegionChoiceModal; 