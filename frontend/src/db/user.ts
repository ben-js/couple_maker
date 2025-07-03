import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('mydb.db');

export const createUserTable = () => {
 db.execSync(
    `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT,
      gender TEXT,
      birthDate TEXT,
      height INTEGER,
      bodyType TEXT,
      job TEXT,
      education TEXT,
      religion TEXT,
      smoking TEXT,
      drinking TEXT,
      mbti TEXT,
      bio TEXT,
      photoUri TEXT,
      interests TEXT,
      city TEXT,
      district TEXT,
      maritalStatus TEXT,
      hasChildren INTEGER
    );`
  ); 
};

export const checkProfileExists = async (userId: string): Promise<boolean> => {
  try {
    db.execSync(`SELECT id FROM user WHERE id = '${userId}' LIMIT 1;`);
    return false;
  } catch (e) {
    // 쿼리 실행 에러 발생 시 없다고 가정
    return false;
  }
};

export interface UserProfile {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  height: number;
  bodyType: string;
  job: string;
  education: string;
  religion: string;
  smoking: string;
  drinking: string;
  mbti: string;
  bio: string;
  photoUri: string;
  interests: string;
  city: string;
  district: string;
  maritalStatus?: string;
  hasChildren?: number;
}

export const saveOrUpdateProfile = (profile: UserProfile) => {
  try {
    db.execSync(
      `INSERT OR REPLACE INTO user (
        id, name, gender, birthDate, height, bodyType, job, education, religion, smoking, drinking, mbti, bio, photoUri, interests, city, district, maritalStatus, hasChildren
      ) VALUES (
        '${profile.id}', '${profile.name}', '${profile.gender}', '${profile.birthDate}', ${profile.height}, '${profile.bodyType}', '${profile.job}', '${profile.education}', '${profile.religion}', '${profile.smoking}', '${profile.drinking}', '${profile.mbti}', '${profile.bio}', '${profile.photoUri}', '${profile.interests}', '${profile.city}', '${profile.district}', '${profile.maritalStatus ?? ''}', ${profile.hasChildren ?? 0}
      );`
    );
    return true;
  } catch (e) {
    return false;
  }
};

export const getProfile = (userId: string): UserProfile | null => {
  try {
    const result = db.getAllSync(`SELECT * FROM user WHERE id = '${userId}' LIMIT 1;`);
    if (result && result.length > 0) {
      return result[0] as UserProfile;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const createOnboardingTable = () => {
  db.execSync(
    `CREATE TABLE IF NOT EXISTS onboarding (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shown INTEGER
    );`
  );
};

export const getOnboardingShown = (): boolean => {
  try {
    const result = db.getAllSync('SELECT shown FROM onboarding WHERE id = 1 LIMIT 1;');
    if (result && result.length > 0) {
      return !!result[0].shown;
    }
    return false;
  } catch (e: any) {
    return false;
  }
};

export const setOnboardingShown = () => {
  try {
    db.execSync('INSERT OR REPLACE INTO onboarding (id, shown) VALUES (1, 1);');
    return true;
  } catch (e: any) {
    return false;
  }
}; 