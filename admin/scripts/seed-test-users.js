// 테스트용 사용자 40명 생성 및 입력 스크립트
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
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

async function getApplicantPreferences() {
  const params = {
    TableName: 'Preferences',
    Key: { user_id: '1bc37de4-ead1-4881-b8d3-2f6ac9637d63' }
  };
  const { Item } = await dynamodb.send(new GetCommand(params));
  return Item;
}

async function main() {
  const applicantPref = await getApplicantPreferences();
  if (!applicantPref) {
    console.error('신청자 이상형 정보가 없습니다.');
    return;
  }
  for (let i = 1; i <= 30; i++) {
    // 성별은 신청자 이상형의 preferred_gender가 있으면 반대로, 없으면 랜덤
    let gender = '남';
    if (applicantPref.preferred_gender) {
      gender = applicantPref.preferred_gender === '남' ? '여' : '남';
    } else if (applicantPref.gender) {
      gender = applicantPref.gender === '남' ? '여' : '남';
    } else {
      gender = randomPick(OPTIONS.genders);
    }
    const name = gender === '남' ? `홍길동${i}` : `김영희${i}`;
    const email = `user${i}@test.com`;
    const user_id = `user_${i}`;
    // 나이: 이상형 age_range 내에서 랜덤
    let birth_date = randomBirthDate();
    if (applicantPref.age_range) {
      const now = new Date();
      const minYear = now.getFullYear() - applicantPref.age_range.max;
      const maxYear = now.getFullYear() - applicantPref.age_range.min;
      const year = randomInt(minYear, maxYear);
      const month = randomInt(1, 12);
      const day = randomInt(1, 28);
      birth_date = { year, month, day };
    }
    // 키: 이상형 height_range 내에서 랜덤
    let height = randomHeight(gender);
    if (applicantPref.height_range) {
      const min = parseInt(applicantPref.height_range.min);
      const max = parseInt(applicantPref.height_range.max);
      height = `${randomInt(min, max)}cm`;
    }
    // 지역: 이상형 regions 중 랜덤
    let region = randomRegion();
    if (applicantPref.regions && applicantPref.regions.length > 0) {
      region = randomPick(applicantPref.regions);
    }
    // 직업, 학력, MBTI 등
    let job = randomPick(OPTIONS.jobs);
    if (applicantPref.job_types && applicantPref.job_types.length > 0) {
      job = randomPick(applicantPref.job_types);
    }
    let education = randomPick(OPTIONS.educations);
    if (applicantPref.education_levels && applicantPref.education_levels.length > 0) {
      education = randomPick(applicantPref.education_levels);
    }
    let mbti = randomPick(OPTIONS.mbtis);
    if (applicantPref.mbti_types && applicantPref.mbti_types.length > 0) {
      mbti = randomPick(applicantPref.mbti_types);
    }
    // 나머지 속성은 기존 랜덤 방식
    const body_type = randomPick(OPTIONS.bodyTypes);
    const interests = randomPickArray(OPTIONS.interests, 3 + randomInt(0, 2));
    const favorite_foods = randomPickArray(OPTIONS.foods, randomInt(1, 3));
    const smoking = randomPick(OPTIONS.smoking);
    const drinking = randomPick(OPTIONS.drinking);
    const religion = randomPick(OPTIONS.religions);
    const children_desire = randomPick(OPTIONS.childrenDesire);
    const marriage_plans = randomPick(OPTIONS.marriagePlans);
    const salary = randomPick(OPTIONS.salary);
    const asset = randomPick(OPTIONS.asset);
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
        gender,
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
        photos: [`https://randomuser.me/api/portraits/${gender === '남' ? 'men' : 'women'}/${i}.jpg`],
        created_at,
        updated_at,
      }
    }));
    // Preferences (랜덤)
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
        average_grade: getGrade(average),
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
        average_grade: getGrade(average),
        scorer: 'manager_test',
        summary: `${name}의 점수 총평입니다.`,
        updated_at,
      }
    }));
    console.log(`Inserted user: ${email}`);
  }
  console.log('✅ 테스트 유저 30명 생성 완료!');
}

main().catch(console.error); 