import fs from 'fs';
import path from 'path';
import * as handler from './handler';

describe('REST API + 로그 기록 통합 테스트', () => {
  const today = new Date().toISOString().slice(0, 10);
  const logsPath = path.join(__dirname, 'logs', `${today}.json`);
  const usersPath = path.join(__dirname, 'data/users.json');
  const profilesPath = path.join(__dirname, 'data/profiles.json');
  const preferencesPath = path.join(__dirname, 'data/preferences.json');

  beforeEach(() => {
    if (fs.existsSync(logsPath)) fs.unlinkSync(logsPath);
    fs.writeFileSync(usersPath, '[]');
    fs.writeFileSync(profilesPath, '[]');
    fs.writeFileSync(preferencesPath, '[]');
  });

  it('회원가입 → 로그인(성공/실패) → 프로필 저장 → 이상형 저장 → 로그 기록', async () => {
    // 1. 회원가입
    const signupEvent = { body: JSON.stringify({ email: 'test@test.com', password: '1234' }), requestContext: { identity: { sourceIp: '1.2.3.4' } } };
    const signupRes = await handler.signup(signupEvent);
    const { user_id } = JSON.parse(signupRes.body);
    expect(user_id).toBeDefined();

    // 2. 로그인 성공
    const loginEvent = { body: JSON.stringify({ email: 'test@test.com', password: '1234' }), requestContext: { identity: { sourceIp: '1.2.3.4' } } };
    const loginRes = await handler.login(loginEvent);
    const loginBody = JSON.parse(loginRes.body);
    expect(loginBody.user_id).toBe(user_id);
    expect(loginBody.hasProfile).toBe(false);
    expect(loginBody.hasPreferences).toBe(false);

    // 3. 로그인 실패
    const loginFailEvent = { body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }), requestContext: { identity: { sourceIp: '1.2.3.4' } } };
    const loginFailRes = await handler.login(loginFailEvent);
    expect(loginFailRes.statusCode).toBe(401);

    // 4. 프로필 저장
    const saveProfileEvent = { body: JSON.stringify({ userId: user_id, name: '홍길동', age: 25 }), requestContext: { identity: { sourceIp: '1.2.3.4' } } };
    const saveProfileRes = await handler.saveProfile(saveProfileEvent);
    expect(JSON.parse(saveProfileRes.body).ok).toBe(true);

    // 5. 이상형 저장
    const savePrefEvent = { body: JSON.stringify({ userId: user_id, idealType: '착한 사람' }), requestContext: { identity: { sourceIp: '1.2.3.4' } } };
    const savePrefRes = await handler.saveUserPreferences(savePrefEvent);
    expect(JSON.parse(savePrefRes.body).ok).toBe(true);

    // 6. 로그 기록 검증
    const logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
    const types = logs.map((l: any) => l.type);
    expect(types).toEqual([
      'signup',
      'login',
      'login', // 실패도 type: login (result: fail)
      'profile_save',
      'preferences_save',
    ]);
    // 각 로그에 필수 필드가 있는지 확인
    logs.forEach((log: any) => {
      expect(log).toHaveProperty('type');
      expect(log).toHaveProperty('userId');
      expect(log).toHaveProperty('email');
      expect(log).toHaveProperty('ip');
      expect(log).toHaveProperty('result');
      expect(log).toHaveProperty('date');
    });
  });
}); 