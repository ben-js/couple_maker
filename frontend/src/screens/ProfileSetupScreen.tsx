import React, { useState } from 'react';
import { ScrollView, StyleSheet, Modal, View as RNView, Button as RNButton, TouchableOpacity, Platform, Image } from 'react-native';
import { View, Text, TextField, Picker as UIPicker, Slider, Chip, Button, Avatar, RadioGroup, RadioButton } from 'react-native-ui-lib';
import { Picker as WheelPicker } from '@react-native-picker/picker';
import regionData from '../data/regions.json';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// @ts-ignore: expo-image-cropper 타입 선언 없음을 무시
declare module 'expo-image-cropper';

const bodyTypes = ['마름', '슬림탄탄', '보통', '근육질', '통통', '기타'];
const jobs = ['회사원', '학생', '자영업', '전문직', '기타'];
const educations = ['고졸', '전문학사', '학사', '석사', '박사'];
const religions = ['없음', '기독교', '불교', '천주교', '기타'];
const mbtis = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'];
const interestsList = [
  '여행', '음악', '운동', '독서', '영화', '요리', '게임', '사진',
  '드라마 보기', '넷플릭스 보기', '유튜브', '카페 탐방', '맛집 탐방',
  '산책', '캠핑', '반려동물', '봉사활동', '미술', '춤', '악기',
  '코딩', '쇼핑', '패션', '주식', '투자', '자기계발', '기타'
];
// '기타'가 항상 마지막에 오도록 보장
const sortedInterestsList = interestsList.filter(i => i !== '기타').concat('기타');

const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const regionNames = Object.keys(regionData);

