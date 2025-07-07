// 색상 가이드라인 (커서 룰 기반)
export const colors = {
  // 메인 색상
  primary: '#FF6B6B',      // 메인 브랜드 색상
  secondary: '#FFA07A',    // 보조 색상
  
  // 배경 색상
  background: '#FFFFFF',   // 전체 배경색
  surface: '#FFFFFF',      // 카드/컴포넌트 배경
  
  // 텍스트 색상
  text: {
    primary: '#333333',    // 주요 텍스트
    secondary: '#666666',  // 보조 텍스트
    disabled: '#888888',   // 비활성 텍스트
  },
  
  // 테두리/구분선
  border: '#F3F3F3',
  
  // 상태 색상
  success: '#4CAF50',      // 성공
  warning: '#FF9800',      // 경고
  error: '#F44336',        // 오류
  
  // 기타
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
  disableColor: 'rgba(255, 107, 107, 0.3)', // primary 연한 버전
} as const;

export type ColorKey = keyof typeof colors; 