import React, { useState } from 'react';
import { ScrollView, StyleSheet, Modal, TouchableOpacity, Platform, Image, SafeAreaView, ToastAndroid, Alert, KeyboardAvoidingView } from 'react-native';
import { View, Button, Avatar, Dialog, Text } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';
import regionData from '../data/regions.json';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { saveProfile, getProfile } from '../services/userService';
import optionsRaw from '../data/options.json';
import { Options } from '../types/options';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import formTemplate from '../data/profileForm.json';
import FormInput from '../components/FormInput';
import FormPicker from '../components/FormPicker';
import FormRegionModal from '../components/FormRegionModal';
import FormSlider from '../components/FormSlider';
import FormDate from '../components/FormDate';
import FormChips from '../components/FormChips';
import { Feather } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { TOAST_MESSAGES, NAVIGATION_ROUTES } from '@/constants';
import * as FileSystem from 'expo-file-system';
import PageLayout from '../components/PageLayout';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { useProfile } from '../store/ProfileContext';


const options = optionsRaw as Options;

// @ts-ignore: expo-image-cropper 타입 선언 없음을 무시
declare module 'expo-image-cropper';


// yup 스키마 동적 생성
const schemaFields: any = {};
formTemplate.forEach(field => {
  const errorMsg = field.errorMessage || `${field.label}을(를) 입력해 주세요`;
  if (field.type === 'input') {
    schemaFields[field.name] = field.required
      ? yup.string().trim().min(1, errorMsg).required(errorMsg)
      : yup.string();
  }
  if (field.type === 'radio' || field.type === 'picker' || field.type === 'slider' || field.type === 'select') {
    schemaFields[field.name] = field.required
      ? yup.string().trim().min(1, errorMsg).required(errorMsg)
      : yup.string();
  }
  if (field.type === 'date') {
    schemaFields[field.name] = field.required
      ? yup.object({
          year: yup.number().min(1900),
          month: yup.number().min(1),
          day: yup.number().min(1)
        })
        .test('valid-date', errorMsg, v => !!v && typeof v.year === 'number' && v.year > 0 && typeof v.month === 'number' && v.month > 0 && typeof v.day === 'number' && v.day > 0)
        .required(errorMsg)
      : yup.object();
  }
  if (field.type === 'region') {
    schemaFields[field.name] = field.required
      ? yup.object({
          region: yup.string().trim(),
          district: yup.string()
        })
        .test('valid-region', errorMsg, v => !!v && !!v.region && v.region.trim().length > 0)
        .required(errorMsg)
      : yup.object();
  }
  if (field.type === 'chips') {
    let s = yup.array().of(yup.string());
    if (field.required) {
      const minCount = field.minSelect || 1;
      s = s.min(minCount, errorMsg);
    }
    if (field.maxSelect) s = s.max(field.maxSelect, `${field.label}은(는) 최대 ${field.maxSelect}개까지 선택 가능합니다`);
    schemaFields[field.name] = s;
  }
  if (field.type === 'checkbox') {
    let s = yup.array().of(yup.string());
    if (field.required) s = s.min(field.min || 1, `${field.label}을(를) ${field.min || 1}개 이상 선택해 주세요`);
    if (field.max) s = s.max(field.max, `${field.label}은(는) 최대 ${field.max}개까지 선택 가능합니다`);
    schemaFields[field.name] = s;
  }
});
const schema = yup.object().shape(schemaFields);

const BUTTON_HEIGHT = 64;

