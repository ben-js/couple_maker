// 테스트용 사용자 40명 생성 및 입력 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const OPTIONS = require('../../frontend/src/data/options.json');
const REGIONS_DATA = require('../../frontend/src/data/regions.json');
const PROFILE_FORM = require('../../frontend/src/data/profileForm.json');
const PREFERENCE_FORM = require('../../frontend/src/data/preferenceForm.json');

const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};
const client = new DynamoDBClient(AWS_CONFIG);
const dynamodb = DynamoDBDocumentClient.from(client);

function randomPick(arr, n = 1) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomRegion() {
  const region = randomPick(Object.keys(REGIONS_DATA));
  const district = randomPick(REGIONS_DATA[region]);
  return { region, district };
}
function randomBirthDate() {
  const d = randomDate(new Date(1985, 0, 1), new Date(2003, 11, 31));
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
function randomHeight(gender) {
  // 150~190cm 범위 랜덤, 문자열로
  return `${randomInt(gender === 'male' ? 165 : 150, gender === 'male' ? 190 : 170)}cm`;
}
function randomPickArray(arr, n = 1) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

async function main() {
  for (let i = 3; i <= 42; i++) {
    // 기본 정보
    const genderKor = randomPick(OPTIONS.genders);
    const gender = genderKor === '남' ? 'male' : 'female';
    const name = gender === 'male' ? `홍길동${i}` : `김영희${i}`;
    const email = `user${i}@test.com`;
    const user_id = `user_${i}`;
    const birth_date = randomBirthDate();
    const height = randomHeight(gender);
    const body_type = randomPick(OPTIONS.bodyTypes);
    const job = randomPick(OPTIONS.jobs);
    const education = randomPick(OPTIONS.educations);
    const mbti = randomPick(OPTIONS.mbtis);
    const interests = randomPickArray(OPTIONS.interests, 3 + randomInt(0, 2));
    const favorite_foods = randomPickArray(OPTIONS.foods, randomInt(1, 3));
    const smoking = randomPick(OPTIONS.smoking);
    const drinking = randomPick(OPTIONS.drinking);
    const religion = randomPick(OPTIONS.religions);
    const children_desire = randomPick(OPTIONS.childrenDesire);
    const marriage_plans = randomPick(OPTIONS.marriagePlans);
    const salary = randomPick(OPTIONS.salary);
    const asset = randomPick(OPTIONS.asset);
    const region = randomRegion();
    const introduction = `${name}의 자기소개입니다. 다양한 경험과 취미를 가지고 있습니다.`;
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    // Users
    await dynamodb.send(new PutCommand({
      TableName: 'Users',
      Item: {
        user_id,
        email,
        status: 'green',
        grade: 'general',
        points: 0,
        created_at,
        updated_at,
        has_profile: true,
        has_preferences: true,
        is_verified: true,
        is_deleted: false,
        password: crypto.createHash('sha256').update('1q2w3e4r').digest('hex'),
      }
    }));
    // Profiles
    await dynamodb.send(new PutCommand({
      TableName: 'Profiles',
      Item: {
        user_id,
        name,
        birth_date,
        gender: genderKor,
        height,
        body_type,
        job,
        education,
        region,
        mbti,
        interests,
        favorite_foods,
        smoking,
        drinking,
        religion,
        children_desire,
        marriage_plans,
        salary,
        asset,
        introduction,
        photos: [`https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${i}.jpg`],
        created_at,
        updated_at,
      }
    }));
    // Preferences
    const prefRegions = Array.from({length: randomInt(1, 3)}, randomRegion);
    await dynamodb.send(new PutCommand({
      TableName: 'Preferences',
      Item: {
        user_id,
        age_range: { min: randomInt(22, 28), max: randomInt(29, 38) },
        height_range: { min: `${randomInt(150, 165)}cm`, max: `${randomInt(166, 185)}cm` },
        regions: prefRegions,
        job_types: randomPickArray(OPTIONS.jobs, randomInt(1, 3)),
        education_levels: randomPickArray(OPTIONS.educations, randomInt(1, 3)),
        body_types: randomPickArray(OPTIONS.bodyTypes, randomInt(1, 3)),
        mbti_types: randomPickArray(OPTIONS.mbtis, randomInt(1, 3)),
        interests: randomPickArray(OPTIONS.interests, randomInt(2, 5)),
        smoking: randomPick(OPTIONS.smokingWithAny),
        drinking: randomPick(OPTIONS.drinkingWithAny),
        religion: randomPick(OPTIONS.religionsWithAny),
        children_desire: randomPick(OPTIONS.childrenDesireWithAny),
        marriage_plan: randomPick(OPTIONS.marriagePlans),
        priority: randomPick(OPTIONS.priority.map(p => p.id), 5),
        created_at,
        updated_at,
      }
    }));
    // Scores (정책에 맞게 평균점수, 등급 등 생성)
    const appearance = randomInt(60, 100);
    const personality = randomInt(60, 100);
    const jobScore = randomInt(60, 100);
    const educationScore = randomInt(60, 100);
    const economics = randomInt(60, 100);
    const average = Math.round((appearance * 0.25 + personality * 0.25 + jobScore * 0.2 + educationScore * 0.15 + economics * 0.15) * 10) / 10;
    function getGrade(score) {
      if (score >= 95) return 'S';
      if (score >= 85) return 'A';
      if (score >= 75) return 'B';
      if (score >= 65) return 'C';
      if (score >= 55) return 'D';
      if (score >= 45) return 'E';
      return 'F';
    }
    await dynamodb.send(new PutCommand({
      TableName: 'Scores',
      Item: {
        user_id,
        scorer: 'manager_test',
        summary: `${name}의 점수 총평입니다.`,
        average,
        appearance,
        personality,
        job: jobScore,
        education: educationScore,
        economics,
        average_grade: getGrade(average), // grade → average_grade
        created_at,
        updated_at,
      }
    }));
    // ScoreHistory 이력도 snake_case로 저장
    await dynamodb.send(new PutCommand({
      TableName: 'ScoreHistory',
      Item: {
        user_id,
        created_at,
        appearance,
        personality,
        job: jobScore,
        education: educationScore,
        economics,
        average,
        average_grade: getGrade(average), // grade → average_grade
        scorer: 'manager_test',
        summary: `${name}의 점수 총평입니다.`,
        updated_at,
      }
    }));
    console.log(`Inserted user: ${email}`);
  }
  console.log('✅ 테스트 유저 40명 생성 완료!');
}

main().catch(console.error); 