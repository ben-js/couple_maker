// 프로필 도메인 타입 (공식)
export interface UserProfile {
  userId: string;
  name: string;
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
  maritalStatus: '미혼' | '이혼' | '사별';
  hasChildren: '없음' | '있음';
  marriagePlans: string;
  introduction: string;
  photos: string[];
} 