const ProfileEditScreen = () => {
  // 사진 관련 상태만 유지 (UI 전용)
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null]);
  const [photoActionIndex, setPhotoActionIndex] = useState<number|null>(null);
  const [previewUri, setPreviewUri] = useState<string|null>(null);
  const [previewTargetIdx, setPreviewTargetIdx] = useState<number|null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [activeChipsModalField, setActiveChipsModalField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation<any>();
  const { user, setUser } = useAuth();
  const route = useRoute<any>();
  const isEditMode = route?.params?.isEditMode ?? false;
  const { refreshProfile } = useProfile();
  
  const { control, handleSubmit, formState: { errors }, setValue, trigger, reset, watch } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: formTemplate.reduce((acc, cur) => {
      if (cur.type === 'chips' || cur.type === 'checkbox') acc[cur.name] = [];
      else if (cur.type === 'region') acc[cur.name] = { region: '', district: '' };
      else if (cur.type === 'date') acc[cur.name] = { year: 0, month: 0, day: 0 };
      else acc[cur.name] = '';
      return acc;
    }, {} as any),
  });

  // 폼 값 감시 (디버깅용) - 필요시에만 활성화
  // const formValues = watch();
  // console.log('ProfileEditScreen - 현재 폼 값:', formValues);

  // 기존 프로필 데이터 로딩 (수정 모드일 때)
  React.useEffect(() => {
    const loadProfile = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      if (isEditMode) {
        try {
          console.log('ProfileEditScreen - 프로필 데이터 로드 시작');
          const profile = await getProfile(user.userId);
          console.log('ProfileEditScreen - 프로필 데이터 로드 완료:', profile);
          
          if (profile) {
            // 폼에 기존 데이터 설정 - reset 사용
            const resetData: any = {};
            
            // profileForm.json의 필드들에 대해서만 데이터 설정
            formTemplate.forEach(field => {
              const key = field.name;
              let value = (profile as any)[key];
              
              // height 필드는 문자열을 숫자로 변환
              if (key === 'height' && typeof value === 'string') {
                value = parseInt(value, 10);
              }
              
              // interests, favoriteFoods는 공백 제거
              if ((key === 'interests' || key === 'favoriteFoods') && Array.isArray(value)) {
                value = value.map((item: string) => item.trim());
              }
              
              resetData[key] = value;
            });
            
            console.log('ProfileEditScreen - reset 데이터:', resetData);
            reset(resetData);
            
            // 사진 설정
            if (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
              const photoArray: (string | null)[] = [...profile.photos];
              while (photoArray.length < 5) photoArray.push(null);
              setPhotos(photoArray.slice(0, 5));
            } else {
              // photos가 없거나 undefined인 경우 기본 배열 설정
              setPhotos([null, null, null, null, null]);
            }
          }
        } catch (error) {
          console.error('ProfileEditScreen - 프로필 로드 실패:', error);
        }
      }
      
      setIsLoading(false);
    };

    loadProfile();
  }, [user?.userId, isEditMode]); // reset 제거

  // 사진 관련 핸들러들
  const cleanPhotos = (arr: (string|null)[]) => {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.filter((p): p is string => !!p && typeof p === 'string');
  };

  const handleCamera = async (idx: number|null) => {
    if (idx === null) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...(photos || [null, null, null, null, null])];
      newPhotos[idx] = result.assets[0].uri;
      setPhotos(newPhotos);
      setPhotoActionIndex(null);
    }
  };

  const handleGallery = async (idx: number|null) => {
    if (idx === null) return;
    setPhotoActionIndex(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...(photos || [null, null, null, null, null])];
      newPhotos[idx] = result.assets[0].uri;
      setPhotos(newPhotos);
      // setPreviewUri(result.assets[0].uri);
      // setPreviewTargetIdx(idx);
      // setShowPreview(true);
    }
  };

  const handleSetMain = (idx: number) => {
    const currentPhotos = photos || [null, null, null, null, null];
    console.log('handleSetMain 호출:', { idx, photos: currentPhotos });
    
    if (idx === 0) return;
    
    // 현재 유효한 사진들만 추출
    const validPhotos = currentPhotos.filter((p): p is string => !!p && typeof p === 'string');
    
    console.log('유효한 사진들:', { validPhotos, validLength: validPhotos.length });
    
    // idx가 유효한 범위인지 확인
    if (idx >= currentPhotos.length || !currentPhotos[idx]) {
      console.error('유효하지 않은 인덱스:', { idx, photosLength: currentPhotos.length });
      return;
    }
    
    // 선택된 사진
    const selectedPhoto = currentPhotos[idx];
    
    // 새로운 배열 구성: 선택된 사진을 맨 앞으로, 나머지는 순서대로
    const newPhotos: (string | null)[] = [selectedPhoto];
    
    // 나머지 사진들을 순서대로 추가 (선택된 사진 제외)
    for (let i = 0; i < currentPhotos.length; i++) {
      if (i !== idx && currentPhotos[i]) {
        newPhotos.push(currentPhotos[i]);
      }
    }
    
    // 5개 배열로 확장 (null로 채움)
    while (newPhotos.length < 5) {
      newPhotos.push(null);
    }
    
    console.log('대표 이미지 설정 완료:', {
      originalPhotos: currentPhotos,
      selectedPhoto,
      newPhotos,
      newPhotosLength: newPhotos.length
    });
    
    setPhotos(newPhotos);
    setPhotoActionIndex(null);
  };

  const handleDelete = (idx: number) => {
    const currentPhotos = photos || [null, null, null, null, null];
    const newPhotos = [...currentPhotos];
    newPhotos[idx] = null;
    setPhotos(newPhotos);
    setPhotoActionIndex(null);
  };

  const handleSaveCrop = async () => {
    if (!previewUri || previewTargetIdx === null) return;
    try {
      Image.getSize(previewUri, async (width, height) => {
        const size = Math.min(width, height);
        const cropRegion = {
          originX: Math.floor((width - size) / 2),
          originY: Math.floor((height - size) / 2),
          width: size,
          height: size,
        };
        const manipResult = await ImageManipulator.manipulateAsync(
          previewUri,
          [{ crop: cropRegion }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        const currentPhotos = photos || [null, null, null, null, null];
        const newPhotos = [...currentPhotos];
        if (previewTargetIdx >= 0 && previewTargetIdx < newPhotos.length) {
          newPhotos[previewTargetIdx] = manipResult.uri;
        }
        setPhotos(newPhotos);
        setShowPreview(false);
        setPreviewUri(null);
        setPreviewTargetIdx(null);
        setPhotoActionIndex(null);
      });
    } catch (error) {
      Alert.alert('이미지 처리 실패', '이미지를 처리하는 중 오류가 발생했습니다.');
    }
  };

  const onSubmit = async (data: any) => {
    console.log('🔍 onSubmit 호출됨 - 폼 데이터:', data);
    console.log('🔍 favoriteFoods 값:', data.favoriteFoods);
    console.log('🔍 favoriteFoods 타입:', typeof data.favoriteFoods);
    console.log('🔍 favoriteFoods 길이:', Array.isArray(data.favoriteFoods) ? data.favoriteFoods.length : '배열 아님');
    
    // 좋아하는 음식 필수 검증
    if (!data.favoriteFoods || !Array.isArray(data.favoriteFoods) || data.favoriteFoods.length < 1) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('좋아하는 음식을 1개 이상 선택해 주세요', ToastAndroid.SHORT);
      } else {
        Alert.alert('알림', '좋아하는 음식을 1개 이상 선택해 주세요');
      }
      return;
    }
    
    if (!user?.userId) {
      Alert.alert('오류', '로그인 정보가 올바르지 않습니다. 다시 로그인 해주세요.');
      return;
    }
    
    // photos 배열이 undefined인 경우 안전하게 처리
    const currentPhotos = photos || [null, null, null, null, null];
    
    console.log('프로필 저장 시작 - 현재 photos 상태:', {
      photosLength: currentPhotos.length,
      validPhotosCount: currentPhotos.filter(p => !!p).length
    });
    
    // 최소 1장(대표)만 체크, 저장은 5개 배열 그대로
    if (!currentPhotos[0]) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.PROFILE_PHOTO_REQUIRED, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.PROFILE_PHOTO_REQUIRED);
      }
      return;
    }
    const profile = {
      id: user.userId,
      userId: user.userId,
      ...data,
      photos: currentPhotos, // null 포함 5개 배열 그대로 저장
    };
    
    console.log('프로필 저장 - 최종 프로필 데이터:', {
      userId: profile.userId,
      photosLength: profile.photos.length
    });
    
    try {
      const success = await saveProfile(profile);
      if (success) {
        // 백엔드에서 조회한 프로필 대신 현재 UI 상태를 우선적으로 사용
        const currentPhotos = cleanPhotos(photos || [null, null, null, null, null]);
        console.log('현재 UI의 photos 상태:', {
          currentPhotosLength: currentPhotos.length
        });
        
        setUser({
          ...user,
          hasProfile: true,
          photos: currentPhotos // 백엔드에서 조회한 photos 대신 현재 UI 상태 사용
        });
        refreshProfile(); // 프로필 저장 후 최신 프로필 강제 새로고침
      }
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.PROFILE_SAVED, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.PROFILE_SAVED);
      }
      if (!user.hasProfile && !isEditMode) {
        logger.navigation.navigate('ProfileEditScreen', NAVIGATION_ROUTES.PREFERENCE_EDIT);
        navigation.navigate(NAVIGATION_ROUTES.PREFERENCE_EDIT, { isEditMode: false });
      } else {
        if (route?.params?.fromMenu) {
          logger.navigation.navigate('ProfileEditScreen', NAVIGATION_ROUTES.MAIN);
          navigation.navigate(NAVIGATION_ROUTES.MAIN, { screen: 'Menu' });
        } else {
          logger.navigation.navigate('ProfileSetupScreen', NAVIGATION_ROUTES.MAIN);
          navigation.navigate(NAVIGATION_ROUTES.MAIN, { screen: NAVIGATION_ROUTES.MAIN });
        }
      }
    } catch (e) {
      logger.error('프로필 저장 실패', { error: (e as Error).message });
      alert(TOAST_MESSAGES.PROFILE_SAVE_FAILED + (e as Error).message);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <Text>프로필 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <PageLayout title={isEditMode ? "프로필 수정" : "프로필 등록"}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: BUTTON_HEIGHT + 32 }}
            keyboardShouldPersistTaps="handled"
          >
        {/* 대표 이미지 */}
        <View style={styles.profileImageWrap}>
          <TouchableOpacity
            onPress={() => setShowPhotoPopup(true)}
            activeOpacity={0.8}
            style={styles.profileImageTouchable}
          >
            {photos && photos[0] ? (
              <Image source={{ uri: photos[0] }} style={styles.profileImage} resizeMode="cover" />
            ) : (
              <Avatar
                size={64}
                label="?"
                backgroundColor="#e5e6fa"
                labelColor="#bbb"
                containerStyle={styles.avatar}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* 사진 관리 다이얼로그 */}
        <Dialog
          visible={showPhotoPopup}
          onDismiss={() => setShowPhotoPopup(false)}
          containerStyle={styles.photoPopupDialog}
          width={340}
          panDirection={null}
        >
          <View style={styles.photoPopupWrap}>
            <Text style={styles.photoPopupTitle}>사진 관리</Text>
            
            {/* 대표 이미지 */}
            <TouchableOpacity
              onPress={() => setPhotoActionIndex(0)}
              activeOpacity={0.8}
              style={styles.photoMainTouchable}
            >
              {photos && photos[0] ? (
                <Image source={{ uri: photos[0] }} style={styles.photoMainImage} resizeMode="cover" />
              ) : (
                <Avatar
                  size={48}
                  label="?"
                  backgroundColor="#e5e6fa"
                  labelColor="#bbb"
                  containerStyle={styles.avatar}
                />
              )}
              <View style={styles.photoMainLabel}>
                <Text style={styles.photoMainLabelText}>대표</Text>
              </View>
            </TouchableOpacity>
            
            {/* 나머지 이미지들 */}
            <View style={styles.photoThumbRow}>
              {[1,2,3,4].map(i => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setPhotoActionIndex(i)}
                  activeOpacity={0.8}
                  style={styles.photoThumbTouchable}
                >
                  {photos && photos[i] ? (
                    <Image source={{ uri: photos[i] }} style={styles.photoThumbImage} resizeMode="cover" />
                  ) : (
                    <Avatar
                      size={28}
                      label="?"
                      backgroundColor="#e5e6fa"
                      labelColor="#bbb"
                      containerStyle={styles.avatar}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Button label="닫기" onPress={() => setShowPhotoPopup(false)} style={styles.closeButton} />
          </View>
          
          {/* 사진 액션 다이얼로그 */}
          <Dialog
            visible={photoActionIndex !== null}
            onDismiss={() => setPhotoActionIndex(null)}
            width={260}
            panDirection={null}
          >
            <View style={styles.photoActionDialog}>
              <View style={styles.photoActionList}>
                <TouchableOpacity style={styles.photoActionTouchable} onPress={() => handleCamera(photoActionIndex)}>
                  <Text style={styles.photoActionText}>카메라</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionTouchable} onPress={() => handleGallery(photoActionIndex)}>
                  <Text style={styles.photoActionText}>갤러리</Text>
                </TouchableOpacity>
                {photoActionIndex !== 0 && photos && photos[photoActionIndex ?? 0] && (
                  <TouchableOpacity style={styles.photoActionTouchable} onPress={() => handleSetMain(photoActionIndex!)}>
                    <Text style={styles.photoActionText}>대표 이미지 설정</Text>
                  </TouchableOpacity>
                )}
                {photos && photos[photoActionIndex ?? 0] && (
                  <TouchableOpacity style={styles.photoActionTouchable} onPress={() => handleDelete(photoActionIndex!)}>
                    <Text style={styles.photoActionText}>사진 삭제</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.photoActionTouchable} onPress={() => setPhotoActionIndex(null)}>
                  <Text style={styles.photoActionTextClose}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
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
                    options={field.optionsKey ? (options[field.optionsKey] as string[] ?? []) : []}
                    value={value}
                    onChange={onChange}
                    error={error?.message}
                    placeholder={field.placeholder}
                    formType="profile"
                    optionsKey={field.optionsKey}
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
                    placeholder={field.placeholder}
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
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <FormDate
                    label={field.label}
                    value={value || { year: 2000, month: 1, day: 1 }}
                    onChange={val => { onChange(val); onBlur(); }}
                    error={error?.message}
                    placeholder={field.placeholder}
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
          if (field.type === 'chips') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <>
                    <View style={styles.labelRow}>
                      <Text style={{ fontWeight: '700', color: '#222', fontSize: 16 }}>{field.label}</Text>
                      {error?.message && <Text style={{ color: 'red', marginLeft: 8, fontSize: 13 }}>{error.message}</Text>}
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveChipsModalField(field.name)}
                      activeOpacity={0.8}
                      style={{ borderWidth: 0, borderRadius: 0, backgroundColor: 'transparent', paddingHorizontal: 0, minHeight: 40, justifyContent: 'center', marginBottom: 12 }}
                    >
                      <Text style={value && Array.isArray(value) && value.length ? styles.chipsValueText : styles.chipsPlaceholderText}>
                        {value && Array.isArray(value) && value.length ? value.join(', ') : field.placeholder}
                      </Text>
                    </TouchableOpacity>
                    <Modal visible={activeChipsModalField === field.name} transparent={false} animationType="slide">
                      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, borderBottomWidth: 0, paddingHorizontal: 8, justifyContent: 'center', position: 'relative' }}>
                          <TouchableOpacity onPress={async () => { setActiveChipsModalField(null); await trigger(field.name); }} style={{ position: 'absolute', right: 8, top: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                            <Feather name="x" size={26} color="#bbb" />
                          </TouchableOpacity>
                          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#222' }}>{field.label}</Text>
                          <View style={{ width: 40 }} />
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'stretch', padding: 24 }}>
                          <Text style={{ fontSize: 16, color: '#222', textAlign: 'center', marginBottom: 16 }}>{field.label}을 {field.minSelect}개 선택하세요</Text>
                          <FormChips
                            label={field.label}
                            options={field.optionsKey ? (options[field.optionsKey] as string[] ?? []) : []}
                            value={value || []}
                            onChange={onChange}
                            min={field.minSelect}
                            max={field.maxSelect}
                            error={undefined}
                          />
                        </View>
                        <View style={{ padding: 24, paddingTop: 0 }}>
                          <TouchableOpacity
                            style={{ backgroundColor: (value && Array.isArray(value) && value.length < (field.minSelect || 1)) ? '#eee' : '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                            disabled={value && Array.isArray(value) && value.length < (field.minSelect || 1)}
                            onPress={async () => {
                              // 최소 선택 개수 확인
                              if (!value || !Array.isArray(value) || value.length < (field.minSelect || 1)) {
                                if (Platform.OS === 'android') {
                                  ToastAndroid.show(field.errorMessage || `${field.label}을(를) ${field.minSelect || 1}개 이상 선택해 주세요`, ToastAndroid.SHORT);
                                } else {
                                  Alert.alert('알림', field.errorMessage || `${field.label}을(를) ${field.minSelect || 1}개 이상 선택해 주세요`);
                                }
                                return;
                              }
                              
                              setValue(field.name, value);
                              setActiveChipsModalField(null);
                              await trigger(field.name);
                            }}
                          >
                            <Text style={{ color: (value && Array.isArray(value) && value.length < (field.minSelect || 1)) ? '#bbb' : '#fff', fontWeight: 'bold', fontSize: 16 }}>확인</Text>
                          </TouchableOpacity>
                        </View>
                      </SafeAreaView>
                    </Modal>
                  </>
                )}
              />
            );
          }
          return null;
        })}
      </ScrollView>
      </View>

      {/* 이미지 크롭 미리보기 */}
      {showPreview && previewUri && (
        <Dialog
          visible={showPreview}
          onDismiss={() => { setShowPreview(false); setPreviewUri(null); setPreviewTargetIdx(null); }}
          width={320}
          panDirection={null}
        >
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: 'center' }}>
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
                onPress={handleSaveCrop}
                style={{ minWidth: 80 }}
              />
            </View>
          </View>
        </Dialog>
      )}
        </PageLayout>
        
        {/* 저장 버튼 - PageLayout 바깥에 고정 */}
        <View style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          alignItems: 'center',
          zIndex: 100,
          backgroundColor: colors.background,
          paddingBottom: 16,
          width: '100%',
        }}>
          <TouchableOpacity style={{
            width: '90%',
            backgroundColor: colors.primary,
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
          }} onPress={handleSubmit(
            (data) => onSubmit(data),
            (formErrors) => {
              if (Object.keys(formErrors).length > 0) {
                if (Platform.OS === 'android') {
                  ToastAndroid.show('프로필 작성을 해주세요', ToastAndroid.SHORT);
                } else {
                  Alert.alert('알림', '프로필 작성을 해주세요');
                }
              }
            }
          )}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>저장</Text>
          </TouchableOpacity>
        </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 100,
  },
  profileImageWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageTouchable: {
    width: 160,
    height: 160,
    backgroundColor: '#eee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatar: {
    alignSelf: 'center',
  },
  photoPopupDialog: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPopupWrap: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: 24,
    width: 340,
    alignItems: 'center',
  },
  photoPopupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  photoMainTouchable: {
    width: 120,
    height: 120,
    backgroundColor: '#eee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  photoMainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoMainLabel: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#6C6FC5',
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoMainLabelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  photoThumbRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoThumbTouchable: {
    width: 56,
    height: 56,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoThumbAvatar: {
    alignSelf: 'center',
  },
  closeButton: {
    marginTop: 8,
  },
  photoActionDialog: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    paddingVertical: 12,
    width: 260,
  },
  photoActionList: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  photoActionTouchable: {
    paddingVertical: 14,
    width: '100%',
  },
  photoActionText: {
    fontSize: 16,
    color: '#222',
  },
  photoActionTextClose: {
    fontSize: 16,
    color: '#888',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 18,
  },
  chipsValueText: {
    color: '#222',
    fontSize: 16,
  },
  chipsPlaceholderText: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default ProfileEditScreen; 