import React, { useState, useEffect } from 'react';
import { ScrollView, Platform, Alert, ToastAndroid, TouchableOpacity, Modal, SafeAreaView, StyleSheet } from 'react-native';
import { View, Button, Text } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import preferenceForm from '../data/preferenceForm.json';
import optionsRaw from '../data/options.json';
import regionData from '../data/regions.json';
import FormPicker from '../components/FormPicker';
import FormChips from '../components/FormChips';
import { FormRangeSlider } from '../components/FormRangeSlider';
import FormRegionModal from '../components/FormRegionModal';
import { Feather } from '@expo/vector-icons';
import { getUserPreferences, saveUserPreferences } from '../services/userPreferencesService';
import { useAuth } from '../store/AuthContext';
import { UserPreferences } from '../types';
import { logger } from '@/utils/logger';
import { TOAST_MESSAGES, NAVIGATION_ROUTES } from '@/constants';
import { apiPost } from '@/utils/apiUtils';

const options = optionsRaw as Record<string, any>;

// yup 스키마 동적 생성
const schemaFields: any = {};
preferenceForm.forEach(field => {
  const errorMsg = field.errorMessage || `${field.label}을(를) 입력해 주세요`;
  if (field.type === 'picker') {
    schemaFields[field.name] = field.required
      ? yup.string().trim().min(1, errorMsg).required(errorMsg)
      : yup.string();
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
  if (field.type === 'range_slider') {
    schemaFields[field.name] = field.required
      ? yup.object({ min: yup.number(), max: yup.number() }).required(errorMsg)
      : yup.object();
  }
  if (field.type === 'region_choice') {
    schemaFields[field.name] = field.required
      ? yup.array().of(yup.object({ region: yup.string(), district: yup.string() })).min(1, errorMsg).required(errorMsg)
      : yup.array();
  }
  if (field.type === 'slider') {
    schemaFields[field.name] = field.required
      ? yup.number().min(field.min ?? 140, errorMsg).required(errorMsg)
      : yup.number();
  }
});
const schema = yup.object().shape(schemaFields);

const PreferenceSetupScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isEditMode = route?.params?.isEditMode ?? false;
  const mode = route?.params?.mode ?? 'edit';
  const { user, updateUser } = useAuth();
  const [activeChipsModalField, setActiveChipsModalField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid }, setValue, trigger } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: preferenceForm.reduce((acc, cur) => {
      if (cur.type === 'chips' || cur.type === 'region_choice') acc[cur.name] = [];
      else if (cur.type === 'range_slider') acc[cur.name] = { min: cur.min, max: cur.max };
      else if (cur.type === 'slider') acc[cur.name] = cur.min ?? 140;
      else acc[cur.name] = '';
      return acc;
    }, {} as any),
  });

  // 기존 이상형 데이터 로딩
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.userId || !isEditMode) return;
      try {
        const preferences = await getUserPreferences(user.userId);
        if (preferences) {
          // 모든 필드에 대해 폼에 값 세팅 (매핑 적용)
          preferenceForm.forEach(field => {
            const key = field.name as keyof UserPreferences;
            let value = preferences[key];
            // range_slider 변환: [min, max] → {min, max}
            if (
              field.type === 'range_slider' &&
              Array.isArray(value) &&
              value.length === 2 &&
              typeof value[0] === 'number' &&
              typeof value[1] === 'number'
            ) {
              value = { min: value[0], max: value[1] };
            }
            // region_choice 변환
            if (field.type === 'region_choice' && Array.isArray(value) && typeof value[0] === 'string') {
              value = (value as string[]).map(regionName => ({ region: regionName, district: regionName }));
            }
            setValue(field.name, value);
          });
        }
      } catch (error) {
        console.error('이상형 데이터 로드 실패:', error);
      }
    };
    loadPreferences();
  }, [user?.userId, isEditMode, setValue]);

  const onSubmit = async (data: any) => {
    if (!user) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('사용자 정보를 찾을 수 없습니다.', ToastAndroid.SHORT);
      } else {
        Alert.alert('사용자 정보를 찾을 수 없습니다.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // 데이터를 UserPreferences 형식으로 변환 (카멜케이스)
      const preferences: UserPreferences = {
        userId: user.userId,
        preferredGender: data.preferredGender || '',
                  ageRange: data.ageRange || { min: 20, max: 50 },
                  heightRange: data.heightRange || { min: 140, max: 190 },
        regions: data.regions || [],
        locations: data.regions?.map((r: any) => r.district === r.region ? r.region : r.district) || [],
                  jobTypes: data.jobTypes || [],
                  educationLevels: data.educationLevels || [],
                  bodyTypes: data.bodyTypes || [],
                  mbtiTypes: data.mbtiTypes || [],
        hobbies: data.hobbies || [],
                  personalityTags: data.personalityTags || [],
                  valuesInLife: data.valuesInLife || [],
                  datingStyle: data.datingStyle || [],
                  marriagePlan: data.marriagePlan || '',
                  childrenDesire: data.childrenDesire || '',
        smoking: data.smoking || '상관없음',
        drinking: data.drinking || '',
        religion: data.religion || '',
                  preferredMeetupTypes: data.preferredMeetupTypes || [],
          priorityFields: data.priorityFields || [],
          priorityOrder: data.priorityOrder || [],
      };

      logger.info('프론트엔드 이상형 저장 시작', { userId: user.userId, timestamp: new Date().toISOString() });
      logger.debug('폼 데이터', data);
      logger.debug('변환된 preferences', preferences);

      // 백엔드에 저장
      logger.api.request('POST', '/user-preferences', preferences);
      await saveUserPreferences(preferences);
      logger.api.response('POST', '/user-preferences', { success: true });

      // 사용자 상태 업데이트 (hasPreferences를 true로)
      logger.info('사용자 상태 업데이트 시작');
      await updateUser({ hasPreferences: true });
      logger.success('사용자 상태 업데이트 완료');

      // 성공 메시지 표시
      logger.info('성공 메시지 표시');
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.PREFERENCES_SAVED, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.PREFERENCES_SAVED);
      }

      // 홈으로 이동
      logger.navigation.navigate('PreferenceSetupScreen', NAVIGATION_ROUTES.MAIN);
      navigation.navigate(NAVIGATION_ROUTES.MAIN);
      logger.success('프론트엔드 이상형 저장 완료');
    } catch (error) {
      logger.error('이상형 저장 실패', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show(TOAST_MESSAGES.PREFERENCES_SAVE_FAILED, ToastAndroid.SHORT);
      } else {
        Alert.alert(TOAST_MESSAGES.PREFERENCES_SAVE_FAILED);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show('이상형을 모두 작성해주세요.', ToastAndroid.SHORT);
    } else {
      Alert.alert('이상형을 모두 작성해주세요.');
    }
  };

  // 소개팅 신청하기 핸들러
  const handleMatchingRequest = async () => {
    if (!user) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('사용자 정보를 찾을 수 없습니다.', ToastAndroid.SHORT);
      } else {
        Alert.alert('사용자 정보를 찾을 수 없습니다.');
      }
      return;
    }
    if (!user.points || user.points <= 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('포인트가 부족합니다. 충전하기로 이동합니다.', ToastAndroid.SHORT);
      } else {
        Alert.alert('포인트가 부족합니다. 충전하기로 이동합니다.');
      }
      navigation.navigate(NAVIGATION_ROUTES.POINT_CHARGE);
      return;
    }
    setIsSubmitting(true);
    try {
      // 이상형 정보 저장
      await handleSubmit(onSubmit, onInvalid)();
      // 소개팅 신청 API 호출
      await apiPost('/matching-request', { userId: user.userId });
      if (Platform.OS === 'android') {
        ToastAndroid.show('소개팅 신청이 완료되었습니다!', ToastAndroid.SHORT);
      } else {
        Alert.alert('소개팅 신청이 완료되었습니다!');
      }
      navigation.navigate(NAVIGATION_ROUTES.MAIN);
    } catch (error) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('소개팅 신청에 실패했습니다.', ToastAndroid.SHORT);
      } else {
        Alert.alert('소개팅 신청에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1, padding: 24 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {preferenceForm.map(field => {
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
          if (field.type === 'chips') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ ...typography.h3, color: colors.text.primary }}>{field.label}</Text>
                      {error?.message && <Text style={{ color: colors.error, marginLeft: 8, fontSize: 13 }}>{error.message}</Text>}
                    </View>
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
                          <View style={{ width: 40 }} />
                          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#222' }}>{field.label}</Text>
                          <TouchableOpacity onPress={async () => { setActiveChipsModalField(null); await trigger(field.name); }} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                            <Feather name="x" size={26} color="#bbb" />
                          </TouchableOpacity>
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
          if (field.type === 'range_slider') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormRangeSlider
                    label={field.label}
                    min={Number(field.min)}
                    max={Number(field.max)}
                    step={field.step}
                    value={[value?.min ?? Number(field.min), value?.max ?? Number(field.max)]}
                    onValueChange={([min, max]) => onChange({ min, max })}
                    error={error?.message}
                  />
                )}
              />
            );
          }
          if (field.type === 'region_choice') {
            return (
              <Controller
                key={field.name}
                control={control}
                name={field.name}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <FormRegionModal
                    label={field.label}
                    value={value || []}
                    onChange={onChange}
                    regionData={regionData}
                    error={error?.message}
                    placeholder={field.placeholder}
                  />
                )}
              />
            );
          }
          return null;
        })}
      </ScrollView>
      {mode === 'apply' ? (
        <View style={styles.footerButtonWrap}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleMatchingRequest}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? '저장 중...' : '소개팅 신청하기'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footerButtonWrap}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSubmit(onSubmit, onInvalid)}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footerButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#bbb',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default PreferenceSetupScreen; 