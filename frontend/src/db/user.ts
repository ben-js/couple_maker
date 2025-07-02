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