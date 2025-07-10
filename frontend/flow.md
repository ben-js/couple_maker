## 🎯 바이브 코딩을 위한 전체 유저 스토리 기반 플로우 (User Journey + 개발 조건 완비)

---

### 🔹 \[1] 앱 진입 및 인증 흐름

```
[앱 실행]
  → 로딩 페이지 (0.5초)
  → 온보딩 페이지로 자동 이동
    → [시작하기] 버튼 클릭 시 → 로그인/회원가입 선택 페이지

[회원가입]
  - 이메일, 비밀번호 입력
  - 인증 메일 전송 (유저 ID 포함된 URL)
  - 인증 전 고객 → 로그인 시 '인증 필요' 안내 페이지로 이동
  - 인증 메일 클릭 시 → is_verified: true 갱신

[로그인 분기 처리]
  → is_verified === false → 인증 안내
  → is_verified === true:
      → 프로필 작성 여부 확인
         → 미작성: 프로필 작성 페이지
         → 작성 완료:
             → 이상형 작성 여부 확인
                 → 미작성: 이상형 작성 페이지
                 → 완료: 메인 페이지 진입
```

---

### 🔹 \[2] 메인 페이지 기능

```
[메인 화면 탭 구성]
- 내 정보 (등급, 상태, 보유 포인트 등)
- 소개팅 신청 버튼
- 콘텐츠 (소개팅/패션/대화 팁, 데이트 장소 추천)
- 포인트 충전 / 광고 보기 버튼
- 지난 소개팅 이력 / 후기 보기
```

---

### 🔹 \[3] 소개팅 신청 & 포인트 흐름

```
[소개팅 신청 버튼 클릭]
  → 유저의 보유 포인트 확인
     - < 100: 충전 페이지로 이동
     - >= 100: 신청 진행
        → 포인트 -100 차감
        → MatchingRequests 테이블 기록 생성
        → 상태: waiting
```

---

### 🔹 \[4] 매니저 매칭 프로세스 (관리자 영역)

```
[관리자 콘솔 기능]
- 신청자 리스트 확인 가능
- 조건: 신청자 + 상대 성별, 등급 높은 순으로 10명 후보 제공
   - 블랙 상태 회원은 제외

[매니저 동작]
- 수동 매칭: 10명 중 선택 → 매칭 준비 상태로 전환
- 자동 매칭: AI 추천 기반 1명 자동 선택
- 임의 매칭: 신청하지 않은 유저에게도 매칭 가능
  → 해당 유저에게 "소개팅 제안 도착" 푸시 발송
```

---

### 🔹 \[5] 프로필 카드 전달 후 양측 응답 플로우

```
[매칭 확정 → 프로필 카드 발송]
- 사진 비공개 상태 (photo_visible_at 설정 전)
- 유저는 아래 입력
    - 약속 가능 날짜 3개
    - 선호 지역 3개

[응답 완료 → 소개팅 준비 상태로 전환]
```

---

### 🔹 \[6] 소개팅 확정 및 장소 선택

```
[관리자 확인]
  → 장소 자동 추천 or 수동 지정
  → final_date + location 확정
  → 사진 공개 시점: 약속일 오전 9시 설정
  → 소개팅 티켓 고객에게 발송
```

---

### 🔹 \[7] 소개팅 당일

```
[오전 9시]
  → 푸시 알림: "오늘 소개팅이 있습니다!"
  → 프로필 카드에서 사진 공개 버튼 활성화
```

---

### 🔹 \[8] 소개팅 후 후기 & 리뷰 흐름

```
[리뷰 작성 요청 푸시]
  → 후기 작성 페이지 이동
    - 항목: 외모, 대화력, 매너, 진정성, 재만남 의사, 긍/부정 태그, 주관식 코멘트

[후기 저장 시]
  → ReviewStats 갱신
  → VIP 등급 자동 업데이트
  → 후기 우수자: 관리자 수동 포인트 보상 가능
```

---

### 🔹 \[9] 에프터 연락처 교환 조건

```
[후기 중 '다시 만나고 싶은가요?' → YES 선택]
  - 쌍방 YES → 연락처 자동 공개
  - 단방향 or NO → 공유되지 않음
```

---

### 🔹 \[10] 소개팅 실패 시 예외 처리

```
[성사 실패 조건]
- 한쪽 응답 없음
- 양측 시간 미일치
→ 포인트 100 반환
→ MatchingRequests 상태: failed
```

---

### 🔹 \[11] 등급 / 상태 정책 (포인트 제어 포함)

```
[포인트 정책]
- 회원가입 시 기본 100 지급
- 1회 매칭 = -100
- 포인트 획득 경로:
    - 유료 결제
    - 광고 보기
    - 출석 체크
    - 이벤트 참여
    - 리뷰 작성 우수 보상

[등급 레벨]
- 일반 / 우수 / gold / vip / vvip
- 기준: 후기 평점, 신고율, 후기 작성율 등

[상태 레벨]
- green: 전체 기능 가능
- yellow: 전체 기능 가능
- red: 신청 불가 (수락만 가능)
- black: 모든 기능 불가 (포인트 적립도 불가)

[블랙/레드 등록 시]
- 관리자 사유 + 일시 저장 (UserStatusHistory)
- 레드로 승격 시 활동 일부 가능
```

