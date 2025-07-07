// types/index.ts - 도메인별 타입 통합 export

export { UserProfile } from './profile';
export { UserPreferences } from './preference';
export { MatchPair } from './match';
// ... (기존 User, Review, ReviewStats 등도 동일하게 목적별 파일로 분리 후 export)
// ... (추가 도메인 타입 분리 필요시 동일 패턴 적용) 