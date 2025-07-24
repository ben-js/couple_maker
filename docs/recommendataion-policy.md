# 추천 알고리즘 정책 (실행/구현 기준)

## 1. 추천 트리거 및 흐름

- 매니저가 매칭 관리 페이지에서 `MatchingRequests.status = waiting`인 신청자를 선택 → 상세 페이지 진입 → "추천" 버튼 클릭 시 추천 알고리즘 실행
- 추천 결과는 `MatchingRecommendations` 테이블에 저장

---

## 2. 추천 후보군 선정 단계

### 1차: DB 필터링 (기본/이상형/이력)

#### 1) 기본 필터
- Users 테이블에서
  - `has_score = true`
  - `status` in ['green', 'yellow']
  - `is_deleted = false`

#### 2) 이상형 조건 필터
- 신청자와 **성별이 다름**
- 신청자 이상형(Preferences) 조건에 부합
  - 나이: 이상형 나이 범위 내
  - 지역: 이상형 지역 포함
  - 키: 이상형 키 범위 내
  - 종교: 이상형 종교 조건 포함

#### 3) 매칭/거절 이력 필터
- **매칭 상태**
  - MatchingRequests.status = waiting 인 유저
  - 또는 MatchingRequests에 없는 유저(아직 신청 안 한 유저)
- **매칭 이력**
  - 신청자와 MatchPairs 이력이 없는 유저
    - (match_a_id = 신청자 id, match_b_id ≠ 후보 id) AND (match_b_id = 신청자 id, match_a_id ≠ 후보 id)
- **거절 이력**
  - Proposals 테이블에서 propose_user_id = 신청자 id, status ≠ refuse 인 유저만

---

### 2차: 등급별 후보군 분류

- 신청자 평균점수 → 등급 산출 (예: S, A, B, C, D, E, F)
- 등급별로 후보군 분리
  - **상위 등급**: 신청자보다 한 단계 위 등급 (VIP/구독자는 두 단계 위까지)
  - **동일 등급**: 신청자와 동일 등급
  - **하위 등급**: 신청자보다 한 단계 아래 등급
- **추천 인원**
  - 상위: 3명
  - 동일: 4명
  - 하위: 3명
  - (부족하면 해당 인원만)

---

### 3차: 우선순위 점수 계산

- 신청자 이상형 우선순위(Preferences.priority) 기준
  - 1순위: 40%
  - 2순위: 30%
  - 3순위: 20%
  - 4순위: 10%
- 각 우선순위 항목별로 후보의 등급 점수 매핑
  - 외모: appearance 등급
  - 직업: job 등급
  - 성격: personality 등급
  - 학력: education 등급
  - 경제력: economics 등급
- **등급별 점수**
  - S: 100, A: 90, B: 80, C: 60, D: 40, E: 20, F: 10
- **최종 점수 계산**
  - (각 항목 등급 점수 × 우선순위 가중치) 합산

---

### 4차: 등급별 후보군 내 정렬/동점자 처리

- 등급별로 점수 내림차순 정렬
- 동점자 발생 시
  - 최근 매칭 이력, 활동성, 가입일 등 추가 기준으로 우선순위 결정

---

### 5차: 추천 결과 저장

- 추천된 후보군을 `MatchingRecommendations` 테이블에 저장
  - request_id, recommended_user_id, recommendation_count, compatibility_score, personal_score, final_score, rank, created_at, updated_at

---

### 6차: 재추천/조건 완화

- 추천/재추천 시 이미 추천된 유저는 제외
- 추천 인원이 10명 미만이면 조건을 점진적으로 완화
  - 나이/키 범위 확대, 인접 지역 포함 등
- 완화해도 부족하면 가능한 만큼만 추천
- 최종적으로도 부족하면 매니저에게 "매칭 대상자 부족" 알림

---

## 3. 테이블 구조

### MatchingRecommendations 테이블 구조

#### 테이블 스키마
```javascript
{
  TableName: 'MatchingRecommendations',
  KeySchema: [
    { AttributeName: 'request_id', KeyType: 'HASH' },  // Primary Key
    { AttributeName: 'recommended_user_id', KeyType: 'RANGE' }  // Sort Key
  ],
  AttributeDefinitions: [
    { AttributeName: 'request_id', AttributeType: 'S' },
    { AttributeName: 'recommended_user_id', AttributeType: 'S' }
  ]
}
```

#### 데이터 구조
```javascript
{
  request_id: 'req_123',              // 매칭 신청 ID
  recommended_user_id: 'user_456',     // 추천된 사용자 ID
  recommendation_count: 1,             // 재추천 횟수
  rank: 3,                             // 추천 순위 (1~10)
  created_at: '2024-12-01T00:00:00Z',
  updated_at: '2024-12-01T00:00:00Z'
}
```

---

## 4. 등급/점수/가중치 상수

- **등급별 점수**:  
  S: 100, A: 90, B: 80, C: 60, D: 40, E: 20, F: 10
- **우선순위 가중치**:  
  1순위: 0.4, 2순위: 0.3, 3순위: 0.2, 4순위: 0.1

---

## 5. 예외/특이사항

- VIP/구독자는 상위 등급 범위를 두 단계까지 확장
- 추천/재추천 시 이미 추천된 유저는 제외
- 동점자 처리 기준은 서비스 정책에 따라 추가 가능

---

## 6. 전체 흐름 요약

1. 신청자 정보 조회
2. 1차 DB 필터링 (기본/이상형/이력)
3. 2차 등급별 후보군 분류 (상위/동일/하위)
4. 3차 우선순위 점수 계산
5. 4차 등급별 후보군 내 정렬/동점자 처리
6. 추천 결과 저장
7. 인원 부족 시 조건 완화 및 재추천