---

### 🔹 \[12] 기타 차별화 요소

```
[연락처 공유 최소화 설계]
- 소개팅 전: 연락처 공유 X
- 후기 기반 매칭 후 → 쌍방 YES 시에만 연락처 공유

[다른 앱과의 차별점]
- 얼굴 먼저 고르기 → X
- 매칭 실패 → 없음, 반드시 오프라인 소개팅 제공
- 후기 기반 평가와 AI/매니저 매칭 혼합
- 후기 꼼꼼히 작성 시 포인트 보상
- 콘텐츠 학습(소개팅 팁, 대화법 등) 제공
```

---

### 🔹 \[13] 현재 개발 완료 상태 (2024-07-05)

#### ✅ 완료된 기능들

**[인증 시스템]**
- 회원가입/로그인 API 구현
- camelCase ↔ snake_case 자동 변환
- AsyncStorage 기반 로그인 상태 유지
- 로그아웃 시 로컬 데이터 삭제

**[프로필 관리]**
- 프로필 작성/수정 화면 구현
- 동적 폼 렌더링 (profileForm.json 기반)
- 이미지 업로드/크롭 기능
- 기존 프로필 데이터 자동 로딩 (수정 모드)
- 프로필 정보 표시 (마이페이지)

**[이상형 관리]**
- 이상형 작성/수정 화면 구현
- 동적 폼 렌더링 (preferenceForm.json 기반)
- 다중 선택 (chips, range slider 등)
- 지역 선택 모달

**[카드함 시스템]**
- 카드 목록 조회 API 연동
- 카드 클릭 시 상세 프로필 정보 화면 이동
- 탈퇴한 회원 카드 비활성화 처리
- 검색 기능 (이름, 직업, 지역)
- 상태별 필터링 (전체, 대기 중, 공개됨, 만료됨)
- 실시간 필터링 및 결과 카운트
- 빈 상태 처리 (카드 없음, 검색 결과 없음)

**[데이터 관리]**
- 백엔드 JSON 파일 기반 데이터 저장
- 빌드 데이터 동기화 자동화
- 날짜별 로그 시스템
- 에러 처리 및 로깅

**[네비게이션]**
- 온보딩 → 로그인 → 프로필 → 이상형 → 메인 플로우
- 로그인 상태에 따른 화면 분기 처리
- 프로필/이상형 작성 완료 여부에 따른 분기

#### 🔄 개발 중인 기능들

**[매칭 시스템]**
- 소개팅 신청 API (구현됨)
- 매칭 요청 관리 (구현됨)
- 매칭 확정/선택 UI (미구현)

**[리뷰 시스템]**
- 리뷰 작성 API (구현됨)
- 리뷰 통계 관리 (구현됨)
- 리뷰 작성 UI (미구현)

**[포인트 시스템]**
- 포인트 차감/적립 API (구현됨)
- 포인트 히스토리 관리 (구현됨)
- 포인트 충전 UI (미구현)

#### 📋 기술 스택

**[프론트엔드]**
- React Native + Expo
- TypeScript
- React Hook Form + Yup
- React Navigation
- AsyncStorage
- Expo Image Picker/Manipulator

**[백엔드]**
- Node.js + TypeScript
- Serverless Framework
- AWS Lambda (로컬: serverless-offline)
- JSON 파일 기반 데이터 저장
- RESTful API (kebab-case URL)

**[개발 도구]**
- Cursor IDE
- Git + GitHub
- Jest 테스트
- 로깅 시스템

#### 🎯 다음 개발 우선순위

1. **매칭 UI 구현** - 소개팅 신청/확정 화면
2. **리뷰 UI 구현** - 후기 작성/조회 화면  
3. **포인트 UI 구현** - 충전/사용 내역 화면
4. **채팅 기능** - 매칭된 상대와 대화
5. **푸시 알림** - 소개팅 일정 알림
6. **DynamoDB 마이그레이션** - 실제 데이터베이스 연동

---

# 🗃️ Couple Maker - DynamoDB 스키마 명세

소개팅 앱에 필요한 주요 테이블 및 속성 정의입니다.

---

## 📄 Users Table

* `PK`: user_id (string)
* Attributes:

  * email: (string)
  * password: (string)
  * is_verified: (boolean)
  * has_profile: (boolean)
  * has_preferences: (boolean)
  * grade: general | excellent | gold | vip | vvip
  * status: green | yellow | red | black
  * points: (number)
  * created_at: (ISO8601 string)

---

## 📄 UserProfiles Table

