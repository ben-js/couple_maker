import React, { useState } from 'react';
import { ScrollView, StyleSheet, Modal, View as RNView, Button as RNButton, TouchableOpacity, Platform, Image, SafeAreaView } from 'react-native';
import { View, Text, TextField, Picker as UIPicker, Slider, Chip, Button, Avatar, RadioGroup, RadioButton, Dialog } from 'react-native-ui-lib';
import { Picker as WheelPicker } from '@react-native-picker/picker';
import regionData from '../data/regions.json';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { saveOrUpdateProfile, UserProfile } from '../db/user';
import { useAuth } from '../store/AuthContext';
import { saveUserProfile } from '../services/userService';
import optionsRaw from '../data/options.json';
import { Options } from '../types/options';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import formTemplate from '../data/profileFormTemplate.json';
import FormInput from '../components/FormInput';
import FormRadio from '../components/FormRadio';
import FormCheckboxGroup from '../components/FormCheckboxGroup';
import FormPicker from '../components/FormPicker';
import FormSlider from '../components/FormSlider';
import FormDate from '../components/FormDate';
import FormRegionModal from '../components/FormRegionModal';
import FormChips from '../components/FormChips';
import { Feather } from '@expo/vector-icons';
const options = optionsRaw as Options;

// @ts-ignore: expo-image-cropper 타입 선언 없음을 무시
declare module 'expo-image-cropper';

// '기타'가 항상 마지막에 오도록 보장
const sortedInterestsList = options.interests.filter(i => i !== '기타').concat('기타');

const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const regionNames = Object.keys(regionData);

const bodyTypes = options.bodyTypes;
const jobs = options.jobs;
const educations = options.educations;
const religions = options.religions;
const mbtis = options.mbtis;
const interestsList = options.interests;

