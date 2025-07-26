const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const bcrypt = require('bcryptjs');

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const USERS_TABLE = 'Users';
const PROFILES_TABLE = 'Profiles';
const PREFERENCES_TABLE = 'Preferences';
const SCORES_TABLE = 'Scores';

const PASSWORD = '1q2w3e4r';
const SALT_ROUNDS = 10;

const USER_GRADES = ['general', 'excellent', 'gold', 'vip', 'vvip'];
const USER_STATUS = ['green'];

const options = require('../../frontend/src/data/options.json');

function randomPick(arr, fallback = '') {
  if (!arr || !arr.length) {
    console.error('randomPick: 빈 배열 또는 undefined!', arr);
    return fallback;
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createMaleUsers() {
  const client = new DynamoDBClient({ region: REGION });
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  // user_2의 선호도에 맞는 남성 사용자 10명 생성 (user_41 ~ user_50)
  for (let i = 41; i <= 50; i++) {
    const userId = `user_${i}`;
    const email = `user${i}@test.com`;
    const grade = randomPick(USER_GRADES);
    const status = randomPick(USER_STATUS);
    
    // user_2의 선호도: 나이 27-37, 키 170-185, 지역 서울/경기
    const age = randomInt(27, 37);
    const height = randomInt(170, 185);
    
    const user = {
      user_id: userId,
      email,
      password: passwordHash,
      is_verified: true,
      has_profile: true,
      has_preferences: true,
      has_score: true,
      grade,
      status,
      points: 100,
      created_at: now,
      updated_at: now,
    };
    
    const profile = {
      user_id: userId,
      name: `테스트남성${i}`,
      birth_date: { year: new Date().getFullYear() - age, month: randomInt(1, 12), day: randomInt(1, 28) },
      gender: '남', // 남성으로 고정
      height: height,
      body_type: randomPick(options.bodyTypes),
      job: randomPick(options.jobs),
      education: randomPick(options.educations, '대학교'),
      region: { region: randomPick(['서울', '경기']), district: randomPick(['강남구', '서초구', '송파구', '성남시', '고양시']) },
      mbti: randomPick(options.mbtis, 'ENFP'),
      interests: [randomPick(options.interests), randomPick(options.interests), randomPick(options.interests)],
      favorite_foods: [randomPick(options.foods), randomPick(options.foods), randomPick(options.foods)],
      smoking: randomPick(options.smoking),
      drinking: randomPick(options.drinking),
      religion: randomPick(options.religions),
      children_desire: randomPick(options.childrenDesire),
      marriage_plans: randomPick(options.marriagePlans),
      salary: randomPick(options.salary),
      asset: randomPick(options.asset),
      introduction: `안녕하세요, 테스트남성${i}입니다.`,
      photos: [],
      created_at: now,
      updated_at: now,
    };
    
    const preference = {
      user_id: userId,
      age_range: { min: randomInt(25, 35), max: randomInt(30, 40) },
      height_range: { min: randomInt(160, 175), max: randomInt(165, 180) },
      regions: ['서울', '경기'],
      job_types: ['회사원', '공무원', '엔지니어'],
      education_levels: [randomPick(options.educations, '대학교')].filter(Boolean),
      mbti_types: [randomPick(options.mbtis, 'ENFP')].filter(Boolean),
      interests: ['운동', '음악감상'],
      smoking: '비흡연',
      drinking: '가끔',
      religion: '무교',
      children_desire: '자녀 희망',
      marriage_plan: '1-2년 내',
      body_types: [randomPick(options.bodyTypes), randomPick(options.bodyTypes), randomPick(options.bodyTypes)].filter(Boolean),
      priority: '외모,성격,직업',
      created_at: now,
      updated_at: now,
    };
    
    const score = {
      user_id: userId,
      appearance: randomInt(75, 95),
      personality: randomInt(75, 95),
      job: randomInt(75, 95),
      education: randomInt(75, 95),
      economics: randomInt(75, 95),
      average: randomInt(80, 90),
      average_grade: randomPick(['A', 'B']),
      scorer: 'manager_1',
      summary: '최초 입력',
      created_at: now,
      updated_at: now,
    };
    
    console.log(`🔄 Creating user: ${email}`);
    console.log(`   - Age: ${age}, Height: ${height}cm`);
    console.log(`   - Region: ${profile.region.region} ${profile.region.district}`);
    console.log(`   - Job: ${profile.job}, Grade: ${grade}`);
    
    await client.send(new PutItemCommand({ TableName: USERS_TABLE, Item: toDdbMap(user) }));
    await client.send(new PutItemCommand({ TableName: PROFILES_TABLE, Item: toDdbMap(profile) }));
    await client.send(new PutItemCommand({ TableName: PREFERENCES_TABLE, Item: toDdbMap(preference) }));
    await client.send(new PutItemCommand({ TableName: SCORES_TABLE, Item: toDdbMap(score) }));
    
    console.log(`✅ Created male user: ${email}`);
  }
  
  console.log('🎉 모든 남성 테스트 유저 생성 완료! (user_41 ~ user_50)');
}

function toDdb(val) {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'string') return { S: val };
  if (typeof val === 'number') return { N: val.toString() };
  if (typeof val === 'boolean') return { BOOL: val };
  if (Array.isArray(val)) {
    if (val.length === 0) return undefined;
    if (val.some(v => v === undefined)) {
      console.error('toDdb: 배열에 undefined 포함!', val);
      throw new Error('toDdb: 배열에 undefined 포함!');
    }
    return { L: val.map(v => toDdb(v)).filter(Boolean) };
  }
  if (typeof val === 'object') {
    const map = {};
    for (const k in val) {
      const v = toDdb(val[k]);
      if (v !== undefined) map[k] = v;
    }
    if (Object.keys(map).length === 0) return undefined;
    return { M: map };
  }
  return undefined;
}

function toDdbMap(obj) {
  const out = {};
  for (const k in obj) {
    const v = toDdb(obj[k]);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

createMaleUsers().catch(console.error); 