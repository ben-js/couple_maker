// ScoreHistory 모델 (DynamoDB용, 참고용)
module.exports = {
  user_id: 'string',
  created_at: 'string',
  before: 'object', // 이전 점수
  after: 'object',  // 변경 후 점수
  reason: 'string',
  manager_id: 'string',
}; 