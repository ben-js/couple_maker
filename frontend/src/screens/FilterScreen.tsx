import React, { useState } from 'react';
import { View, Text, Button, ScrollView, ChipsInput, RangeSlider, Picker, ProgressBar } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '@/constants';

const FilterScreen = () => {
  const navigation = useNavigation();

  // 목업 데이터
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState([25, 35]);
  const [region, setRegion] = useState('');
  const [heightRange, setHeightRange] = useState([160, 180]);
  const [education, setEducation] = useState('');
  const [job, setJob] = useState('');
  const [values, setValues] = useState([]);
  const [personality, setPersonality] = useState([]);
  const [style, setStyle] = useState([]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>필터</Text>
      <Text style={styles.label}>성별</Text>
      <ChipsInput value={gender} onChange={setGender} chips={['남성', '여성']} />
      <Text style={styles.label}>나이</Text>
      <RangeSlider value={ageRange} onValueChange={setAgeRange} minimumValue={18} maximumValue={45} step={1} />
      <Text style={styles.label}>지역</Text>
      <Picker value={region} onChange={setRegion} items={[{label:'서울',value:'서울'},{label:'경기',value:'경기'}]} />
      <Text style={styles.label}>키</Text>
      <RangeSlider value={heightRange} onValueChange={setHeightRange} minimumValue={150} maximumValue={190} step={1} />
      <Text style={styles.label}>학력</Text>
      <Picker value={education} onChange={setEducation} items={[{label:'대학교',value:'대학교'},{label:'대학원',value:'대학원'}]} />
      <Text style={styles.label}>직업</Text>
      <Picker value={job} onChange={setJob} items={[{label:'개발자',value:'개발자'},{label:'디자이너',value:'디자이너'}]} />
      <Text style={styles.label}>가치관</Text>
      <ChipsInput value={values} onChange={setValues} chips={['자유', '안정', '성취']} multi />
      <Text style={styles.label}>성격</Text>
      <ChipsInput value={personality} onChange={setPersonality} chips={['외향', '내향', '유쾌']} multi />
      <Text style={styles.label}>연애스타일</Text>
      <ChipsInput value={style} onChange={setStyle} chips={['직진', '신중', '로맨틱']} multi />
      <View style={{ marginVertical: 18 }}>
        <ProgressBar progress={0.7} progressColor={'#E94F4F'} style={{ height: 10, borderRadius: 6 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button label="초기화" onPress={() => { setGender(''); setAgeRange([25,35]); setRegion(''); setHeightRange([160,180]); setEducation(''); setJob(''); setValues([]); setPersonality([]); setStyle([]); }} outline />
        <Button label="적용" onPress={() => { /* 필터 적용 */ }} backgroundColor={'#E94F4F'} color={'#fff'} />
      </View>
    </ScrollView>
  );
};

// 스타일 추가
const styles = {
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: '#888',
    marginTop: 16,
    marginBottom: 6,
  },
};

export default FilterScreen; 