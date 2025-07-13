import React, { useState } from 'react';
import { ScrollView, StyleSheet, Modal, TouchableOpacity, Platform, Image, SafeAreaView, ToastAndroid, Alert, KeyboardAvoidingView } from 'react-native';
import { View, Button, Avatar, Dialog, Text } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';
import regionData from '../data/regions.json';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { saveProfile, getUserProfile } from '../services/userService';
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
  
  const { control, handleSubmit, formState: { errors }, setValue, trigger, reset } = useForm({
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

  // 기존 프로필 데이터 로딩 (수정 모드일 때)
  React.useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.userId || !isEditMode) {
        setIsLoading(false);
        return;
      }

      
      try {
        console.log('프로필 로딩 시작:', { userId: user.userId, isEditMode });
        const existingProfile = await getUserProfile(user.userId);
        console.log('API 응답:', existingProfile);
        
        if (existingProfile) {
          // 백엔드에서 이미 camelCase로 변환된 데이터를 그대로 사용
          console.log('프로필 데이터 (변환 없음):', existingProfile);
          
          // 폼에 기존 데이터 설정
          Object.keys(existingProfile).forEach(key => {
            if (key !== 'id' && key !== 'photos') {
              let value = (existingProfile as any)[key];
              
              // height 필드는 문자열을 숫자로 변환
              if (key === 'height' && typeof value === 'string') {
                value = parseInt(value, 10);
                console.log(`height 문자열을 숫자로 변환: ${(existingProfile as any)[key]} → ${value}`);
              }
              
              console.log(`폼 필드 설정: ${key} =`, value);
              setValue(key, value);
            }
          });
          
          // 사진 설정
          if (existingProfile.photos && existingProfile.photos.length > 0) {
            const photoArray: (string | null)[] = [...existingProfile.photos];
            while (photoArray.length < 5) photoArray.push(null);
            setPhotos(photoArray.slice(0, 5));
          }
          
          logger.info('기존 프로필 로드 성공', { userId: user.userId, profileData: existingProfile });
        } else {
          console.log('프로필 데이터가 없음');
        }
      } catch (error) {
        console.error('프로필 로드 에러:', error);
        logger.error('기존 프로필 로드 실패', { error, userId: user.userId });
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingProfile();
  }, [user?.userId, isEditMode, setValue]);

  // 사진 관련 핸들러들
  const handleCamera = async (idx: number|null) => {
    if (idx === null) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhotos = [...photos];
      newPhotos[idx] = result.assets[0].uri;
      setPhotos(newPhotos);
      setPhotoActionIndex(null);
    }
  };

  const handleGallery = async (idx: number|null) => {
    if (idx === null) return;
    setPhotoActionIndex(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPreviewUri(result.assets[0].uri);
      setPreviewTargetIdx(idx);
      setShowPreview(true);
    }
  };

  const handleSetMain = (idx: number) => {
    if (idx === 0) return;
    const newPhotos = [...photos];
    const [main] = newPhotos.splice(idx, 1);
    newPhotos.unshift(main);
    while (newPhotos.length < 5) newPhotos.push(null);
    setPhotos(newPhotos.slice(0, 5));
    setPhotoActionIndex(null);
  };

  const handleDelete = (idx: number) => {
    const newPhotos = [...photos];
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

        // 로컬에서만 이미지 URI 저장 (백엔드 업로드는 프로필 저장 시 수행)
        const newPhotos = [...photos];
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
      console.error('이미지 크롭 에러:', error);
      Alert.alert('이미지 처리 실패', '이미지를 처리하는 중 오류가 발생했습니다.');
    }
  };

  const onSubmit = async (data: any) => {
    if (!user?.userId) {
      Alert.alert('오류', '로그인 정보가 올바르지 않습니다. 다시 로그인 해주세요.');
      return;
    }
    
    const filteredPhotos = photos.filter(p => !!p);
    if (filteredPhotos.length < 1) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.PROFILE_PHOTO_REQUIRED, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.PROFILE_PHOTO_REQUIRED);
      }
      return;
    }
    
    const profile = {
      id: user.userId,
      ...data,
      photos: filteredPhotos,
    };
    
    try {
      const success = await saveProfile(profile);
      
      if (success) {
        // 프로필 저장 성공 시 최신 프로필 fetch 후 setUser로 갱신
        const latestProfile = await getUserProfile(user.userId);
        if (latestProfile) {
          setUser(latestProfile);
        }
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
        // 메뉴에서 온 경우 메뉴로 돌아가기
        if (route?.params?.fromMenu) {
          logger.navigation.navigate('ProfileEditScreen', NAVIGATION_ROUTES.MENU);
          navigation.navigate(NAVIGATION_ROUTES.MENU);
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
    <View style={{ flex: 1, position: 'relative' }}>
      <PageLayout title={isEditMode ? "프로필 수정" : "프로필 등록"}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: BUTTON_HEIGHT + 32 }}
          >
        {/* 대표 이미지 */}
        <View style={styles.profileImageWrap}>
          <TouchableOpacity
            onPress={() => setShowPhotoPopup(true)}
            activeOpacity={0.8}
            style={styles.profileImageTouchable}
          >
            {photos[0] ? (
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
              {photos[0] ? (
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
                  {photos[i] ? (
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
                {photoActionIndex !== 0 && photos[photoActionIndex ?? 0] && (
                  <TouchableOpacity style={styles.photoActionTouchable} onPress={() => handleSetMain(photoActionIndex!)}>
                    <Text style={styles.photoActionText}>대표 이미지 설정</Text>
                  </TouchableOpacity>
                )}
                {photos[photoActionIndex ?? 0] && (
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
                      <Text style={value && value.length ? styles.chipsValueText : styles.chipsPlaceholderText}>
                        {value && value.length ? value.join(', ') : field.placeholder}
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
                            style={{ backgroundColor: value.length < (field.minSelect || 1) ? '#eee' : '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                            disabled={value.length < (field.minSelect || 1)}
                            onPress={async () => {
                              setValue(field.name, value);
                              setActiveChipsModalField(null);
                              await trigger(field.name);
                            }}
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
          paddingBottom: 24,
          backgroundColor: colors.background,
          width: '100%',
        }}>
          <TouchableOpacity style={{
            width: '90%',
            backgroundColor: colors.primary,
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: 'center',
            height: BUTTON_HEIGHT,
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
    </View>
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