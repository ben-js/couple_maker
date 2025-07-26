# Database Schema

## 🗄️ DynamoDB 테이블 구조

### **1. Users 테이블**
```javascript
{
  TableName: 'Users',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'email-index',
      KeySchema: [
        { AttributeName: 'email', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key (UUID)
  email: 'user1@test.com',           // GSI
  password: 'hashed_password',
  is_verified: false,
  has_profile: false,
  : false,
  grade: 'general',                  // general | excellent | gold | vip | vvip
  status: 'green',                   // green | yellow | red | black
  is_deleted: false,                 // 탈퇴 여부
  deleted_at: null,                  // 탈퇴일
  delete_reason: null,               // 탈퇴 사유
  points: 100,
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **2. Profiles 테이블**
```javascript
{
  TableName: 'Profiles',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key (Users와 동일)
  name: '김철수',
  birth_date: { year: 1995, month: 3, day: 15 },
  gender: '남',                      // 남 | 여
  height: '175cm',
  body_type: '평균',                 // 슬림 | 평균 | 근육질 | 통통
  job: '회사원',
  education: '대학교',               // 고등학교 | 전문대 | 대학교 | 대학원 | 박사
  region: { region: '서울', district: '강남구' },
  mbti: 'ENFP',
  interests: ['영화', '음악', '여행'],
  favorite_foods: ['피자', '파스타'],
  smoking: '비흡연',                 // 흡연 | 비흡연
  drinking: '음주',                  // 음주 | 비음주
  religion: '무교',                  // 무교 | 불교 | 천주교 | 기독교 | 기타
  children_desire: '자녀 희망',      // 딩크족 희망 | 자녀 희망 | 상관없음
  marriage_plans: '1-2년 내',       // 1년 내 | 1-2년 내 | 2-3년 내 | 3년 후 | 미정
  salary: '5천만원 ~ 7천만원',
  asset: '1억원 ~ 2억원',
  introduction: '안녕하세요! 김철수입니다.',
  photos: ['photo1.jpg', 'photo2.jpg'],
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **3. Preferences 테이블**
```javascript
{
  TableName: 'Preferences',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key
  age_range: { min: 25, max: 35 },
  height_range: { min: '160cm', max: '170cm' },
  regions: ['서울', '경기'],
  job_types: ['회사원', '자영업'],
  education_levels: ['대학교', '대학원'],
  body_types: ['슬림', '평균'],
  mbti_types: ['ENFP', 'INFJ'],
  interests: ['영화', '음악'],
  smoking: '비흡연',                 // 흡연 | 비흡연 | 상관없음
  drinking: '음주',                  // 음주 | 비음주 | 상관없음
  religion: '무교',                  // 무교 | 불교 | 천주교 | 기독교 | 기타 | 상관없음
  children_desire: '자녀 희망',      // 딩크족 희망 | 자녀 희망 | 상관없음
  marriage_plan: '1-2년 내',        // 1년 내 | 1-2년 내 | 2-3년 내 | 3년 후 | 미정
  salary: '5천만원 ~ 7천만원',
  asset: '1억원 ~ 2억원',
  priority: ['외모', '성격', '직업'], // 우선순위 배열
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **4. MatchingRequests 테이블**
```javascript
{
  TableName: 'MatchingRequests',
  KeySchema: [
    { AttributeName: 'request_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'request_id', AttributeType: 'S' },
    { AttributeName: 'user_id', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'user-index',
      KeySchema: [
        { AttributeName: 'user_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ]
}
```

**데이터 구조:**
```javascript
{
  request_id: 'req-123',             // Primary Key
  user_id: 'user_123',               // GSI
  status: 'waiting',                 // waiting | matched | confirmed | scheduled | completed | failed | finished
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z',
  photo_visible_at: '2024-12-15T17:30:00Z', // 사진 공개 시간
  is_manual: false,                  // 수동 매칭 여부
  date_choices: {                    // 사용자 일정/장소 선택
    dates: ['2024-12-15', '2024-12-16', '2024-12-17'],
    locations: ['강남역', '홍대역', '잠실역']
  },
  choices_submitted_at: '2024-12-01T10:00:00Z', // 일정 제출 시간
  final_date: '2024-12-15T18:00:00Z', // 최종 확정 일정
  final_location: '강남역 스타벅스', // 최종 확정 장소
  date_address: '서울 강남구 강남대로 396', // 데이트 장소 주소
  failure_reason: null,              // 실패 사유
  points_refunded: false,            // 포인트 반환 여부
  match_pair_id: 'match-123',        // 연결된 매칭 페어 ID
  partner_id: 'user_456'             // 상대방 사용자 ID
}
```

### **5. MatchPairs 테이블**
```javascript
{
  TableName: 'MatchPairs',
  KeySchema: [
    { AttributeName: 'match_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'match_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  match_id: 'match-123',             // Primary Key
  match_a_id: 'req-123',             // 매칭을 신청한 쪽 (MatchingRequests ID)
  match_b_id: 'req-456',             // 매칭된 상대방 (MatchingRequests ID)
  match_a_user_id: 'user_1'         // 매칭 신청한 user_id
  match_b_user_id: 'user_2'         // 매칭된 상대방 user_id
  is_proposed: true,                 // 매니저가 제안한 매칭 여부
  confirm_proposed: true,            // 제안 수락 여부
  attempt_count: 1,                  // 일정 조율 시도 횟수
  both_interested: true,             // 쌍방 재만남 의사 여부
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **6. Proposals 테이블**
```javascript
{
  TableName: 'Proposals',
  KeySchema: [
    { AttributeName: 'proposal_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'proposal_id', AttributeType: 'S' },
    { AttributeName: 'propose_user_id', AttributeType: 'S' },
    { AttributeName: 'target_id', AttributeType: 'S' },
    { AttributeName: 'match_pair_id', AttributeType: 'S' } // (GSI용)
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'propose-user-index',
      KeySchema: [
        { AttributeName: 'propose_user_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'target-user-index',
      KeySchema: [
        { AttributeName: 'target_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    },
    {
      IndexName: 'match-pair-index',
      KeySchema: [
        { AttributeName: 'match_pair_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ]
}
```

**데이터 구조:**
```javascript
{
  proposal_id: 'proposal-123',       // Primary Key
  proposer_id: 'manager-1',          // 제안한 매니저 id
  target_id: 'user_456',             // 제안 받은 유저 id
  propose_user_id: 'user_123',       // 제안받은 유저에게 제안된 상대방 유저 id
  match_pair_id: 'match-123',        // 연결된 match-pairs id (GSI)
  is_manual: true,                   // 수동 제안 여부
  status: 'accept',                  // pending | accept | refuse
  responded_at: '2024-12-01T10:00:00Z', // 응답 시간
  reason: '성향이 잘 맞을 것 같습니다', // 제안 사유
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T10:00:00Z'
}
```

**GSI(Global Secondary Index) 설명:**
- **propose-user-index**: propose_user_id로 조회 (특정 유저가 제안한 모든 proposal 빠른 조회)
- **target-user-index**: target_id로 조회 (특정 유저가 받은 proposal 빠른 조회)
- **match-pair-index**: match_pair_id로 조회 (특정 매칭쌍에 대한 proposal 빠른 조회, 수락/거절 처리에 사용)

### **7. Reviews 테이블**
```javascript
{
  TableName: 'Reviews',
  KeySchema: [
    { AttributeName: 'review_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'review_id', AttributeType: 'S' },
    { AttributeName: 'user_id', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'user-index',
      KeySchema: [
        { AttributeName: 'user_id', KeyType: 'HASH' }
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  ]
}
```

**데이터 구조:**
```javascript
{
  review_id: 'review-123',           // Primary Key
  match_id: 'match-123',             // 연결된 매칭 ID
  user_id: 'user_123',               // GSI (후기 작성자)
  target_id: 'user_456',             // 후기 대상자 ID
  rating: {                          // 평점 (1-5)
    appearance: 5,                   // 외모
    conversation: 4,                 // 대화력
    manners: 5,                      // 매너
    honesty: 4                       // 진정성
  },
  want_to_meet_again: true,          // 재만남 의사
  tags: ['친절함', '유머감각'],       // 긍정/부정 태그
  comment: '매우 만족스러운 소개팅이었습니다.', // 주관식 코멘트
  contact: '010-1234-5678',          // 입력한 연락처
  contact_shared_at: '2024-12-15T18:30:00Z', // 연락처 입력 시각
  // AI 인사이트를 위한 추가 필드들
  overall_satisfaction: 5,           // 전체 만족도 (1-5)
  date_duration: '1시간-2시간',       // 소개팅 지속 시간
  location_satisfaction: 4,          // 장소 만족도 (1-5)
  conversation_initiative: '비슷함',  // 대화 주도성 (나, 상대방, 비슷함)
  first_impression_vs_reality: '더 좋아짐', // 첫인상 vs 실제인상
  success_factors: ['대화', '외모'],  // 소개팅 성공/실패 요인
  created_at: '2024-12-15T19:00:00Z',
  updated_at: '2024-12-15T19:00:00Z'
}
```

### **8. ReviewStats 테이블**
```javascript
{
  TableName: 'ReviewStats',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key
  avg_appearance: 4.5,               // 평균 외모 평점
  avg_conversation: 4.2,             // 평균 대화력 평점
  avg_manners: 4.8,                  // 평균 매너 평점
  avg_honesty: 4.3,                  // 평균 진정성 평점
  // AI 인사이트를 위한 추가 통계
  avg_overall_satisfaction: 4.4,     // 평균 전체 만족도
  avg_location_satisfaction: 4.1,    // 평균 장소 만족도
  total_reviews: 10,                 // 총 리뷰 수
  positive_tags: ['친절함', '유머감각', '성숙함'], // 긍정 태그
  // 소개팅 패턴 분석
  date_duration_stats: {             // 지속 시간별 통계
    '30분 미만': 2,
    '30분-1시간': 3,
    '1시간-2시간': 4,
    '2시간 이상': 1
  },
  conversation_initiative_stats: {   // 대화 주도성별 통계
    '나': 3,
    '상대방': 2,
    '비슷함': 5
  },
  first_impression_stats: {          // 첫인상 vs 실제인상 통계
    '더 좋아짐': 6,
    '비슷함': 3,
    '실망': 1
  },
  success_factor_stats: {            // 성공 요인별 통계
    '대화': 8,
    '외모': 6,
    '매너': 7,
    '장소': 4
  },
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **9. UserStatusHistory 테이블**
```javascript
{
  TableName: 'UserStatusHistory',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },      // Primary Key
    { AttributeName: 'timestamp', KeyType: 'RANGE' }    // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key
  timestamp: '2024-12-01T10:00:00Z', // Sort Key
  from_status: 'green',              // 이전 상태
  to_status: 'yellow',               // 변경된 상태
  reason: '신고 접수',               // 상태 변경 사유
  updated_by: 'system',              // 변경한 관리자 ID (system: 자동 변경)
  created_at: '2024-12-01T10:00:00Z',
  updated_at: '2024-12-01T10:00:00Z'
}
```

### **10. PointHistory 테이블**
```javascript
{
  TableName: 'PointHistory',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },      // Primary Key
    { AttributeName: 'timestamp', KeyType: 'RANGE' }    // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key
  timestamp: '2024-12-01T10:00:00Z', // Sort Key
  type: 'charge',                    // signup | charge | ad | review_bonus | event | manual | matching_cost | refund
  points: 100,                       // 획득/차감 포인트 (양수: 획득, 음수: 차감)
  description: '포인트 충전',         // 포인트 변동 사유
  related_id: 'match-123',           // 관련 매칭/후기 ID
  balance: 200,                      // 잔액
  created_at: '2024-12-01T10:00:00Z',
  updated_at: '2024-12-01T10:00:00Z'
}
```

### **11. MatchingHistory 테이블**
```javascript
{
  TableName: 'MatchingHistory',
  KeySchema: [
    { AttributeName: 'match_pair_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'match_pair_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  match_pair_id: 'match-123',        // Primary Key
  match_a_id: 'req-123',             // 매칭을 신청한 쪽 (MatchingRequests ID)
  match_b_id: 'req-456',             // 매칭된 상대방 (MatchingRequests ID)
  contact_exchanged_at: '2024-12-15T18:30:00Z', // 연락처 교환 완료 시간
  final_status: 'exchanged',         // finished | exchanged
  finished_at: '2024-12-15T19:00:00Z', // 소개팅 완료 시간
  review_a: {                        // user-1의 리뷰 정보 (개인정보 보호를 위해 민감한 정보 제외)
    rating: { appearance: 5, conversation: 4, manners: 5, honesty: 4 },
    want_to_meet_again: true,
    tags: ['친절함', '유머감각']
  },
  review_b: {                        // user-2의 리뷰 정보
    rating: { appearance: 4, conversation: 5, manners: 4, honesty: 5 },
    want_to_meet_again: true,
    tags: ['성숙함', '대화력']
  },
  request_a: {                       // user-1의 매칭 요청 정보 (연락처, 일정 선택 등 민감 정보 제외)
    status: 'completed',
    final_date: '2024-12-15T18:00:00Z',
    final_location: '강남역 스타벅스'
  },
  request_b: {                       // user-2의 매칭 요청 정보
    status: 'completed',
    final_date: '2024-12-15T18:00:00Z',
    final_location: '강남역 스타벅스'
  },
  created_at: '2024-12-15T19:00:00Z', // 이력 생성 시간
  updated_at: '2024-12-15T19:00:00Z'  // 이력 수정 시간
}
```

### **12. NotificationSettings 테이블**
```javascript
{
  TableName: 'NotificationSettings',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key
  push_enabled: true,                // 푸시 알림 활성화 여부
  matching_notifications: true,      // 매칭 관련 알림
  schedule_notifications: true,      // 일정 관련 알림
  review_notifications: true,        // 후기 관련 알림
  marketing_notifications: false,    // 마케팅 알림
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **13. PushTokens 테이블**
```javascript
{
  TableName: 'PushTokens',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },      // Primary Key
    { AttributeName: 'device_id', KeyType: 'RANGE' }    // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'device_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: 'user_123',               // Primary Key
  device_id: 'device-123',           // Sort Key
  push_token: 'fcm-token-123',       // 디바이스 푸시 토큰
  platform: 'ios',                   // ios | android
  app_version: '1.0.0',              // 앱 버전
  device_model: 'iPhone 15',         // 디바이스 모델
  is_active: true,                   // 활성 상태
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

### **14. AdminLogs 테이블**
```javascript
{
  TableName: 'AdminLogs',
  KeySchema: [
    { AttributeName: 'log_id', KeyType: 'HASH' }  // Primary Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'log_id', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  log_id: 'log-123',                 // Primary Key
  admin_id: 'admin-1',               // 관리자 ID
  action: 'user_status_change',      // 수행한 액션
  target_type: 'user',               // user | matching | review | points
  target_id: 'user_123',             // 대상 ID
  details: {                         // 상세 정보
    from_status: 'green',
    to_status: 'yellow',
    reason: '신고 접수'
  },
  ip_address: '192.168.1.1',         // IP 주소
  created_at: '2024-12-01T10:00:00Z',
  updated_at: '2024-12-01T10:00:00Z'
}
```

### **15. Scores 테이블**
```javascript
{
  TableName: 'Scores',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },      // Partition Key
    { AttributeName: 'created_at', KeyType: 'RANGE' }   // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: '1bc37de4-ead1-4881-b8d3-2f6ac9637d63', // Partition Key
  appearance: 85,                                   // 외모 점수
  personality: 90,                                  // 성격 점수
  job: 80,                                          // 직업 점수
  education: 95,                                    // 학력 점수
  economics: 88,                                    // 경제력 점수
  average: 87.6,                                    // 평균 점수
  average_grade: 'B',                           // 등급
  scorer: 'manager_123',                            // 점수 입력/수정자
  summary: '최초 입력'                              // 점수 메모/사유
  created_at: '2025-07-20T01:34:50.677Z',           // Sort Key (ISO8601)
  updated_at: '2025-07-20T01:34:50.677Z',           // Sort Key (ISO8601)
}
```

### **16. ScoreHistory 테이블**
```javascript
{
  TableName: 'ScoreHistory',
  KeySchema: [
    { AttributeName: 'user_id', KeyType: 'HASH' },      // Partition Key
    { AttributeName: 'created_at', KeyType: 'RANGE' }   // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'user_id', AttributeType: 'S' },
    { AttributeName: 'created_at', AttributeType: 'S' }
  ]
}
```

**데이터 구조:**
```javascript
{
  user_id: '1bc37de4-ead1-4881-b8d3-2f6ac9637d63', // Partition Key
  created_at: '2025-07-21T10:00:00.000Z',           // Sort Key (ISO8601)
  face_score: 4.0,                                        // 변경 후 점수
  appearance: 85,
  personality: 90,
  job: 80,
  education: 95,
  economics: 88,
  average: 87.6,
  average_grade: 'silver'
  reason: '리뷰 반영 점수 조정',                     // 변경 사유
  manager_id: 'A'                         // 변경 관리자 ID
}
```

## 🔗 **테이블 관계**

- **Users** ↔ **Profiles**: 1:1 (user_id로 연결)
- **Users** ↔ **Preferences**: 1:1 (user_id로 연결)
- **Users** ↔ **MatchingRequests**: 1:N (user_id로 연결)
- **Users** ↔ **MatchPairs**: N:N (user_id로 연결)
- **Users** ↔ **Reviews**: 1:N (user_id로 연결)
- **Users** ↔ **PointHistory**: 1:N (user_id로 연결)
- **Users** ↔ **UserStatusHistory**: 1:N (user_id로 연결)
- **Users** ↔ **NotificationSettings**: 1:1 (user_id로 연결)
- **Users** ↔ **PushTokens**: 1:N (user_id로 연결)

## 📝 **주요 변경사항**

1. **Primary Key**: `email` → `user_id` (UUID)
2. **GSI**: `email-index`를 Users 테이블에만 추가
3. **일관성**: 모든 테이블이 `user_id`로 연결
4. **성능**: 이메일 변경 시 Users 테이블의 GSI만 업데이트하면 됨
5. **안정성**: user_id는 변경되지 않는 고유 식별자

## 🎯 **테이블 명칭 규칙**

### **일관성 있는 명칭 체계**
- **복수형 사용**: Users, Profiles, Preferences, Reviews 등
- **명확한 의미**: MatchingRequests, MatchPairs, PointHistory
- **간결함**: Preferences, Propose → Proposals
- **일관성**: 모든 테이블이 동일한 명명 규칙 따름

### **명칭 변경 사항**
| 기존 | 개선 | 이유 |
|------|------|------|
| Preferences | Preferences | 간결하고 명확 |
| Propose | Proposals | 복수형 일관성 |
| UserStatusHistory | UserStatusHistory | 유지 (명확함) |
| PointHistory | PointHistory | 유지 (명확함) |

## 🎯 **장점**

### **1. 성능 최적화**
- `user_id` 기반 조회는 PK로 직접 접근 가능
- 이메일 조회는 GSI를 통해서만 수행
- 비용 효율적인 구조

### **2. 데이터 일관성**
- 모든 테이블이 동일한 키 구조 사용
- 외래키 관계가 명확함
- 데이터 무결성 보장

### **3. 확장성**
- 이메일 변경 시 Users 테이블의 GSI만 업데이트
- 다른 테이블은 영향받지 않음
- 마이그레이션 비용 최소화

### **4. 보안**
- `user_id`는 예측 불가능한 UUID
- 이메일과 분리되어 개인정보 보호
- API 응답에서 user_id만 노출

## 🔒 **개인정보 보호 정책**

- **finished 상태**: 연락처 정보, 사진, 일정 선택 정보 등 민감한 개인정보 제외
- **히스토리 조회**: 기본 매칭 정보만 제공 (상대방 이름, 날짜, 장소, 상태)
- **데이터 보존**: 매칭 완료 후 3일간 보존 후 자동 삭제
- **API 응답**: 개인정보가 포함되지 않는 안전한 데이터만 반환 

## 🔄 **확장성 개선 방안**

### **1. 파티션 키 최적화**

#### **현재 구조 (개선 필요):**
```javascript
// Users 테이블
KeySchema: [
  { AttributeName: 'user_id', KeyType: 'HASH' }
]

// Reviews 테이블  
KeySchema: [
  { AttributeName: 'review_id', KeyType: 'HASH' }
]
```

#### **개선된 구조 (추천):**
```javascript
// Users 테이블 (날짜 기반 파티션)
KeySchema: [
  { AttributeName: 'created_date', KeyType: 'HASH' },    // YYYY-MM-DD
  { AttributeName: 'user_id', KeyType: 'RANGE' }
]

// Reviews 테이블 (날짜 기반 파티션)
KeySchema: [
  { AttributeName: 'review_date', KeyType: 'HASH' },     // YYYY-MM-DD
  { AttributeName: 'review_id', KeyType: 'RANGE' }
]

// MatchingRequests 테이블 (날짜 기반 파티션)
KeySchema: [
  { AttributeName: 'request_date', KeyType: 'HASH' },    // YYYY-MM-DD
  { AttributeName: 'request_id', KeyType: 'RANGE' }
]
```

### **2. GSI (Global Secondary Index) 최적화**

#### **사용자별 조회용 GSI:**
```javascript
// Users 테이블
GlobalSecondaryIndexes: [
  {
    IndexName: 'user-email-index',
    KeySchema: [
      { AttributeName: 'email', KeyType: 'HASH' }
    ],
    Projection: { ProjectionType: 'ALL' }
  },
  {
    IndexName: 'user-status-index',
    KeySchema: [
      { AttributeName: 'status', KeyType: 'HASH' },
      { AttributeName: 'created_date', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'INCLUDE', NonKeyAttributes: ['user_id', 'email', 'grade'] }
  }
]
```

#### **매칭 상태별 조회용 GSI:**
```javascript
// MatchingRequests 테이블
GlobalSecondaryIndexes: [
  {
    IndexName: 'user-requests-index',
    KeySchema: [
      { AttributeName: 'user_id', KeyType: 'HASH' },
      { AttributeName: 'request_date', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'ALL' }
  },
  {
    IndexName: 'status-date-index',
    KeySchema: [
      { AttributeName: 'status', KeyType: 'HASH' },
      { AttributeName: 'request_date', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'INCLUDE', NonKeyAttributes: ['user_id', 'request_id'] }
  }
]
```

### **3. TTL (Time To Live) 설정**

#### **자동 삭제가 필요한 테이블:**
```javascript
// 임시 데이터 (24시간 후 삭제)
{
  ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
}

// 매칭 요청 (7일 후 삭제)
{
  ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
}

// 채팅 메시지 (30일 후 삭제)
{
  ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
}
```

### **4. 데이터 아카이빙 전략**

#### **단계별 데이터 관리:**
```javascript
// 1단계: 활성 데이터 (최근 3개월)
// 2단계: 아카이브 데이터 (3개월-1년)
// 3단계: 백업 데이터 (1년 이상)
```

#### **아카이브 테이블 구조:**
```javascript
// Users_Archive 테이블
{
  TableName: 'Users_Archive',
  KeySchema: [
    { AttributeName: 'archive_year', KeyType: 'HASH' },  // 2024, 2023, ...
    { AttributeName: 'user_id', KeyType: 'RANGE' }
  ]
}
```

### **5. 캐싱 전략**

#### **Redis 캐시 구조:**
```javascript
// 사용자 프로필 캐시 (1시간)
`user:profile:${userId}` -> JSON

// 매칭 상태 캐시 (5분)
`matching:status:${userId}` -> JSON

// 인기 지역 캐시 (24시간)
`stats:popular:regions` -> JSON

// 실시간 통계 캐시 (1분)
`stats:realtime:${date}` -> JSON
```

### **6. 모니터링 및 알림**

#### **CloudWatch 메트릭:**
```javascript
// DynamoDB 메트릭
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- ThrottledRequests
- UserErrors

// S3 메트릭
- NumberOfObjects
- BucketSizeBytes
- AllRequests

// API Gateway 메트릭
- Count
- Latency
- 4XXError
- 5XXError
```

### **7. 비용 최적화**

#### **S3 수명주기 정책:**
```javascript
// 프로필 사진
- 30일 후: IA (Infrequent Access)
- 90일 후: Glacier
- 1년 후: Deep Archive

// 임시 파일
- 24시간 후: 삭제

// 채팅 이미지
- 7일 후: 삭제
```

#### **DynamoDB 온디맨드 vs 프로비저닝:**
```javascript
// 개발/테스트 환경: 온디맨드
// 프로덕션 환경: 프로비저닝 + Auto Scaling
```

## 🎯 **구현 우선순위**

### **1단계 (즉시 적용):**
- [x] S3 날짜 기반 경로 구조
- [ ] DynamoDB TTL 설정
- [ ] 기본 GSI 최적화

### **2단계 (1주 내):**
- [ ] Redis 캐싱 도입
- [ ] CloudWatch 모니터링
- [ ] S3 수명주기 정책

### **3단계 (1개월 내):**
- [ ] 데이터 아카이빙 시스템
- [ ] 자동 백업 시스템
- [ ] 비용 최적화 완료 

## Scores (점수 이력)
- user_id (string, PK): 사용자 ID
- created_at (string, SK): 점수 생성일(ISO8601)
- appearance (number): 외모 점수
- personality (number): 성격 점수
- job (number): 직업 점수
- education (number): 학력 점수
- economics (number): 경제력 점수
- average (number): 평균 점수
- average_grade (string): 등급
- scorer (string): 점수 입력/수정자
- summary (string): 점수 메모/사유

## ScoreHistory (점수 변경 이력)
- user_id (string, PK): 사용자 ID
- created_at (string, SK): 변경일(ISO8601)
- before (object): 변경 전 점수
- after (object): 변경 후 점수
- reason (string): 변경 사유
- manager_id (string): 변경 관리자 ID 