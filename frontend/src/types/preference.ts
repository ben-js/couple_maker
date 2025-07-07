// 이상형(선호) 도메인 타입 (공식)
export interface UserPreferences {
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
  hobbies: string[];
  personalityTags: string[];
  valuesInLife: string[];
  datingStyle: string[];
  marriagePlan: string;
  childrenDesire: string;
  smoking: string;
  drinking: string;
  religion: string;
  preferredMeetupTypes: string[];
  priorityFields: string[];
  priorityOrder: string[];
} 