// [상수 + 단순 변환 함수 파일]
// 이 파일은 점수 계산에 필요한 상수와,
// 상수와 1:1로 동작하는 단순 변환 함수(getXXXScore 등)를 카테고리별로 묶어서 관리합니다.
// 복잡한 계산/비즈니스 로직은 별도 파일로 분리하세요.

// =========================
// 🎨 외모 관련 상수/함수
// =========================

/**
 * 바디타입 점수 매핑
 */
export const BODY_TYPE_SCORE_PAIRS: [string[], number][] = [
  [['모델핏'], 100],
  [['운동하는체형'], 90],
  [['보통', '마른'], 85],
  [['귀엽고통통한'], 70],
  [['통통한편'], 60],
  [['포근한체형'], 50],
];
/** bodyType 값에 따라 점수를 반환 */
export function getBodyTypeScore(bodyType: string): number {
  for (const [types, score] of BODY_TYPE_SCORE_PAIRS) {
    if (types.includes(bodyType)) return score;
  }
  return 50;
}

/**
 * 키 점수 구간 (남/여)
 */
export const MALE_HEIGHT_SCORE_RANGES = [
  { min: 183, max: 192, score: 100 },
  { min: 178, max: 182, score: 90 },
  { min: 193, max: 200, score: 90 },
  { min: 173, max: 177, score: 80 },
  { min: 165, max: 172, score: 70 },
  { min: 155, max: 164, score: 60 },
  { min: 0, max: 154, score: 55 },
];
export const FEMALE_HEIGHT_SCORE_RANGES = [
  { min: 165, max: 168, score: 100 },
  { min: 162, max: 164, score: 90 },
  { min: 169, max: 172, score: 90 },
  { min: 158, max: 161, score: 80 },
  { min: 173, max: 175, score: 80 },
  { min: 155, max: 157, score: 70 },
  { min: 176, max: 300, score: 70 },
  { min: 0, max: 154, score: 55 },
];

/**
 * 나이 점수 구간 (남/여)
 */
export const MALE_AGE_SCORE_RANGES = [
  { min: 28, max: 31, score: 100 },
  { min: 25, max: 27, score: 90 },
  { min: 32, max: 35, score: 90 },
  { min: 36, max: 38, score: 80 },
  { min: 0, max: 24, score: 70 },
  { min: 39, max: 42, score: 70 },
  { min: 43, max: 150, score: 60 },
];
export const FEMALE_AGE_SCORE_RANGES = [
  { min: 23, max: 26, score: 100 },
  { min: 0, max: 21, score: 90 },
  { min: 27, max: 29, score: 90 },
  { min: 30, max: 32, score: 80 },
  { min: 33, max: 35, score: 70 },
  { min: 36, max: 39, score: 60 },
  { min: 40, max: 150, score: 20 },
];

/**
 * 외모 점수 가중치
 */
export const APPEARANCE_WEIGHT = {
  face: 0.5,
  height: 0.2,
  body: 0.15,
  age: 0.15,
};

// =========================
// 💼 직업/경제력 관련 상수/함수
// =========================

/**
 * 직업 점수 매핑
 */
export const JOB_SCORE_PAIRS: [string[], number][] = [
  [['판사', '검사'], 100],
  [['변호사', '의사', '교수'], 95],
  [['공기업', '교사', '연예인'], 90],
  [['회사원', '간호사', '운동선수', '예술가', '작가', '미용사'], 80],
  [['학생', '자영업', '요리사'], 70],
];
/** job 값에 따라 점수를 반환 */
export function getJobScore(job: string): number {
  for (const [types, score] of JOB_SCORE_PAIRS) {
    if (types.includes(job) || job === types.join('/')) return score;
  }
  return 60;
}

/**
 * 직업 점수 가중치
 */
export const JOB_WEIGHT = {
  job: 0.7,
  salary: 0.3,
};

/**
 * 경제력 점수 매핑(직업)
 */
export const ECONOMICS_JOB_SCORE_PAIRS: [string[], number][] = [
  [['판사', '검사'], 100],
  [['변호사', '의사', '교수'], 100],
  [['공기업', '교사', '교수'], 90],
  [['학생'], 60],
];
/** job 값에 따라 경제력 점수를 반환 */
export function getEconomicsJobScore(job: string): number {
  for (const [types, score] of ECONOMICS_JOB_SCORE_PAIRS) {
    if (types.includes(job)) return score;
  }
  return 80;
}

/**
 * 자산/연봉 점수 구간
 */
export const ASSET_SCORE_RANGES = [
  { min: 200000, score: 100 },
  { min: 150000, score: 95 },
  { min: 100000, score: 90 },
  { min: 50000, score: 85 },
  { min: 30000, score: 80 },
  { min: 20000, score: 75 },
  { min: 10000, score: 75 },
  { min: 5000, score: 60 },
  { min: 0, score: 20 },
];
export const SALARY_SCORE_RANGES = [
  { min: 20000, score: 100 },
  { min: 15000, score: 90 },
  { min: 7000, score: 85 },
  { min: 5000, score: 80 },
  { min: 4000, score: 70 },
  { min: 0, score: 60 },
];

/**
 * 경제력 점수 가중치
 */
export const ECONOMICS_WEIGHT = {
  asset: 0.7,
  job: 0.2,
  salary: 0.1,
};

// =========================
// 🧑‍🎓 학력 관련 상수/함수
// =========================

/**
 * 학력 점수 매핑
 */
