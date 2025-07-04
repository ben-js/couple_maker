import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList, UserPreferences } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import FormPicker from '../components/FormPicker';
import FormChips from '../components/FormChips';
import { FormRangeSlider } from '../components/FormRangeSlider';
import { colors } from '../constants/colors';
import { useAuth } from '../store/AuthContext';
import regionData from '../data/regions.json';

// Form 템플릿과 옵션 데이터 import
import preferenceFormTemplate from '../data/preferenceForm.json';
import optionsData from '../data/options.json';
import FormModalSelector from '../components/FormModalSelector';

type PreferenceSetupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PreferenceSetupScreen'
>;

interface FormField {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  optionsKey?: string;
  min?: number;
  max?: number;
  step?: number;
  minSelect?: number;
  maxSelect?: number;
  required?: boolean;
  modal?: boolean;
  errorMessage?: string;
}

const PreferenceSetupScreen: React.FC = () => {
  const navigation = useNavigation<PreferenceSetupScreenNavigationProp>();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<Partial<UserPreferences>>({
    user_id: user?.id || '',
    preferred_gender: '',
    age_range: { min: 20, max: 30 },
    height_range: { min: 150, max: 170 },
    locations: [],
    job_types: [],
    education_levels: [],
    body_types: [],
    mbti_types: [],
    hobbies: [],
    personality_tags: [],
    values_in_life: [],
    dating_style: [],
    marriage_plan: '',
    children_desire: '',
    smoking: false,
    drinking: '',
    religion: '',
    preferred_meetup_types: [],
    priority_fields: [],
    priority_order: [],
    regions: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const oppositeGender = user.gender === 'male' ? 'female' : 'male';
      // 프로필 주소를 regions에 기본값으로 세팅
      let defaultRegions = [];
      if (user.location?.city) {
        defaultRegions.push({ region: user.location.city, district: user.location.district || '' });
      }
      setFormData(prev => ({
        ...prev,
        user_id: user.id,
        preferred_gender: oppositeGender,
        regions: defaultRegions
      }));
    }
  }, [user]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // 에러 제거
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    preferenceFormTemplate.forEach((field: FormField) => {
      if (field.required) {
        const value = formData[field.name as keyof UserPreferences];
        
        if (!value || 
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && value !== null && Object.keys(value).length === 0)) {
          newErrors[field.name] = field.errorMessage || `${field.label}을(를) 입력해 주세요`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: API 호출로 변경
      // const response = await userPreferencesService.savePreferences(formData);
      
      // 임시로 AsyncStorage에 저장
      await AsyncStorage.setItem('userPreferences', JSON.stringify(formData));
      
      Alert.alert(
        '설정 완료',
        '이상형 설정이 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error) {
      console.error('Preferences save error:', error);
      Alert.alert('오류', '설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name as keyof UserPreferences];
    const error = errors[field.name];

    switch (field.type) {
      case 'picker':
        return (
          <FormPicker
            key={field.name}
            label={field.label}
            placeholder={field.placeholder}
            options={optionsData[field.optionsKey as keyof typeof optionsData] || []}
            value={value as string}
            onChange={(val: string) => handleFieldChange(field.name, val)}
            error={error}
          />
        );

      case 'range_slider':
        const rangeValue = value as { min: number; max: number } || { min: field.min || 0, max: field.max || 100 };
        return (
          <FormRangeSlider
            key={field.name}
            label={field.label}
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            value={[rangeValue.min, rangeValue.max]}
            onValueChange={(val: [number, number]) => handleFieldChange(field.name, { min: val[0], max: val[1] })}
            error={error}
            required={field.required}
          />
        );

      case 'chips':
        return (
          <FormChips
            key={field.name}
            label={field.label}
            options={optionsData[field.optionsKey as keyof typeof optionsData] || []}
            value={value as string[] || []}
            onChange={(val: string[]) => handleFieldChange(field.name, val)}
            min={field.minSelect}
            max={field.maxSelect}
            error={error}
          />
        );

      case 'modal':
        return (
          <FormModalSelector
            key={field.name}
            label={field.label}
            value={value as string[] || []}
            options={optionsData[field.optionsKey as keyof typeof optionsData] || []}
            onChange={(val) => handleFieldChange(field.name, val)}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            원하는 상대방의 조건을 설정해 주세요
          </Text>
        </View>

        <View style={styles.formContainer}>
          {preferenceFormTemplate.map((field: FormField) => renderField(field))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={isLoading ? '저장 중...' : '설정 완료'}
          onPress={handleSubmit}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  formContainer: {
    padding: 20,
    paddingTop: 10,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PreferenceSetupScreen; 