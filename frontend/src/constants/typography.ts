// 타이포그래피 규칙 (커서 룰 기반)
export const typography = {
  // 헤더
  h1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333333',
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333333',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333333',
  },
  
  // 본문
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#333333',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#666666',
  },
  
  // 캡션
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#666666',
  },
  
  // 작은 텍스트
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#888888',
  },
  
  // 버튼 텍스트
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
} as const;

export type TypographyKey = keyof typeof typography; 