const ProfileSetupScreen = () => {
  // 최대 5장 사진, 대표는 항상 0번 인덱스
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0); // 대표 이미지 인덱스(항상 0)
  const [photoModalIndex, setPhotoModalIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'남' | '여' | ''>('');
  const [birth, setBirth] = useState<{ year: number; month: number; day: number }>({ year: years[0], month: 1, day: 1 });
  const [birthModal, setBirthModal] = useState(false);
  const [regionModal, setRegionModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [showDistricts, setShowDistricts] = useState(false);
  const [height, setHeight] = useState(170);
  const [bodyType, setBodyType] = useState('');
  const [job, setJob] = useState('');
  const [education, setEducation] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [religion, setReligion] = useState('');
  const [mbti, setMbti] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [nameBlur, setNameBlur] = useState(false);
  const [interestsModal, setInterestsModal] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [photoActionIndex, setPhotoActionIndex] = useState<number|null>(null);
  const [prevInterests, setPrevInterests] = useState<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string|null>(null);
  const [previewTargetIdx, setPreviewTargetIdx] = useState<number|null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const toggleInterest = (item: string) => {
    setInterests((prev) => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        if (prev.length >= 3) return prev; // 3개 초과 선택 불가
        return [...prev, item];
      }
    });
  };

  // 사진 관련 함수들
  async function handleCamera(idx: number|null) {
    if (idx === null) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...photos];
      newPhotos[idx] = result.assets[0].uri;
      setPhotos(newPhotos);
      setPhotoModalIndex(null);
      setTimeout(() => setPhotoActionIndex(null), 30);
    }
  }
  async function handleGallery(idx: number|null) {
    if (idx === null) return;
    setPhotoActionIndex(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPreviewUri(result.assets[0].uri);
      setPreviewTargetIdx(idx);
      setShowPreview(true);
    }
  }
  function handleSetMain(idx: number) {
    if (idx === 0) return;
    const newPhotos = [...photos];
    const [main] = newPhotos.splice(idx, 1);
    newPhotos.unshift(main);
    while (newPhotos.length < 5) newPhotos.push(null);
    setPhotos(newPhotos.slice(0, 5));
    setPhotoModalIndex(null);
  }
  function handleDelete(idx: number) {
    const newPhotos = [...photos];
    newPhotos[idx] = null;
    setPhotos(newPhotos);
    setPhotoModalIndex(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text text30 marginB-16>프로필 작성</Text>
      {/* 대표 이미지만 메인에 */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => setShowPhotoPopup(true)}
          activeOpacity={0.8}
          style={{ width: 160, height: 160, backgroundColor: '#eee', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
        >
          {photos[0] ? (
            <Image source={{ uri: photos[0] }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
          ) : (
            <Avatar
              size={64}
              label="?"
              backgroundColor="#e5e6fa"
              labelColor="#bbb"
              containerStyle={{ alignSelf: 'center' }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* 전체 사진 관리 팝업 */}
      <Modal visible={showPhotoPopup} transparent animationType="fade" onRequestClose={() => setShowPhotoPopup(false)}>
        <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0005' }}>
          <RNView style={{ backgroundColor: '#fff', borderRadius: 20, paddingVertical: 24, width: 340, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>사진 관리</Text>
            {/* 대표 이미지 크게 중앙 */}
            <TouchableOpacity
              onPress={() => setPhotoActionIndex(0)}
              activeOpacity={0.8}
              style={{ width: 120, height: 120, backgroundColor: '#eee', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' }}
            >
              {photos[0] ? (
                <Image source={{ uri: photos[0] }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <Avatar
                  size={48}
                  label="?"
                  backgroundColor="#e5e6fa"
                  labelColor="#bbb"
                  containerStyle={{ alignSelf: 'center' }}
                />
              )}
              {/* 대표 뱃지 */}
              <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#6C6FC5', borderTopRightRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>대표</Text>
              </View>
            </TouchableOpacity>
            {/* 나머지 4개 이미지는 아래 한 줄 */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
              {[1,2,3,4].map(i => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setPhotoActionIndex(i)}
                  activeOpacity={0.8}
                  style={{ width: 56, height: 56, backgroundColor: '#eee', borderRadius: 8, marginHorizontal: 6, justifyContent: 'center', alignItems: 'center' }}
                >
                  {photos[i] ? (
                    <Image source={{ uri: photos[i] }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
                  ) : (
                    <Avatar
                      size={28}
                      label="?"
                      backgroundColor="#e5e6fa"
                      labelColor="#bbb"
                      containerStyle={{ alignSelf: 'center' }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Button label="닫기" onPress={() => setShowPhotoPopup(false)} style={{ marginTop: 8 }} />
          </RNView>
        </RNView>
        {/* 작은 액션 팝업 */}
        <Modal visible={photoActionIndex !== null} transparent animationType="fade" onRequestClose={() => setPhotoActionIndex(null)}>
          <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0005' }}>
            <RNView style={{ backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, width: 260, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 }}>
              <RNView style={{ alignItems: 'flex-start', paddingHorizontal: 20 }}>
                <TouchableOpacity style={{ paddingVertical: 14, width: '100%' }} onPress={async () => { await handleCamera(photoActionIndex); }}>
                  <Text style={{ fontSize: 16, color: '#222' }}>카메라</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 14, width: '100%' }} onPress={async () => { await handleGallery(photoActionIndex); }}>
                  <Text style={{ fontSize: 16, color: '#222' }}>갤러리</Text>
                </TouchableOpacity>
                {photoActionIndex !== 0 && photos[photoActionIndex ?? 0] && (
                  <TouchableOpacity style={{ paddingVertical: 14, width: '100%' }} onPress={() => { handleSetMain(photoActionIndex!); }}>
                    <Text style={{ fontSize: 16, color: '#222' }}>대표 이미지 설정</Text>
                  </TouchableOpacity>
                )}
                {photos[photoActionIndex ?? 0] && (
                  <TouchableOpacity style={{ paddingVertical: 14, width: '100%' }} onPress={() => { handleDelete(photoActionIndex!); }}>
                    <Text style={{ fontSize: 16, color: '#222' }}>사진 삭제</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={{ paddingVertical: 14, width: '100%' }} onPress={() => setPhotoActionIndex(null)}>
                  <Text style={{ fontSize: 16, color: '#888' }}>닫기</Text>
                </TouchableOpacity>
              </RNView>
            </RNView>
          </RNView>
        </Modal>
      </Modal>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>이름</Text>
        <TextField
          placeholder=""
          value={name}
          onChangeText={setName}
          style={styles.input}
          migrate
        />
        {name && nameBlur ? (
          <Text style={styles.namePill}>{`이름 ${name}`}</Text>
        ) : null}
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>성별</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="성별 선택"
          value={gender}
          onChange={setGender}
          topBarProps={{ title: '성별' }}
          style={styles.input}
          migrateTextField
        >
          <UIPicker.Item label="남" value="남" />
          <UIPicker.Item label="여" value="여" />
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>생년월일</Text>
        <View row spread>
          {/* 연도 Picker */}
          {/* @ts-expect-error */}
          <UIPicker
            placeholder="년"
            value={birth.year}
            onChange={(year: any) => setBirth(b => ({
              year: typeof year === 'object' && year !== null ? year.value : year,
              month: b.month,
              day: b.day,
            }))}
            topBarProps={{ title: '연도' }}
            style={[styles.input, {width: 100}]}
            migrateTextField
          >
            {years.map(y => (
              <UIPicker.Item key={y} value={y} label={`${y}년`} />
            ))}
          </UIPicker>
          {/* 월 Picker */}
          {/* @ts-expect-error */}
          <UIPicker
            placeholder="월"
            value={birth.month}
            onChange={(month: any) => setBirth(b => ({
              year: b.year,
              month: typeof month === 'object' && month !== null ? month.value : month,
              day: b.day,
            }))}
            topBarProps={{ title: '월' }}
            style={[styles.input, {width: 80}]}
            migrateTextField
          >
            {months.map(m => (
              <UIPicker.Item key={m} value={m} label={`${m}월`} />
            ))}
          </UIPicker>
          {/* 일 Picker */}
          {/* @ts-expect-error */}
          <UIPicker
            placeholder="일"
            value={birth.day}
            onChange={(day: any) => setBirth(b => ({
              year: b.year,
              month: b.month,
              day: typeof day === 'object' && day !== null ? day.value : day,
            }))}
            topBarProps={{ title: '일' }}
            style={[styles.input, {width: 80}]}
            migrateTextField
          >
            {days.map(d => (
              <UIPicker.Item key={d} value={d} label={`${d}일`} />
            ))}
          </UIPicker>
        </View>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>사는 곳</Text>
        <TouchableOpacity
          onPress={()=>{ setRegionModal(true); setShowDistricts(false); }}
          activeOpacity={0.8}
          style={[styles.input, { borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent', paddingHorizontal: 0, minHeight: 40, justifyContent: 'center' }]}
        >
          <Text style={{ color: selectedRegion ? '#222' : '#aaa', fontSize: 16 }}>
            {selectedRegion ? (selectedDistrict ? `${selectedRegion} ${selectedDistrict}` : selectedRegion) : '사는 곳 선택'}
          </Text>
        </TouchableOpacity>
        <Modal visible={regionModal} transparent animationType="fade">
          <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
            <RNView style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 340, minHeight: 320, paddingBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>사는 곳 선택</Text>
              {!showDistricts ? (
                <>
                  <RNView style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {regionNames.map((r, i) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.regionBtn, selectedRegion === r && styles.regionBtnSelected]}
                        onPress={() => {
                          setSelectedRegion(r);
                          setShowDistricts(true);
                        }}
                      >
                        <Text style={styles.regionBtnText}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNView>
                  <RNView style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'flex-end' }}>
                    <Button
                      label="닫기"
                      onPress={()=>setRegionModal(false)}
                      backgroundColor="#3B82F6"
                      borderRadius={16}
                      style={{ paddingHorizontal: 24, paddingVertical: 8, minWidth: 80 }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}
                    />
                  </RNView>
                </>
              ) : (
                <RNView>
                  <RNView style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: '#f6f6f6', borderRadius: 8, padding: 4 }}>
                    {regionData[selectedRegion as keyof typeof regionData]?.map((d: string) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.regionBtn, selectedDistrict === d && styles.regionBtnSelected]}
                        onPress={() => { setSelectedDistrict(d); setRegionModal(false); }}
                      >
                        <Text style={styles.regionBtnText}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNView>
                  <RNView style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'flex-end' }}>
                    <Button
                      label="이전"
                      onPress={()=>setShowDistricts(false)}
                      backgroundColor="#fff"
                      outline
                      outlineColor="#888"
                      borderRadius={16}
                      style={{ paddingHorizontal: 24, paddingVertical: 8, marginRight: 12, minWidth: 80 }}
                      labelStyle={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}
                    />
                    <Button
                      label="닫기"
                      onPress={()=>setRegionModal(false)}
                      backgroundColor="#3B82F6"
                      borderRadius={16}
                      style={{ paddingHorizontal: 24, paddingVertical: 8, minWidth: 80 }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}
                    />
                  </RNView>
                </RNView>
              )}
            </RNView>
          </RNView>
        </Modal>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>키</Text>
        <View row centerV>
          <Slider
            value={height}
            minimumValue={140}
            maximumValue={200}
            step={1}
            onValueChange={setHeight}
            containerStyle={{ flex: 1, marginRight: 12 }}
            minimumTrackTintColor={'#3B82F6'}
            thumbTintColor={'#3B82F6'}
          />
          <Text style={{ color: '#222', fontWeight: '300', minWidth: 56, textAlign: 'right' }}>{height}cm</Text>
        </View>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>체형</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="체형 선택"
          value={bodyType}
          onChange={setBodyType}
          topBarProps={{ title: '체형' }}
          style={styles.input}
          migrateTextField
        >
          {bodyTypes.map(b => (
            <UIPicker.Item key={b} value={b} label={b} />
          ))}
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>직업</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="직업 선택"
          value={job}
          onChange={setJob}
          topBarProps={{ title: '직업' }}
          style={styles.input}
          migrateTextField
        >
          {jobs.map(j => (
            <UIPicker.Item key={j} value={j} label={j} />
          ))}
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>학력</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="학력 선택"
          value={education}
          onChange={setEducation}
          topBarProps={{ title: '학력' }}
          style={styles.input}
          migrateTextField
        >
          {educations.map(e => (
            <UIPicker.Item key={e} value={e} label={e} />
          ))}
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>흡연 여부</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="흡연 여부"
          value={smoking}
          onChange={setSmoking}
          topBarProps={{ title: '흡연' }}
          style={styles.input}
          migrateTextField
        >
          <UIPicker.Item label="비흡연" value="비흡연" />
          <UIPicker.Item label="흡연" value="흡연" />
          <UIPicker.Item label="가끔" value="가끔" />
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>음주 여부</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="음주 여부"
          value={drinking}
          onChange={setDrinking}
          topBarProps={{ title: '음주' }}
          style={styles.input}
          migrateTextField
        >
          <UIPicker.Item label="비음주" value="비음주" />
          <UIPicker.Item label="음주" value="음주" />
          <UIPicker.Item label="가끔" value="가끔" />
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>종교</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="종교 선택"
          value={religion}
          onChange={setReligion}
          topBarProps={{ title: '종교' }}
          style={styles.input}
          migrateTextField
        >
          {religions.map(r => (
            <UIPicker.Item key={r} value={r} label={r} />
          ))}
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>MBTI</Text>
        {/* @ts-ignore */}
        <UIPicker
          placeholder="MBTI 선택"
          value={mbti}
          onChange={setMbti}
          topBarProps={{ title: 'MBTI' }}
          style={styles.input}
          migrateTextField
        >
          {mbtis.map(m => (
            <UIPicker.Item key={m} value={m} label={m} />
          ))}
        </UIPicker>
      </View>
      <View marginB-12>
        <Text style={{marginBottom: 4}}>취미</Text>
        <TouchableOpacity
          onPress={() => {
            setPrevInterests(interests);
            setInterestsModal(true);
          }}
          activeOpacity={0.8}
          style={[styles.input, { borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent', paddingHorizontal: 0, minHeight: 40, justifyContent: 'center' }]}
        >
          <Text style={{ color: interests.length ? '#222' : '#aaa', fontSize: 16 }}>
            {interests.length ? interests.join(', ') : '취미를 3개 이상 선택하세요'}
          </Text>
        </TouchableOpacity>
        <Modal visible={interestsModal} transparent animationType="fade">
          <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
            <RNView style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 368, minHeight: 220, paddingBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>취미를 3개 선택하세요</Text>
              <RNView style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {sortedInterestsList.map(item => (
                  <Chip
                    key={item}
                    label={item}
                    onPress={() => toggleInterest(item)}
                    selected={interests.includes(item)}
                    containerStyle={{
                      marginHorizontal: 4,
                      marginVertical: 4,
                      minWidth: 64,
                      minHeight: 40,
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      backgroundColor: interests.includes(item) ? '#3B82F6' : '#f0f0f0',
                      borderColor: interests.includes(item) ? '#3B82F6' : '#ccc',
                    }}
                    labelStyle={{
                      color: interests.includes(item) ? '#fff' : '#222',
                      fontWeight: interests.includes(item) ? 'bold' : 'normal',
                      fontSize: 16,
                    }}
                  />
                ))}
              </RNView>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
                <Button
                  label="확인"
                  disabled={interests.length !== 3}
                  onPress={() => setInterestsModal(false)}
                  style={{ marginRight: 12, minWidth: 80 }}
                />
                <Button
                  label="닫기"
                  outline
                  outlineColor="#888"
                  backgroundColor="#fff"
                  onPress={() => {
                    if (interests.length !== 3) setInterests(prevInterests);
                    setInterestsModal(false);
                  }}
                  style={{ minWidth: 80 }}
                  labelStyle={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}
                />
              </View>
            </RNView>
          </RNView>
        </Modal>
      </View>
      <TextField
        placeholder="자기소개"
        value={bio}
        onChangeText={setBio}
        floatingPlaceholder
        multiline
        style={[styles.input, {height: 80}]}
        migrate
      />
      <Button label="저장" marginT-16 onPress={()=>{}} />
      {/* Crop Preview UI */}
      {showPreview && previewUri && (
        <Modal visible={showPreview} transparent animationType="fade">
          <RNView style={{ flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center' }}>
            <RNView style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginBottom: 12 }}>이미지를 정사각형으로 자릅니다. 미리보기 확인 후 저장하세요.</Text>
              <Image source={{ uri: previewUri }} style={{ width: 240, height: 240, borderRadius: 8, marginBottom: 16 }} resizeMode="cover" />
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Button
                  label="닫기"
                  outline
                  outlineColor="#888"
                  backgroundColor="#fff"
                  onPress={() => { setShowPreview(false); setPreviewUri(null); setPreviewTargetIdx(null); }}
                  style={{ minWidth: 80, marginRight: 12 }}
                  labelStyle={{ color: '#888', fontWeight: 'bold', fontSize: 16 }}
                />
                <Button
                  label="저장"
                  onPress={async () => {
                    // 중앙 기준 정사각형 crop (Image.getSize 사용)
                    Image.getSize(previewUri!, async (width, height) => {
                      const size = Math.min(width, height);
                      const cropRegion = {
                        originX: Math.floor((width - size) / 2),
                        originY: Math.floor((height - size) / 2),
                        width: size,
                        height: size,
                      };
                      const manipResult = await ImageManipulator.manipulateAsync(
                        previewUri!,
                        [{ crop: cropRegion }],
                        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                      );
                      const newPhotos = [...photos];
                      if (previewTargetIdx !== null) newPhotos[previewTargetIdx] = manipResult.uri;
                      setPhotos(newPhotos);
                      setShowPreview(false);
                      setPreviewUri(null);
                      setPreviewTargetIdx(null);
                      setPhotoModalIndex(null);
                    });
                  }}
                  style={{ minWidth: 80 }}
                />
              </View>
            </RNView>
          </RNView>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff' },
  input: { marginBottom: 12 },
  regionBtn: {
    width: '23%', margin: '1%', borderWidth: 1, borderColor: '#ccc', marginBottom: 12, alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: '#fff'
  },
  regionBtnSelected: {
    backgroundColor: '#3B82F6'
  },
  regionBtnText: {
    color: '#222', fontWeight: 'bold'
  },
  namePill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F6',
    color: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontWeight: 'bold',
    fontSize: 16,
    overflow: 'hidden',
  },
});

export default ProfileSetupScreen; 