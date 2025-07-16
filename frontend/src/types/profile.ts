// 프로필 도메인 타입 (공식)
export interface UserProfile {
  userId: string;
  name: string;
  email?: string;
  birthDate: {
    year: number;
    month: number;
    day: number;
  };
  gender: '남' | '여';
  height: number;
  bodyType: '슬림' | '평균' | '근육질' | '통통';
  job: string;
  education: '고등학교' | '전문대' | '대학교' | '대학원' | '박사';
  region: {
    region: string;
    district: string;
  };
  mbti: string;
  interests: string[];
  favoriteFoods: string[];
  smoking: '흡연' | '비흡연';
  drinking: '음주' | '비음주';
  religion: '무교' | '불교' | '천주교' | '기독교' | '기타';
  childrenDesire: '딩크족 희망' | '자녀 희망';
  salary: '4천만원 미만' | '4천만원 ~ 5천만원' | '5천만원 ~ 7천만원' | '7천만원 ~ 9천만원' | '1억원 ~ 1억5천만원' | '1억5천만원 ~ 2억원' | '2억원 이상';
  asset: '5천만원 미만' | '5천만원 ~ 1억원' | '1억원 ~ 2억원' | '2억원 ~ 3억원' | '3억원 ~ 5억원' | '5억원 ~ 10억원' | '10억원 ~ 15억원' | '15억원 ~ 20억원' | '20억원 이상';
  marriagePlans: string;
  introduction: string;
  photos: string[];
  points: number;
  hasPreferences?: boolean;
  hasProfile?: boolean;
  isVerified?: boolean;
} 