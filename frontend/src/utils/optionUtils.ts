import optionsRaw from '../data/options.json';

const options = optionsRaw as Record<string, any>;

export type FormType = 'profile' | 'preference';

/**
 * 폼 타입에 따라 적절한 옵션을 반환하는 유틸리티 함수
 * @param optionsKey - 옵션 키
 * @param formType - 폼 타입 ('profile' | 'preference')
 * @returns 필터링된 옵션 배열
 */
export function getOptionsByFormType(optionsKey: string, formType: FormType): any[] {
  const baseOptions = options[optionsKey] || [];
  
  // 이상형 폼에서만 "상관없음" 옵션을 포함하는 필드들
  const fieldsWithAnyOption = [
    'smoking',
    'drinking', 
    'religions',
    'childrenDesire'
  ];
  
  // 프로필 폼이고 "상관없음" 옵션이 포함된 필드인 경우
  if (formType === 'profile' && fieldsWithAnyOption.includes(optionsKey)) {
    return baseOptions.filter((option: string) => option !== '상관없음');
  }
  
  // 이상형 폼이고 "상관없음" 옵션이 포함된 필드인 경우
  if (formType === 'preference' && fieldsWithAnyOption.includes(optionsKey)) {
    // "상관없음" 옵션이 없으면 추가
    if (!baseOptions.includes('상관없음')) {
      return [...baseOptions, '상관없음'];
    }
  }
  
  return baseOptions;
}

/**
 * 특정 옵션 키에 대한 기본 옵션을 반환
 * @param optionsKey - 옵션 키
 * @returns 기본 옵션 배열
 */
export function getBaseOptions(optionsKey: string): any[] {
  return options[optionsKey] || [];
}

/**
 * "상관없음" 옵션이 포함된 옵션을 반환
 * @param optionsKey - 옵션 키
 * @returns "상관없음" 옵션이 포함된 배열
 */
export function getOptionsWithAny(optionsKey: string): any[] {
  const baseOptions = options[optionsKey] || [];
  
  // 이미 "상관없음"이 포함되어 있으면 그대로 반환
  if (baseOptions.includes('상관없음')) {
    return baseOptions;
  }
  
  // "상관없음" 옵션을 추가할 수 있는 필드들
  const canHaveAnyOption = [
    'smoking',
    'drinking',
    'religions', 
    'childrenDesire'
  ];
  
  if (canHaveAnyOption.includes(optionsKey)) {
    return [...baseOptions, '상관없음'];
  }
  
  return baseOptions;
} 