export const EDUCATION_SCORE_PAIRS: [string[], number][] = [
  [['박사'], 100],
  [['대학원'], 90],
  [['대학교'], 80],
  [['전문대'], 70],
  [['고등학교'], 50],
];
/** education 값에 따라 점수를 반환 */
export function getEducationScore(education: string): number {
  for (const [types, score] of EDUCATION_SCORE_PAIRS) {
    if (types.includes(education)) return score;
  }
  return 50;
}

// =========================
// 🧠 성격/취향 관련 상수/함수
// =========================

/**
 * MBTI 점수 매핑
 */
export const MBTI_SCORE_PAIRS: [string[], number][] = [
  [['ENFJ'], 100],
  [['INFJ'], 95],
  [['ESFJ'], 90],
  [['ENTP', 'ENTJ', 'INTJ'], 70],
  [['ISTP', 'ESTP'], 60],
  [['기타'], 80],
];
/** mbti 값에 따라 점수를 반환 */
export function getMbtiScore(mbti: string): number {
  for (const [types, score] of MBTI_SCORE_PAIRS) {
    if (types.includes(mbti)) return score;
  }
  return 80;
}

/**
 * 취미 점수 매핑
 */
export const HOBBY_SCORE_PAIRS: [string[], number][] = [
  [['봉사활동'], 100],
  [['자기계발', '독서', '산책'], 90],
  [['게임'], 50],
  [['기타'], 80],
];
/** hobby 값에 따라 점수를 반환 */
export function getHobbyScore(hobby: string): number {
  for (const [types, score] of HOBBY_SCORE_PAIRS) {
    if (types.includes(hobby)) return score;
  }
  return 80;
}

/**
 * 흡연 점수 매핑
 */
export const SMOKING_SCORE_PAIRS: [string[], number][] = [
  [['비흡연'], 100],
  [['흡연'], 50],
];
/** smoking 값에 따라 점수를 반환 */
export function getSmokingScore(smoking: string): number {
  for (const [types, score] of SMOKING_SCORE_PAIRS) {
    if (types.includes(smoking)) return score;
  }
  return 50;
}

/**
 * 자녀 희망 점수 매핑
 */
export const WANT_CHILD_SCORE_PAIRS: [string[], number][] = [
  [['자녀 희망'], 100],
  [['딩크족 희망'], 70],
];
/** wantChild 값에 따라 점수를 반환 */
export function getWantChildScore(wantChild: string): number {
  for (const [types, score] of WANT_CHILD_SCORE_PAIRS) {
    if (types.includes(wantChild)) return score;
  }
  return 70;
}

/**
 * 성격/취향 점수 가중치
 */
export const PERSONALITY_WEIGHT = {
  ideal: 0.1,
  smoking: 0.2,
  hobby: 0.35,
  child: 0.15,
  mbti: 0.2,
};
export const PERSONALITY_PRIORITY_WEIGHT = {
  personality: 0.7,
  value: 0.3,
};

// =========================
// 🏆 전체 점수 가중치
// =========================

export const TOTAL_SCORE_WEIGHT = {
  appearance: 0.25,
  personality: 0.25,
  job: 0.2,
  education: 0.15,
  economics: 0.15,
};

// 등급 정책 (score-policy.md 기준)
export const GRADE_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
// 등급별 추천 인원 정책
export const GRADE_RECOMMEND_COUNT = {
  upper: 3, // 상위 등급
  same: 4,  // 동일 등급
  lower: 3, // 하위 등급
};

// 등급별 점수 매핑 (score-policy.md)
export const GRADE_SCORE_MAP = {
  S: 100,
  A: 90,
  B: 80,
  C: 60,
  D: 40,
  E: 20,
  F: 10,
};
// 우선순위별 가중치 (score-policy.md)
export const PRIORITY_WEIGHT = [0.4, 0.3, 0.2, 0.1]; // 1~4순위: 40%, 30%, 20%, 10%

// =========================
// 🛠️ 입력값 변환 유틸 함수 추가
// =========================

/**
 * 직업명 → 그룹 대표값 매핑
 */
export function normalizeJob(job: string): import('../../types/score').Job {
  for (const [group, _] of JOB_SCORE_PAIRS) {
    if (group.includes(job)) return group.join('/') as import('../../types/score').Job;
  }
  return '기타';
}

/**
 * 연봉 문자열 → 숫자(만원)
 */
export function parseSalary(salary: string | number): number {
  if (typeof salary === 'number') return salary;
  if (!salary) return 0;
  // "5천만원 ~ 7천만원" 등 구간 처리
  if (salary.includes('~')) {
    const [minStr, maxStr] = salary.split('~').map(s => s.trim());
    const min = parseSalary(minStr);
    const max = parseSalary(maxStr);
    return Math.round((min + max) / 2);
  }
  let num = 0;
  if (salary.includes('억')) {
    const match = salary.match(/(\d+)(억)?\s*(\d+)?(천)?/);
    if (match) {
      num += parseInt(match[1], 10) * 10000;
      if (match[3]) num += parseInt(match[3], 10) * 1000;
    }
  } else if (salary.includes('천')) {
    const match = salary.match(/(\d+)(천)?/);
    if (match) num += parseInt(match[1], 10) * 1000;
  } else {
    const match = salary.match(/(\d+)/);
    if (match) num += parseInt(match[1], 10);
  }
  return num;
}

/**
 * 자산 문자열 → 숫자(만원)
 */
export function parseAsset(asset: string | number): number {
  return parseSalary(asset);
} 