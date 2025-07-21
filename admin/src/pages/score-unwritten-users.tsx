import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function ScoreUnwrittenUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users?hasScore=false')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(err => {
        setError('사용자 목록을 불러오지 못했습니다.');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>점수 미작성 사용자 목록</h2>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>이름</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>이메일</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{u.name}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{u.email}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{u.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 