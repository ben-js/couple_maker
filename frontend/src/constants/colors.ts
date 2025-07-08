export const colors = {
  // ✅ 기본 색상 (Flat UI)
  primary: '#ccc',       // 메인 텍스트 및 강조 (Instagram의 기본 텍스트 색)
  secondary: '#8E8E8E',     // 서브 텍스트 (보조 정보, 설명)

  // ✅ 배경 색상
  background: '#FFFFFF',    // 앱 전체 배경
  surface: '#F8F8F8',       // 카드/컴포넌트 영역 배경 (ux.md 기준)

  // ✅ 텍스트 색상
  text: {
    primary: '#262626',     // 기본 텍스트 (타이틀, 본문)
    secondary: '#8E8E8E',   // 설명, 보조 텍스트
    disabled: '#CCCCCC',    // 비활성 상태 텍스트
  },

  // ✅ 테두리 및 구분선
  border: '#DBDBDB',        // 입력창, 카드 구분선 등
  divider: '#F3F3F3',       // 섹션 사이 구분선

  // ✅ 상태 색상 (최소한만 유지)
  success: '#2E7D32',       // 성공 (딥그린)
  warning: '#ED6C02',       // 경고 (딥오렌지)
  error: '#D32F2F',         // 오류 (딥레드)

  // ✅ 기타
  overlay: 'rgba(0, 0, 0, 0.5)',       // 모달 오버레이
  shadow: 'rgba(0, 0, 0, 0.05)',       // 매우 연한 그림자
  disabled: '#F0F0F0',                 // 비활성 버튼 배경 등
  accent: '#3897F0', // 인스타그램 파랑
  stepInactive: '#E0E0E0', // 연회색 (진행바 미완료)
} as const;


export type ColorKey = keyof typeof colors; 