// yup 스키마 동적 생성
const schemaFields: any = {};
formTemplate.forEach(field => {
  if (field.type === 'input') {
    schemaFields[field.name] = field.required ? yup.string().required(field.placeholder || `${field.label}을(를) 입력해 주세요`) : yup.string();
  } else if (field.type === 'radio') {
    schemaFields[field.name] = field.required ? yup.string().oneOf(field.options, `${field.label}을(를) 선택해 주세요`).required(`${field.label}을(를) 선택해 주세요`) : yup.string();
  } else if (field.type === 'checkbox') {
    let s = yup.array().of(yup.string());
    if (field.required) s = s.min(field.min || 1, `${field.label}을(를) ${field.min || 1}개 이상 선택해 주세요`);
    if (field.max) s = s.max(field.max, `${field.label}은(는) 최대 ${field.max}개까지 선택 가능합니다`);
    schemaFields[field.name] = s;
  } else if (field.type === 'date') {
    schemaFields[field.name] = field.required ? yup.string().required(`${field.label}을(를) 선택해 주세요`) : yup.string();
  } else if (field.type === 'select') {
    schemaFields[field.name] = field.required ? yup.string().required(`${field.label}을(를) 선택해 주세요`) : yup.string();
  }
});
const schema = yup.object().shape(schemaFields);

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
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { control, handleSubmit, formState: { errors }, register, watch, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: formTemplate.reduce((acc, cur) => {
      acc[cur.name] = cur.type === 'checkbox' ? [] : '';
      return acc;
    }, {} as any),
  });
  const [genderModal, setGenderModal] = useState(false);
  const [activeChipsModalField, setActiveChipsModalField] = useState<string | null>(null);

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
    setPhotoActionIndex(null);
  }
  function handleDelete(idx: number) {
    const newPhotos = [...photos];
    newPhotos[idx] = null;
    setPhotos(newPhotos);
    setPhotoModalIndex(null);
  }

  const onSubmit = async (data: any) => {
    if (!user) return;
    // 사진 등 특수 필드는 별도 추가 필요
    const profile = {
      id: user.id,
      ...data,
    };
    try {
      const updatedUser = await saveUserProfile(user.id, profile);
      if (!updatedUser.hasPreferences) {
        navigation.navigate('PreferenceSetupScreen');
      } else {
        navigation.navigate('HomeScreen');
      }
    } catch (e) {
      alert('프로필 저장 실패: ' + (e as Error).message);
    }
  };

  // 동적 옵션 주입
  const dynamicOptions = {
    bodyType: options.bodyTypes,
    job: options.jobs,
    education: options.educations,
    religion: options.religions,
    mbti: options.mbtis,
    interests: options.interests,
  };

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

      {/* 전체 사진 관리 다이얼로그 */}
      <Dialog
        visible={showPhotoPopup}
        onDismiss={() => setShowPhotoPopup(false)}
        containerStyle={{ justifyContent: 'center', alignItems: 'center' }}
        width={340}
        panDirection={null}
      >
        <RNView style={{ backgroundColor: '#fff', borderRadius: 20, paddingVertical: 24, width: 340, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>사진 관리</Text>
          {/* 대표 이미지 크게 중앙 */}
          <TouchableOpacity
            onPress={() => setPhotoActionIndex(0)}
            activeOpacity={0.8}
            style={{ width: 120, height: 120, backgroundColor: '#eee', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' }}
          >
            {photos[0] ? (
              <Image source={{ uri: photos[0] }} style={{ width: '101%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
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
        {/* 작은 액션 다이얼로그 */}
        <Dialog
          visible={photoActionIndex !== null}
          onDismiss={() => setPhotoActionIndex(null)}
          width={260}
          panDirection={null}
        >
          <RNView style={{ backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, width: 260 }}>
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
        </Dialog>
      </Dialog>
      {/* 동적 폼 렌더링 */}
      {formTemplate.map(field => {
        if (field.type === 'input') {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <FormInput
                  label={field.label}
                  placeholder={field.placeholder}
                  value={value}
                  onChangeText={onChange}
                  error={error?.message}
                  multiline={field.multiline}
                  maxLength={field.maxLength}
                />
              )}
            />
          );
        }
        if (field.type === 'picker') {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormPicker
                  label={field.label}
                  options={field.optionsKey ? options[field.optionsKey] : []}
                  value={value}
                  onChange={onChange}
                  error={error?.message}
                  placeholder={field.placeholder}
                />
              )}
            />
          );
        }
        if (field.type === 'slider') {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormSlider
                  label={field.label}
                  value={typeof value === 'number' ? value : (field.min ?? 140)}
                  onChange={onChange}
                  min={field.min ?? 140}
                  max={field.max ?? 200}
                  error={error?.message}
                />
              )}
            />
          );
        }
        if (field.type === 'date') {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormDate
                  label={field.label}
                  value={value || { year: 2000, month: 1, day: 1 }}
                  onChange={onChange}
                  error={error?.message}
                />
              )}
            />
          );
        }
        if (field.type === 'region') {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormRegionModal
                  label={field.label}
                  value={value || { region: '', district: '' }}
                  onChange={onChange}
                  regionData={regionData}
                  error={error?.message}
                />
              )}
            />
          );
        }
        if (field.type === 'chips' && field.modal) {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <Text style={{ fontWeight: '700', color: '#222', fontSize: 16, marginBottom: 4 }}>{field.label}</Text>
                  <TouchableOpacity
                    onPress={() => setActiveChipsModalField(field.name)}
                    activeOpacity={0.8}
                    style={{ borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent', paddingHorizontal: 0, minHeight: 40, justifyContent: 'center', marginBottom: 12 }}
                  >
                    <Text style={{ color: value && value.length ? '#222' : '#aaa', fontSize: 16 }}>
                      {value && value.length ? value.join(', ') : field.placeholder}
                    </Text>
                  </TouchableOpacity>
                  <Modal visible={activeChipsModalField === field.name} transparent={false} animationType="slide">
                    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 0, paddingHorizontal: 8, justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={() => setActiveChipsModalField(null)} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                          <Feather name="x" size={26} color="#bbb" />
                        </TouchableOpacity>
                        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#222' }}>{field.label}</Text>
                        <View style={{ width: 40 }} />
                      </View>
                      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch', padding: 24 }}>
                        <Text style={{ fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 16 }}>{field.label}를 {field.minSelect}개 선택하세요</Text>
                        <FormChips
                          options={(options[field.optionsKey] ?? []) as string[]}
                          value={value || []}
                          onChange={onChange}
                          min={field.minSelect}
                          max={field.maxSelect}
                          error={error?.message}
                        />
                      </View>
                      <View style={{ padding: 24, paddingTop: 0 }}>
                        <TouchableOpacity
                          style={{ backgroundColor: value.length < (field.minSelect || 1) ? '#eee' : '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                          disabled={value.length < (field.minSelect || 1)}
                          onPress={() => setActiveChipsModalField(null)}
                        >
                          <Text style={{ color: value.length < (field.minSelect || 1) ? '#bbb' : '#fff', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
                        </TouchableOpacity>
                      </View>
                    </SafeAreaView>
                  </Modal>
                </>
              )}
            />
          );
        }
        if (field.type === 'chips' && !field.modal) {
          return (
            <Controller
              key={field.name}
              control={control}
              name={field.name}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FormChips
                  options={(options[field.optionsKey] ?? []) as string[]}
                  value={value || []}
                  onChange={onChange}
                  min={field.minSelect}
                  max={field.maxSelect}
                  error={error?.message}
                />
              )}
            />
          );
        }
        return null;
      })}
      <Button
        label="저장"
        marginT-16
        backgroundColor="#3B82F6"
        borderRadius={16}
        style={{ minWidth: 120, paddingVertical: 12 }}
        labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}
        onPress={handleSubmit(onSubmit)}
      />
      {/* Crop Preview UI */}
      {showPreview && previewUri && (
        <Dialog
          visible={showPreview}
          onDismiss={() => { setShowPreview(false); setPreviewUri(null); setPreviewTargetIdx(null); }}
          width={320}
          panDirection={null}
        >
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
                    // 선택한 인덱스(previewTargetIdx)에 저장
                    if (previewTargetIdx !== null && previewTargetIdx >= 0 && previewTargetIdx < newPhotos.length) {
                      newPhotos[previewTargetIdx] = manipResult.uri;
                    }
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
        </Dialog>
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