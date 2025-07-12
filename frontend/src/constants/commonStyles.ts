import { StyleSheet } from 'react-native';
import { colors, typography } from './index';

export const commonStyles = StyleSheet.create({
  // 100% 너비 공통 스타일 (PageLayout에서 90% 적용됨)
  width100: {
    width: '100%'
  },
  
  // 섹션 공통 스타일
  section: {
    backgroundColor: colors.surface,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    width: '100%',
  },
  
  // 섹션 제목 공통 스타일
  sectionTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: 16
  },
  
  // 칩 행 공통 스타일
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  
  // 칩 공통 스타일
  chip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1
  },
  
  // 칩 라벨 공통 스타일
  chipLabel: {
    color: colors.text.primary,
    fontSize: 15
  },
  
  // 자기소개 버블 공통 스타일
  introductionBubble: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 8,
    width: '100%'
  },
  
  // 자기소개 텍스트 공통 스타일
  introductionBubbleText: {
    color: colors.text.disabled,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center'
  },
  
  // 일반 텍스트 공통 스타일
  bodyText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginTop: 8
  },

  // 폼 화면용 공통 스타일
  formContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center'
  },
  
  formScrollView: {
    width: '90%',
    paddingBottom: 100
  },
  
  formSection: {
    backgroundColor: colors.surface,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%'
  },
  
  formButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '100%'
  },
  
  formButtonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16
  }
}); 