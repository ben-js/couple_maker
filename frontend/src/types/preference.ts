// 이상형(선호) 도메인 타입 (공식)
export interface Preferences {
  userId: string;
  preferredGender: string;
  ageRange: {
    min: number;
    max: number;
  };
  heightRange: {
    min: number;
    max: number;
  };
  regions: Array<{
    region: string;
    district: string;
  }>;
  locations: string[];
  jobTypes: string[];
  educationLevels: string[];
  bodyTypes: string[];
  mbtiTypes: string[];
  interests: string[];
  marriagePlan: string;
  childrenDesire: '딩크족 희망' | '자녀 희망' | '상관없음';
  smoking: string;
  drinking: string;
  religion: string;
  priority: string;
} 