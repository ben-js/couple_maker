import { useEffect, useState } from 'react';
import { ScoreInput } from '../types/score';
import { JOB_SCORE_PAIRS, normalizeJob, parseSalary, parseAsset } from '../lib/score/scoreMappings';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const defaultScore: ScoreInput = {
  gender: 'male',
  faceScore: 0,
  height: 170,
  bodyType: '보통/마른',
  age: 25,
  personalityPriority: 1,
  valuePriority: 2,
  isSmoker: false,
  hobby: '',
  wantChild: true,
  mbti: 'ENFJ',
  job: '기타',
  salary: 0,
  education: '대학교',
  asset: 0,
};

export default function ScoreWritePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [score, setScore] = useState<ScoreInput>(defaultScore);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users?hasScore=false')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }, []);

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setScore({ ...defaultScore, gender: 'male' }); // TODO: 실제 성별 등 정보 반영
    setMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked;
    }
    setScore((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setMessage(null);
    // 변환 적용
    const normalizedScore = {
      ...score,
      job: normalizeJob(score.job),
      salary: parseSalary(score.salary),
      asset: parseAsset(score.asset),
    };
    try {
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, score: normalizedScore }),
      });
      if (res.ok) {
        setMessage('점수 저장 완료!');
      } else {
        setMessage('저장 실패');
      }
    } catch {
      setMessage('저장 실패');
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>점수 작성/수정</h2>
      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <b>사용자 선택:</b>
            <select onChange={e => handleSelect(users.find(u => u.id === e.target.value) || null)} value={selectedUser?.id || ''}>
              <option value="">사용자 선택</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          {selectedUser && (
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div style={{ marginBottom: 8 }}>
                <label>얼굴 점수: <input type="number" name="faceScore" value={score.faceScore} min={0} max={100} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>키: <input type="number" name="height" value={score.height} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>나이: <input type="number" name="age" value={score.age} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>바디타입: <input type="text" name="bodyType" value={score.bodyType} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>직업: 
                  <select name="job" value={score.job} onChange={handleChange}>
                    {JOB_SCORE_PAIRS.flatMap(([group, _score]) => group.map((job) => (
                      <option key={job} value={job}>{job}</option>
                    )))}
                  </select>
                </label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>연봉: <input type="number" name="salary" value={score.salary} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>학력: <input type="text" name="education" value={score.education} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>자산: <input type="number" name="asset" value={score.asset} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>흡연: <input type="checkbox" name="isSmoker" checked={score.isSmoker} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>MBTI: <input type="text" name="mbti" value={score.mbti} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>취미: <input type="text" name="hobby" value={score.hobby} onChange={handleChange} /></label>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>자녀 희망: <input type="checkbox" name="wantChild" checked={score.wantChild} onChange={handleChange} /></label>
              </div>
              <button type="submit" disabled={saving}>저장</button>
              {message && <span style={{ marginLeft: 12 }}>{message}</span>}
            </form>
          )}
        </>
      )}
    </div>
  );
} 