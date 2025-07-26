const { DynamoDBClient, PutItemCommand, ScanCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');

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
console.log('options:', options);
console.log('jobs:', options.jobs);
console.log('religions:', options.religions);
console.log('drinking:', options.drinking);
console.log('smoking:', options.smoking);

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

async function deleteAllTestUsers() {
  const client = new DynamoDBClient({ region: REGION });
  const tables = [USERS_TABLE, PROFILES_TABLE, PREFERENCES_TABLE, SCORES_TABLE];
  for (const table of tables) {
    const scanRes = await client.send(new ScanCommand({ TableName: table }));
    const items = scanRes.Items || [];
    for (const item of items) {
      const userId = item.user_id?.S || item.user_id?.N;
      if (userId && userId.startsWith('user_')) {
        let key = { user_id: { S: userId } };
        if (table === SCORES_TABLE && item.created_at) key.created_at = item.created_at;
        await client.send(new DeleteItemCommand({ TableName: table, Key: key }));
        console.log(`🗑️ Deleted from ${table}: ${userId}`);
      }
    }
  }
}

async function createBulkUsers() {
  await deleteAllTestUsers(); // Delete all existing test users first
  const client = new DynamoDBClient({ region: REGION });
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  // 1. user1 생성 (샘플 데이터)
  const user1Id = 'user_1';
  const user1Email = 'user1@test.com';
  const user1Grade = 'general';
  const user1Status = 'green';
  const user1 = {
    user_id: user1Id,
    email: user1Email,
    password: passwordHash,
    is_verified: true,
    has_profile: true,
    has_preferences: true,
    has_score: true,
    grade: user1Grade,
    status: user1Status,
    points: 100,
    created_at: now,
    updated_at: now,
  };
  const user1Profile = {
    user_id: user1Id,
    name: '테스트유저1',
    birth_date: { year: 1993, month: 3, day: 15 },
    gender: '남',
    height: 178,
    body_type:  randomPick(options.bodyTypes),
    job: randomPick(options.jobs),
    education: randomPick(options.educations, '대학교'),
    region: { region: '서울', district: '강남구' },
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
    introduction: '안녕하세요, 테스트유저1입니다.',
    photos: [],
    created_at: now,
    updated_at: now,
  };
  const user1Preference = {
    user_id: user1Id,
    age_range: { min: 25, max: 35 },
    height_range: { min: 160, max: 175 },
    regions: ['서울', '경기'],
    job_types: ['회사원', '공무원', '엔지니어'],
    education_levels: [randomPick(options.educations, '대학교')].filter(Boolean),
    body_types:  [randomPick(options.bodyTypes), randomPick(options.bodyTypes), randomPick(options.bodyTypes)].filter(Boolean),
    mbti_types: [randomPick(options.mbtis, 'ENFP')].filter(Boolean),
    interests: ['운동', '음악감상'],
    smoking: '비흡연',
    drinking: '가끔',
    religion: '무교',
    children_desire: '자녀 희망',
    marriage_plan: '1-2년 내',
    priority: '외모,성격,직업,경제력',
    created_at: now,
    updated_at: now,
  };
  const user1Score = {
    user_id: user1Id,
    appearance: 85,
    personality: 90,
    job: 88,
    education: 92,
    economics: 80,
    average: 87,
    average_grade: 'B',
    scorer: 'manager_1',
    summary: '최초 입력',
    created_at: now,
    updated_at: now,
  };
  console.log('USERS:', user1);
  console.log('PROFILES:', user1Profile);
  console.log('PREFERENCES:', user1Preference);
  console.log('SCORES:', user1Score);
  console.log('toDdb(USERS):', JSON.stringify(toDdbMap(user1), null, 2));
  console.log('toDdb(PROFILES):', JSON.stringify(toDdbMap(user1Profile), null, 2));
  console.log('toDdb(PREFERENCES):', JSON.stringify(toDdbMap(user1Preference), null, 2));
  console.log('toDdb(SCORES):', JSON.stringify(toDdbMap(user1Score), null, 2));
  await client.send(new PutItemCommand({ TableName: USERS_TABLE, Item: toDdbMap(user1) }));
  await client.send(new PutItemCommand({ TableName: PROFILES_TABLE, Item: toDdbMap(user1Profile) }));
  await client.send(new PutItemCommand({ TableName: PREFERENCES_TABLE, Item: toDdbMap(user1Preference) }));
  await client.send(new PutItemCommand({ TableName: SCORES_TABLE, Item: toDdbMap(user1Score) }));
  console.log(`✅ Created user: ${user1Email}`);

  // 2. user2 생성 (여성 샘플)
  const user2Id = 'user_2';
  const user2Email = 'user2@test.com';
  const user2Grade = 'general';
  const user2Status = 'green';
  const user2 = {
    user_id: user2Id,
    email: user2Email,
    password: passwordHash,
    is_verified: true,
    has_profile: true,
    has_preferences: true,
    has_score: true,
    grade: user2Grade,
    status: user2Status,
    points: 100,
    created_at: now,
    updated_at: now,
  };
  const user2Profile = {
    user_id: user2Id,
    name: '테스트유저2',
    birth_date: { year: 1994, month: 5, day: 20 },
    gender: '여',
    height: 165,
    body_type: randomPick(options.bodyTypes),
    job: randomPick(options.jobs),
    education: randomPick(options.educations, '대학교'),
    region: { region: '서울', district: '서초구' },
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
    introduction: '안녕하세요, 테스트유저2입니다.',
    photos: [],
    created_at: now,
    updated_at: now,
  };
  const user2Preference = {
    user_id: user2Id,
    age_range: { min: 27, max: 37 },
    height_range: { min: 170, max: 185 },
    regions: ['서울', '경기'],
    job_types: ['회사원', '공무원', '엔지니어'],
    education_levels: [randomPick(options.educations, '대학교')].filter(Boolean),
    body_types: [randomPick(options.bodyTypes), randomPick(options.bodyTypes), randomPick(options.bodyTypes)].filter(Boolean),
    mbti_types: [randomPick(options.mbtis, 'ENFP')].filter(Boolean),
    interests: ['운동', '음악감상'],
    smoking: '비흡연',
    drinking: '가끔',
    religion: '무교',
    children_desire: '자녀 희망',
    marriage_plan: '1-2년 내',
    priority: '외모,성격,직업',
    created_at: now,
    updated_at: now,
  };
  const user2Score = {
    user_id: user2Id,
    appearance: 88,
    personality: 85,
    job: 90,
    education: 91,
    economics: 82,
    average: 87,
    average_grade: 'B',
    scorer: 'manager_1',
    summary: '최초 입력',
    created_at: now,
    updated_at: now,
  };
  console.log('USERS:', user2);
  console.log('PROFILES:', user2Profile);
  console.log('PREFERENCES:', user2Preference);
  console.log('SCORES:', user2Score);
  await client.send(new PutItemCommand({ TableName: USERS_TABLE, Item: toDdbMap(user2) }));
  await client.send(new PutItemCommand({ TableName: PROFILES_TABLE, Item: toDdbMap(user2Profile) }));
  await client.send(new PutItemCommand({ TableName: PREFERENCES_TABLE, Item: toDdbMap(user2Preference) }));
  await client.send(new PutItemCommand({ TableName: SCORES_TABLE, Item: toDdbMap(user2Score) }));
  console.log(`✅ Created user: ${user2Email}`);

  // 3. user3~user40 생성 (user1, user2 참고)
  for (let i = 3; i <= 40; i++) {
    const userId = `user_${i}`;
    const email = `user${i}@test.com`;
    const grade = randomPick(USER_GRADES);
    const status = randomPick(USER_STATUS);
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
      name: `테스트유저${i}`,
      birth_date: { year: 1990 + randomInt(0, 9), month: randomInt(1, 12), day: randomInt(1, 28) },
      gender: '여',
      height: `${randomInt(160, 180)}`,
      body_type:  randomPick(options.bodyTypes),
      job: randomPick(options.jobs),
      education: randomPick(options.educations, '대학교'),
      region: { region: randomPick(['서울', '경기', '인천', '부산', '대구']), district: randomPick(['강남구', '서초구', '송파구', '성남시', '고양시']) },
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
      introduction: `안녕하세요, 테스트유저${i}입니다.`,
      photos: [],
      created_at: now,
      updated_at: now,
    };
    const preference = {
      user_id: userId,
      age_range: { min: randomInt(20, 40), max: randomInt(25, 45) },
      height_range: { min: `${randomInt(150, 180)}`, max: `${randomInt(160, 190)}` },
      regions: [randomPick(['서울', '경기', '인천', '부산', '대구']), randomPick(['강남구', '서초구', '송파구', '성남시', '고양시'])],
      job_types: ['회사원', '공무원', '엔지니어'],
      education_levels: [randomPick(options.educations, '대학교')].filter(Boolean),
      mbti_types: [randomPick(options.mbtis, 'ENFP')].filter(Boolean),
      interests: ['운동', '음악감상'],
      smoking: randomPick(options.smoking),
      drinking: randomPick(options.drinking),
      religion: randomPick(options.religions),
      children_desire: randomPick(options.childrenDesire),
      marriage_plan: randomPick(options.marriagePlans),
      body_types: [randomPick(options.bodyTypes), randomPick(options.bodyTypes), randomPick(options.bodyTypes)].filter(Boolean),
      priority: '외모,성격,직업,경제력',
      created_at: now,
      updated_at: now,
    };
    const score = {
      user_id: userId,
      appearance: randomInt(70, 95),
      personality: randomInt(70, 95),
      job: randomInt(70, 95),
      education: randomInt(70, 95),
      economics: randomInt(70, 95),
      average: randomInt(75, 90),
      average_grade: randomPick(['A', 'B', 'C']),
      scorer: 'manager_1',
      summary: '최초 입력',
      created_at: now,
      updated_at: now,
    };
    console.log('USERS:', user);
    console.log('PROFILES:', profile);
    console.log('PREFERENCES:', preference);
    console.log('SCORES:', score);
    await client.send(new PutItemCommand({ TableName: USERS_TABLE, Item: toDdbMap(user) }));
    await client.send(new PutItemCommand({ TableName: PROFILES_TABLE, Item: toDdbMap(profile) }));
    await client.send(new PutItemCommand({ TableName: PREFERENCES_TABLE, Item: toDdbMap(preference) }));
    await client.send(new PutItemCommand({ TableName: SCORES_TABLE, Item: toDdbMap(score) }));
    console.log(`✅ Created user: ${email}`);
  }
  console.log(' 모든 유저 생성 완료!');
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

createBulkUsers().catch(console.error); 