* `PK`: user_id (string)
* Attributes:

  * name: (string)
  * birth_date: { year: number, month: number, day: number }
  * gender: 남 | 여
  * height: (string)
  * body_type: 슬림 | 평균 | 근육질 | 통통
  * job: (string)
  * education: 고등학교 | 전문대 | 대학교 | 대학원 | 박사
  * region: { region: string, district: string }
  * mbti: (string)
  * interests: (list of strings)
  * favorite_foods: (list of strings)
  * smoking: 흡연 | 비흡연
  * drinking: 음주 | 비음주
  * religion: 무교 | 불교 | 천주교 | 기독교 | 기타
  * marital_status: 미혼 | 이혼 | 사별
  * has_children: 없음 | 있음
  * marriage_plans: 1년 내 | 1-2년 내 | 2-3년 내 | 3년 후 | 미정
  * introduction: (string)
  * photos: (list of S3 urls)

---

## 📄 Preferences Table

* `PK`: user_id (string)
* Attributes:

  * age_range: [min: number, max: number]
  * height_range: [min: number, max: number]
  * regions: (list of strings)
  * job_types: (list of strings)
  * education_levels: (list of strings)
  * body_types: (list of strings)
  * mbti_types: (list of strings)
  * hobbies: (list of strings)
  * smoking: 흡연 | 비흡연 | 상관없음
  * drinking: 음주 | 비음주 | 상관없음
  * religion: 무교 | 불교 | 천주교 | 기독교 | 기타 | 상관없음
  * children_desire: 딩크족 희망 | 자녀 희망 | 상관없음
  * marriage_plan: 1년 내 | 1-2년 내 | 2-3년 내 | 3년 후 | 미정

---

## 📄 MatchingRequests Table

* `PK`: match_id (string)
* Attributes:

  * requester_id: (string)
  * status: waiting | propose | matched | confirmed | scheduled | failed
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)
  * photo_visible_at: (ISO8601 string|null)
  * is_manual: (boolean)
  * date_choices: { dates: [string], locations: [string] }

---

## 📄 MatchPairs Table

* `PK`: match_pair_id (string)
* Attributes:

  * match_a_id: (string) // 매칭을 신청한 쪽
  * match_b_id: (string) // 매칭된 상대방
  * is_manual: (boolean)
  * is_proposed: (boolean) // 매니저가 제안한 매칭 여부
  * confirm_proposed: (boolean) // 제안 수락 여부
  * user_a_choices: { dates: [string], locations: [string] }
  * user_b_choices: { dates: [string], locations: [string] }
  * schedule_date: (string|null) // 최종 확정 일정
  * date_location: (string|null) // 최종 확정 장소
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)

---

## 📄 Propose Table

* `PK`: propose_id (string)
* Attributes:

  * proposer_id: (string) // 제안한 매니저 id
  * target_id: (string) // 제안 받은 유저 id
  * match_pair_id: (string) // 연결된 match-pairs id
  * status: propose | refuse
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)

---

## 📄 Reviews Table

* `PK`: review_id (string)
* Attributes:

  * match_id: (string)
  * reviewer_id: (string)
  * target_id: (string)
  * rating: { appearance: number, conversation: number, manners: number, honesty: number }
  * want_to_meet_again: (boolean)
  * tags: (list of strings)
  * comment: (string)
  * created_at: (ISO)

---

## 📄 ReviewStats Table

* `PK`: user_id (string)
* Attributes:

  * avg_appearance: (number)
  * avg_conversation: (number)
  * avg_manners: (number)
  * avg_honesty: (number)
  * total_reviews: (number)
  * positive_tags: (list)

---

## 📄 UserStatusHistory Table

* `PK`: user_id (string)

* SK: timestamp (ISO string)
* Attributes:

  * from_status: (string)
  * to_status: (string)
  * reason: (string)
  * updated_by (string)

---

## 📄 PointsHistory Table

* `PK`: user_id (string)

  * SK: timestamp (ISO string)
* Attributes:

  * type: signup | charge | ad | review\_bonus | event | manual
  * points: (number)
  * description: (string)

## 이상형 입력/수정/소개팅 신청 Flow 정책

1. **이상형 입력(최초)**
   - 사용자가 이상형 정보를 한 번도 입력하지 않은 경우
   - PreferenceEditScreen에서 필수 조건(나이, 지역, 성별 등) 입력 후 저장
   - 저장 시 user-preferences API만 호출, 신청은 별도

2. **이상형 수정**
   - 이미 입력된 이상형 정보를 수정하는 경우
   - PreferenceEditScreen에서 기존 값 수정 후 저장
   - 저장 시 user-preferences API만 호출, 신청은 별도

3. **소개팅 신청**
   - 이상형 정보가 입력된 상태에서 “지금 소개팅 신청하기” 클릭
   - 이상형 정보 확인(필요시 수정) 후, matching-request API 호출
   - 신청 성공 시 매칭 상태(currentStep) 0(신청완료)로 변경
   - “신청이 완료되었습니다” 안내 및 매칭 진행 바 노출
