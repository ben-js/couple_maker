## 🎯 바이브 코딩을 위한 전체 유저 스토리 기반 플로우 (User Journey + 개발 조건 완비)

### 📊 전체 매칭 플로우 다이어그램

```
[소개팅 신청] → [매니저 매칭] → [매칭 성사] → [일정/장소 선택]
                                                    ↓
[소개팅 확정] ← [관리자 확인] ← [일정 매칭] ← [자동 매칭 검사]
                                                    ↓
[소개팅 진행] → [후기 작성] → [연락처 교환] → [소개팅 종료]
                                                    ↓
[히스토리 저장] ← [자동 삭제] ← [3일 대기]
```

### 🔄 일정 매칭 플로우 상세

```
[첫 번째 사용자] → 일정/장소 선택 → 상태: matched
[두 번째 사용자] → 일정/장소 선택 → 자동 매칭 검사
                                                    ↓
[일정 겹침] → 상태: confirmed → 관리자 확인 → 소개팅 확정
[일정 안 겹침] → 상태: mismatched → 재선택 → 다시 매칭 검사
```

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
[데이터 구조 원칙]
- MatchingRequests: 사용자당 1개만 존재 (현재 진행 중인 매칭)
- Propose: 매니저 제안 내역 (수락/거절 이력 포함)
- MatchPairs: 매칭 성사된 페어 정보
- History: 완료된 매칭 이력

[매칭 상태 정의]
- waiting: 소개팅 신청 완료, 매칭 대기 중
- propose: 매니저 제안 도착, 수락/거절 대기
- matched: 매칭 성사, 일정/장소 선택 대기
- mismatched: 일정/장소가 맞지 않음, 재선택 필요
- confirmed: 일정/장소 확정, 관리자 최종 확인 대기
- scheduled: 소개팅 일정 확정, 사진 공개 대기
- review: 소개팅 완료, 후기 작성 대기
- completed: 후기 작성 완료, 연락처 교환 가능
- exchanged: 연락처 교환 완료
- finished: 소개팅 종료, 연락처 삭제됨
- failed: 매칭 실패, 포인트 반환

[관리자 콘솔 기능]
- 신청자 리스트 확인 가능
- 조건: 신청자 + 상대 성별, 등급 높은 순으로 10명 후보 제공
   - 블랙 상태 회원은 제외
   - Propose 테이블에서 거절 이력 확인 가능

[매니저 동작]
- 수동 매칭: 10명 중 선택 → 매칭 준비 상태로 전환
- 자동 매칭: AI 추천 기반 1명 자동 선택
- 임의 매칭: 신청하지 않은 유저에게도 매칭 가능
  → 해당 유저에게 "소개팅 제안 도착" 푸시 발송

[매니저 제안 시나리오]
1. user-1이 소개팅 신청 → matching-requests.json에 waiting 상태로 등록
2. 매니저가 user-2에게 제안 → propose.json에 제안 내용 등록
3. user-2 → Propose 테이블에서 제안 확인 (MatchingRequests는 변경 없음)
4. match-pairs.json에 매칭 정보 등록 (r값 포함)

[user-2 로그인 후 처리]
- 홈 화면에서 "매니저에게로부터 소개팅 제안이 왔습니다. 소개팅을 받으시겠습니까?" 모달 표시
- Propose 테이블에서 pending 상태 제안 조회

[예(수락) 선택 시]
- propose.json: 해당 제안 상태를 accept로 변경
- matching-requests.json: user-1 상태를 matched로 변경
- user-2의 matching-requests.json에 새 요청 생성 (matched 상태)
- match-pairs.json: 상태 유지

[아니오(거절) 선택 시]
- propose.json: 제안 상태를 refuse로 변경
- matching-requests.json: user-1 상태 유지 (다른 매칭 시도 가능)
- match-pairs.json: 상태를 finished로 변경
```

---

### 🔹 \[5] 프로필 카드 전달 후 양측 응답 플로우

```
[매칭 확정 → 프로필 카드 발송]
- 사진 비공개 상태 (photo_visible_at 설정 전)
- 유저는 아래 입력
    - 약속 가능 날짜 3개
    - 선호 지역 3개

[일정/장소 선택 플로우]
1. 첫 번째 사용자가 일정/장소 선택 → 상태: matched (상대방 대기)
2. 두 번째 사용자가 일정/장소 선택 → 자동 매칭 검사

[자동 매칭 검사 로직]
- 양측 일정/장소 비교
- 겹치는 날짜 AND 겹치는 장소가 있으면 → confirmed 상태로 전환
- 겹치는 일정이 없으면 → mismatched 상태로 전환

[mismatched 상태 처리]
- 상대방이 선택한 일정/장소 표시 (빨간색 배경, ⚠️ 아이콘)
- "일정이 맞지 않습니다. 다른 일정을 선택해주세요." 메시지
- 일정 선택 초기화 후 재선택 가능
- 재선택 시 다시 매칭 검사 진행

[응답 완료 → 소개팅 준비 상태로 전환]
- 양측 일정이 매칭되면 → confirmed 상태로 전환
- 한쪽만 선택 완료 시 → matched 상태 유지
- 7일 내 미응답 시 → 매칭 실패 처리 (포인트 반환)

[일정 매칭 API]
- POST /submit-choices: 일정/장소 제출 및 매칭 검사
- 요청 데이터: { match_id, user_id, dates, locations }
- 응답: { ok: true, status: 'matched'|'confirmed'|'mismatched', message }
- 로깅: 매칭 결과, 겹치는 일정, 최종 상태
```

---

### 🔹 \[6] 소개팅 확정 및 장소 선택

```
[관리자 확인]
  → 장소 자동 추천 or 수동 지정
  → final_date + location 확정
  → 사진 공개 시점: 약속일 30분 전 설정 (photo_visible_at)
  → 소개팅 티켓 고객에게 발송
  → 상태를 scheduled로 변경

[자동 장소 추천]
  - 양측 선호 지역 중 겹치는 지역 우선 선택
  - 없을 경우 중간 지점 추천
  - 최종 확정은 관리자가 수동으로 진행

[관리자 API]
  - POST /finalize-matching: confirmed → scheduled 상태 전환
  - 요청 데이터: { match_pair_id, final_date, final_location, photo_visible_at }
```

---

### 🔹 \[7] 소개팅 당일

```
[소개팅 30분 전]
  → 푸시 알림: "소개팅 30분 전입니다! 상대방 프로필을 확인해보세요."
  → 프로필 카드에서 사진 공개 버튼 활성화
  → photo_visible_at 시간이 되면 사진 자동 공개

[사진 공개]
  - photo_visible_at 시간 도달 시 사진 자동 공개
  - 공개 전까지는 기본 아바타만 표시
  - 공개 후에는 실제 프로필 사진 표시
```

---

### 🔹 \[8] 소개팅 후 후기 & 리뷰 흐름

```
[리뷰 작성 요청 푸시]
  → 후기 작성 페이지 이동
    - 항목: 외모, 대화력, 매너, 진정성, 재만남 의사, 긍/부정 태그, 주관식 코멘트
    - AI 인사이트용 추가 항목: 전체 만족도, 소개팅 지속 시간, 장소 만족도, 대화 주도성, 첫인상 vs 실제인상, 소개팅 성공/실패 요인

[후기 저장 시]
  → ReviewStats 갱신
  → VIP 등급 자동 업데이트
  → 후기 우수자: 관리자 수동 포인트 보상 가능
  → 매칭 상태를 completed가 아니라 review로 변경
  → review 상태에서는 매칭 진행 상황(스텝바 등)과 작성한 리뷰 카드가 모두 계속 보임
  → 리뷰 카드 클릭 시, 작성한 리뷰 내역이 읽기 전용으로 노출됨
```

---

### 🔹 \[9] 에프터 연락처 교환 조건

```
[후기 중 '다시 만나고 싶은가요?' → YES 선택]
  - 쌍방 YES → 연락처 교환 가능 상태 (completed)
  - 단방향 or NO → 공유되지 않음
  - 연락처 교환 완료 후 매칭 상태를 exchanged로 변경
  - review 상태에서 연락처 공개 조건이 충족되면 completed로 전환

[연락처 교환 플로우]
  1. user-1이 연락처 입력 → "연락처를 보냈습니다" 메시지 표시
  2. user-2가 연락처 입력 → 양쪽 모두 연락처 입력 완료
  3. 상태가 exchanged로 변경 → "연락처가 도착했습니다" 카드 표시
  4. 연락처 확인 버튼 클릭 → ContactDetailScreen으로 이동

[연락처 교환 API]
  - POST /reviews/contact: 연락처 저장 및 교환 처리
  - 요청 데이터: { match_id, reviewer_id, contact }
  - 응답: { ok: true }
  - 양쪽 모두 연락처 입력 시 자동으로 status를 exchanged로 변경

[연락처 상세 조회 API]
  - GET /contact-detail: 상대방 연락처 및 프로필 정보 조회
  - 요청 파라미터: { matchId }
  - 응답: { contact, profile }

[UI 상태별 표시]
  - matched: 일정/장소 선택 UI (파란색 배경, 💡 아이콘)
  - mismatched: 일정/장소 재선택 UI (빨간색 배경, ⚠️ 아이콘)
  - confirmed: "일정 확정!" 알림
  - completed + contactReady + !hasSentContact: "연락처 교환하기" (활성)
  - completed + contactReady + hasSentContact: "연락처를 보냈습니다" (비활성)
  - exchanged: "연락처가 도착했습니다" (빨간색 heart 아이콘)
```

---

### 🔹 \[10] 소개팅 종료 및 연락처 삭제 플로우

```
[연락처 확인 화면 (ContactDetailScreen)]
  - 상대방 프로필 사진 슬라이드
  - 매칭 완료 안내 박스: "매칭 완료! 🎉 두 분이 서로를 선택했어요!"
  - 소개팅 종료 안내 박스: "[소개팅 종료] 버튼을 누르면 연락처는 바로 삭제됩니다"
  - 상대방 연락처 표시 (010-1234-5678 형식)
  - 소개팅 종료 버튼 (검정 배경, 흰색 텍스트, 100% 너비)

[소개팅 종료 확인 플로우]
  1. 소개팅 종료 버튼 클릭
  2. 확인 알림: "소개팅 종료 하면 더이상 연락처를 알 수 없습니다.\n연락처는 개인정보 보호를 위해 삭제됩니다."
  3. "아니오" 선택 → 취소
  4. "네" 선택 → 소개팅 종료 처리

[소개팅 종료 처리 로직]
  1. user-1이 소개팅 종료 → 상태를 finished로 변경
  2. user-2가 소개팅 종료 → 상태를 finished로 변경
  3. 둘 다 finished 상태가 되면:
     - 모든 관련 데이터를 matching-history.json에 저장
     - matching-requests.json에서 해당 매칭 요청들 삭제
     - 연락처 교환 여부에 따라 final_status 결정 (exchanged/finished)

[3일 후 자동 삭제 기능]
  - finished 상태가 된 지 3일이 지난 매칭 요청 자동 삭제
  - 매일 자동 실행 (cleanupFinishedRequests 함수)
  - 삭제 전 matching-history.json에 모든 데이터 저장
  - 개인정보 보호를 위한 자동 정리

[소개팅 종료 API]
  - POST /meeting/finish: 소개팅 종료 처리
  - 요청 데이터: { match_id, user_id }
  - 응답: { ok: true }
  - 로깅: 소개팅 종료 이력, 이력 저장 여부, 둘 다 finished 상태 여부

[자동 삭제 API]
  - POST /cleanup-finished-requests: 수동 실행 (스케줄: 매일 자동)
  - 응답: { ok: true, deleted_count, total_requests, remaining_requests, history_saved }
  - 로깅: 삭제된 요청 개수, 이력 저장 여부, 매칭 쌍 없음 경고

[데이터 보존 정책]
  - 삭제 전 모든 관련 데이터를 matching-history.json에 저장
  - 매칭 쌍 정보, 연락처 정보, 리뷰 정보, 매칭 요청 정보 모두 보존
  - 중복 저장 방지 (이미 history에 있는 매칭 쌍은 저장하지 않음)
  - 삭제 사유 기록 (cleanup_reason: "3일 경과 자동 삭제")
```

---

### 🔹 \[11] 소개팅 실패 시 예외 처리

```
[성사 실패 조건]
- 한쪽 응답 없음 (7일 초과)
- 양측 시간 미일치 (3회 시도 후)
- 매니저가 매칭 취소
→ 포인트 100 반환
→ MatchingRequests 상태: failed
→ MatchPairs 상태: finished

[자동 실패 처리]
- 일정 선택 7일 초과 시 자동 실패
- 매칭 확정 후 30일 내 소개팅 미진행 시 자동 실패
- 실패 시 포인트 자동 반환 및 알림 발송
```

---

### 🔹 \[12] 등급 / 상태 정책 (포인트 제어 포함)

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

### 🔹 \[13] 기타 차별화 요소

```
[연락처 공유 최소화 설계]
- 소개팅 전: 연락처 공유 X
- 후기 기반 매칭 후 → 쌍방 YES 시에만 연락처 교환 가능
- 연락처 교환 완료 후에도 소개팅 예정 상태 유지

[연락처 교환 플로우]
- 단계별 상태 관리: completed → exchanged
- 사용자 친화적 UI: "연락처를 보냈습니다" → "연락처가 도착했습니다"
- 시각적 차별화: phone 아이콘 → heart 아이콘 (빨간색)

[다른 앱과의 차별점]
- 얼굴 먼저 고르기 → X
- 매칭 실패 → 없음, 반드시 오프라인 소개팅 제공
- 후기 기반 평가와 AI/매니저 매칭 혼합
- 후기 꼼꼼히 작성 시 포인트 보상
- 콘텐츠 학습(소개팅 팁, 대화법 등) 제공
- 단계별 연락처 교환 시스템으로 안전성 강화
```

---

### 🔹 \[13] 현재 개발 완료 상태 (2024-12-19)

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

**[매칭 시스템]**
- 소개팅 신청 API (구현됨)
- 매칭 요청 관리 (구현됨)
- 매칭 확정/선택 UI (구현됨)
- 매니저 제안 처리 (구현됨)
- 매칭 상태 관리 (waiting → matched → confirmed → scheduled → completed → exchanged)

**[리뷰 시스템]**
- 리뷰 작성 API (구현됨)
- 리뷰 통계 관리 (구현됨)
- 리뷰 작성 UI (구현됨)
- 리뷰 기반 연락처 교환 시스템 (구현됨)

**[연락처 교환 시스템]**
- 연락처 입력 모달 (구현됨)
- 연락처 교환 상태 관리 (completed → exchanged)
- 연락처 상세 조회 API (구현됨)
- 연락처 확인 화면 (구현됨)
- 상태별 UI 차별화 (phone 아이콘 → heart 아이콘)

**[소개팅 종료 시스템]**
- 소개팅 종료 API (구현됨)
- 연락처 확인 화면 UI (구현됨)
- 소개팅 종료 확인 플로우 (구현됨)
- 3일 후 자동 삭제 기능 (구현됨)
- 데이터 보존 정책 (matching-history.json에 저장)
- 중복 저장 방지 로직 (구현됨)
- 개인정보 보호를 위한 자동 정리 (구현됨)

**[데이터 관리]**
- 백엔드 JSON 파일 기반 데이터 저장
- 빌드 데이터 동기화 자동화
- 날짜별 로그 시스템
- 에러 처리 및 로깅

**[네비게이션]**
- 온보딩 → 로그인 → 프로필 → 이상형 → 메인 플로우
- 로그인 상태에 따른 화면 분기 처리
- 프로필/이상형 작성 완료 여부에 따른 분기

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

1. **포인트 UI 구현** - 충전/사용 내역 화면
2. **채팅 기능** - 매칭된 상대와 대화
3. **푸시 알림** - 소개팅 일정 알림
4. **성향 테스트 시스템** - 인사이트 카드 연동
5. **DynamoDB 마이그레이션** - 실제 데이터베이스 연동
6. **성능 최적화** - 이미지 캐싱, API 응답 속도 개선
7. **관리자 콘솔** - 매칭 관리, 사용자 관리, 통계 대시보드
8. **AI 매칭 알고리즘** - 성향 기반 자동 매칭

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
  * status: green | yellow | red | black   # black은 블랙리스트(제재)만 의미
  * is_deleted: boolean         # 탈퇴 여부(신규)
  * deleted_at: ISO8601 string  # 탈퇴일(신규)
  * delete_reason: string|null  # 탈퇴 사유(신규)
  * points: (number)
  * created_at: (ISO8601 string)

# 탈퇴 정책
- status: black은 블랙리스트(제재)만 의미, 탈퇴는 is_deleted로 구분
- is_deleted: true면 모든 서비스 이용 불가, 개인정보는 일정 기간 후 삭제/익명화
- 탈퇴 이력은 UserStatusHistory에 기록

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

  * requester_id: (string) // 매칭 신청자 ID
  * status: waiting | propose | matched | confirmed | scheduled | completed | failed | finished
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)
  * photo_visible_at: (ISO8601 string|null) // 사진 공개 시간
  * is_manual: (boolean) // 수동 매칭 여부
  * date_choices: { dates: [string], locations: [string] } // 사용자 일정/장소 선택
  * choices_submitted_at: (ISO8601 string|null) // 일정 제출 시간
  * final_date: (string|null) // 최종 확정 일정
  * final_location: (string|null) // 최종 확정 장소
  * date_address: (string|null) // 데이트 장소 주소
  * failure_reason: (string|null) // 실패 사유
  * points_refunded: (boolean) // 포인트 반환 여부
  * match_pair_id: (string|null) // 연결된 매칭 페어 ID (매칭 성사 시)
  * partner_id: (string|null) // 상대방 사용자 ID (매칭 성사 시)

---

## 📄 MatchPairs Table

* `PK`: match_pair_id (string)
* Attributes:

  * match_a_id: (string) // 매칭을 신청한 쪽 (MatchingRequests ID)
  * match_b_id: (string) // 매칭된 상대방 (MatchingRequests ID)
  * is_proposed: (boolean) // 매니저가 제안한 매칭 여부
  * confirm_proposed: (boolean) // 제안 수락 여부
  * attempt_count: (number) // 일정 조율 시도 횟수
  * both_interested: (boolean) // 쌍방 재만남 의사 여부
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)

---

## 📄 Propose Table

* `PK`: propose_id (string)
* Attributes:

  * proposer_id: (string) // 제안한 매니저 id
  * target_id: (string) // 제안 받은 유저 id
  * propose_user_id: (string) // 제안받은 유저에게 제안된 상대방 유저 id
  * match_pair_id: (string) // 연결된 match-pairs id
  * is_manual: (boolean) // 수동 제안 여부
  * status: propose | accept | refuse // 제안 상태
  * responded_at: (ISO8601 string|null) // 응답 시간
  * response: accept | refuse | null // 응답 내용
  * reason: (string) // 제안 사유
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)

---

## 📄 Reviews Table

* `PK`: review_id (string)
* Attributes:

  * match_id: (string) // 연결된 매칭 ID
  * reviewer_id: (string) // 후기 작성자 ID
  * target_id: (string) // 후기 대상자 ID
  * rating: { 
      appearance: number, // 외모 (1-5)
      conversation: number, // 대화력 (1-5)
      manners: number, // 매너 (1-5)
      honesty: number // 진정성 (1-5)
    }
  * want_to_meet_again: (boolean) // 재만남 의사
  * tags: (list of strings) // 긍정/부정 태그
  * comment: (string) // 주관식 코멘트
  * contact: (string|null) // 입력한 연락처
  * contact_shared_at: (ISO8601 string|null) // 연락처 입력 시각
  * // AI 인사이트를 위한 추가 필드들
  * overall_satisfaction: (number) // 전체 만족도 (1-5)
  * date_duration: (string) // 소개팅 지속 시간 (30분 미만, 30분-1시간, 1시간-2시간, 2시간 이상)
  * location_satisfaction: (number) // 장소 만족도 (1-5)
  * conversation_initiative: (string) // 대화 주도성 (나, 상대방, 비슷함)
  * first_impression_vs_reality: (string) // 첫인상 vs 실제인상 (더 좋아짐, 비슷함, 실망)
  * success_factors: (list of strings) // 소개팅 성공/실패 요인 (대화, 외모, 매너, 장소, 기타)
  * created_at: (ISO8601 string)

---

## 📄 ReviewStats Table

* `PK`: user_id (string)
* Attributes:

  * avg_appearance: (number)
  * avg_conversation: (number)
  * avg_manners: (number)
  * avg_honesty: (number)
  * // AI 인사이트를 위한 추가 통계
  * avg_overall_satisfaction: (number)
  * avg_location_satisfaction: (number)
  * total_reviews: (number)
  * positive_tags: (list)
  * // 소개팅 패턴 분석
  * date_duration_stats: (object) // 지속 시간별 통계
  * conversation_initiative_stats: (object) // 대화 주도성별 통계
  * first_impression_stats: (object) // 첫인상 vs 실제인상 통계
  * success_factor_stats: (object) // 성공 요인별 통계

---

## 📄 UserStatusHistory Table

* `PK`: user_id (string)
* `SK`: timestamp (ISO8601 string)
* Attributes:

  * from_status: (string) // 이전 상태
  * to_status: (string) // 변경된 상태
  * reason: (string) // 상태 변경 사유
  * updated_by: (string) // 변경한 관리자 ID (system: 자동 변경)

---

## 📄 PointsHistory Table

* `PK`: user_id (string)
* `SK`: timestamp (ISO8601 string)
* Attributes:

  * type: signup | charge | ad | review_bonus | event | manual | matching_cost | refund
  * points: (number) // 획득/차감 포인트 (양수: 획득, 음수: 차감)
  * description: (string) // 포인트 변동 사유
  * related_id: (string|null) // 관련 매칭/후기 ID

---

## 📄 MatchingHistory Table

* `PK`: match_pair_id (string)
* Attributes:

  * match_a_id: (string) // 매칭을 신청한 쪽 (MatchingRequests ID)
  * match_b_id: (string) // 매칭된 상대방 (MatchingRequests ID)
  * contact_exchanged_at: (ISO8601 string) // 연락처 교환 완료 시간
  * final_status: finished | exchanged // 최종 상태 (finished: 소개팅 완료, exchanged: 연락처 교환 완료)
  * finished_at: (ISO8601 string) // 소개팅 완료 시간
  * review_a: (object|null) // user-1의 리뷰 정보 (개인정보 보호를 위해 민감한 정보 제외)
  * review_b: (object|null) // user-2의 리뷰 정보 (개인정보 보호를 위해 민감한 정보 제외)
  * request_a: (object|null) // user-1의 매칭 요청 정보 (연락처, 일정 선택 등 민감 정보 제외)
  * request_b: (object|null) // user-2의 매칭 요청 정보 (연락처, 일정 선택 등 민감 정보 제외)
  * created_at: (ISO8601 string) // 이력 생성 시간

### 🔒 개인정보 보호 정책
- **finished 상태**: 연락처 정보, 사진, 일정 선택 정보 등 민감한 개인정보 제외
- **히스토리 조회**: 기본 매칭 정보만 제공 (상대방 이름, 날짜, 장소, 상태)
- **데이터 보존**: 매칭 완료 후 3일간 보존 후 자동 삭제

---

## 📄 NotificationSettings Table

* `PK`: user_id (string)
* Attributes:

  * push_enabled: (boolean) // 푸시 알림 활성화 여부
  * matching_notifications: (boolean) // 매칭 관련 알림
  * schedule_notifications: (boolean) // 일정 관련 알림
  * review_notifications: (boolean) // 후기 관련 알림
  * marketing_notifications: (boolean) // 마케팅 알림
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)

---

## 📄 PushTokens Table

* `PK`: user_id (string)
* `SK`: device_id (string)
* Attributes:

  * push_token: (string) // 디바이스 푸시 토큰
  * platform: ios | android // 플랫폼
  * app_version: (string) // 앱 버전
  * device_model: (string) // 디바이스 모델
  * is_active: (boolean) // 활성 상태
  * created_at: (ISO8601 string)
  * updated_at: (ISO8601 string)

---

## 📄 AdminLogs Table

* `PK`: log_id (string)
* Attributes:

  * admin_id: (string) // 관리자 ID
  * action: (string) // 수행한 액션
  * target_type: user | matching | review | points // 대상 타입
  * target_id: (string) // 대상 ID
  * details: (object) // 상세 정보
  * ip_address: (string) // IP 주소
  * created_at: (ISO8601 string)

---

## 🔗 테이블 간 관계 및 인덱스

### 주요 관계
- **Users** ↔ **UserProfiles**: 1:1 (user_id)
- **Users** ↔ **Preferences**: 1:1 (user_id)
- **Users** ↔ **MatchingRequests**: 1:1 (requester_id) // 사용자당 1개만 존재
- **MatchingRequests** ↔ **MatchPairs**: 2:1 (match_a_id, match_b_id) // 2개 요청이 1개 페어
- **MatchPairs** ↔ **Propose**: 1:N (match_pair_id)
- **MatchPairs** ↔ **Reviews**: 1:N (match_id)
- **Users** ↔ **Reviews**: 1:N (reviewer_id, target_id)
- **Users** ↔ **PointsHistory**: 1:N (user_id)
- **Users** ↔ **UserStatusHistory**: 1:N (user_id)

### GSI (Global Secondary Index)
- **MatchingRequests**: status-index (status, created_at)
- **MatchPairs**: status-index (status, created_at)
- **Propose**: target-status-index (target_id, status)
- **Reviews**: reviewer-index (reviewer_id, created_at)
- **Reviews**: target-index (target_id, created_at)
- **PointsHistory**: type-index (type, timestamp)
- **PushTokens**: token-index (push_token, is_active)

### LSI (Local Secondary Index)
- **UserStatusHistory**: status-index (to_status, timestamp)
- **PointsHistory**: type-index (type, timestamp)

---

## 📋 데이터 정합성 규칙

### 매칭 관련 규칙
1. **MatchingRequests**: 사용자별 매칭 정보의 중심 테이블
   - 사용자당 1개만 존재 (현재 진행 중인 매칭)
   - 일정/장소 정보, 상태, 시간 정보 모두 포함
   - 매칭 성사 시 match_pair_id, partner_id 추가
2. **MatchPairs**: 페어 관계 및 공통 정보만 관리
   - 매칭 성사 시 자동 생성
   - 상태 정보는 MatchingRequests에서 관리 (중복 제거)
   - 연락처 공유, 재만남 의사 등 페어별 공통 정보만 포함
3. **Propose**: 매니저 제안 시 생성, 수락/거절 시 상태 변경
4. **MatchingHistory**: 매칭 완료/연락처 교환 완료 시 자동 이관

### 포인트 관련 규칙
1. **PointsHistory**: 모든 포인트 변동은 반드시 기록
2. **Users.points**: PointsHistory의 합계와 일치해야 함
3. **매칭 신청**: -100 포인트, 실패 시 +100 포인트 반환
4. **후기 작성**: +50 포인트 보상 (우수 후기 시 추가 보상)

### 후기 관련 규칙
1. **Reviews**: 매칭 완료 후에만 작성 가능
2. **ReviewStats**: Reviews 기반으로 자동 계산
3. **등급 업데이트**: ReviewStats 기반으로 자동 업데이트
4. **연락처 교환**: 양쪽 모두 want_to_meet_again이 true일 때만 가능
5. **연락처 저장**: Reviews 테이블의 contact 필드에 저장

### 상태 관리 규칙
1. **UserStatusHistory**: 모든 상태 변경은 반드시 기록
2. **black 상태**: 모든 기능 제한, 포인트 적립 불가
3. **red 상태**: 매칭 신청 불가, 수락만 가능

---

### 🔹 [매칭 진행 상황 시나리오]

```
[매칭 진행 상황 6단계 시나리오]

1단계: 신청완료 (waiting)
  - 사용자: 소개팅 신청 버튼 클릭
  - 포인트: -100 차감
  - 상태: waiting
  - UI: "신청이 완료되었습니다. 매칭을 기다려주세요."
  - 진행률: 16.7% (1/6)

2단계: 매칭성공 (matched)
  - 매니저: user-1과 user-2 매칭 제안
  - user-2: 제안 수락/거절 선택
  - 수락 시: 양쪽 모두 matched 상태
  - 거절 시: user-1은 waiting 상태 유지
  - UI: "매칭 성공! 일정 조율 중이에요."
  - 진행률: 33.3% (2/6)

3단계: 일정 조율 (confirmed)
  - 양쪽: 약속 가능 날짜 3개, 선호 지역 3개 입력
  - 조건: 양쪽 모두 입력 완료 시 confirmed 상태
  - 제한: 7일 내 미응답 시 매칭 실패 (포인트 반환)
  - UI: "일정이 확정되었습니다. 곧 소개팅이 진행돼요."
  - 진행률: 50% (3/6)

4단계: 소개팅 예정 (scheduled)
  - 매니저: 최종 일정/장소 확정
  - 사진 공개: 약속일 30분 전 (photo_visible_at)
  - 푸시: "소개팅 30분 전입니다! 상대방 프로필을 확인해보세요."
  - UI: "소개팅이 곧 진행됩니다!"
  - 진행률: 66.7% (4/6)

5단계: 소개팅 완료 (completed)
  - 소개팅 진행 후: 리뷰 작성 요청
  - 리뷰 작성: 외모, 대화력, 매너, 진정성, 재만남 의사
  - 연락처 교환 조건: 쌍방 '재만남 의사' YES 선택
  - UI: "소개팅이 완료되었어요! 연락처 교환이 가능합니다."
  - 진행률: 83.3% (5/6)

6단계: 연락처 교환 완료 (exchanged)
  - user-1: 연락처 입력 → "연락처를 보냈습니다"
  - user-2: 연락처 입력 → 양쪽 완료
  - 상태 변경: exchanged
  - 연락처 확인: ContactDetailScreen으로 이동
  - UI: "연락처 교환이 완료되었어요! 소개팅 예정입니다."
  - 진행률: 100% (6/6)

7단계: 소개팅 종료 (finished)
  - user-1: 소개팅 종료 버튼 클릭 → 확인 알림
  - user-2: 소개팅 종료 버튼 클릭 → 확인 알림
  - 둘 다 finished 상태가 되면:
    - 모든 데이터를 matching-history.json에 저장
    - matching-requests.json에서 해당 매칭 요청들 삭제
    - 연락처 교환 여부에 따라 final_status 결정
  - UI: "소개팅이 종료되었습니다." (메인 화면으로 이동)
  - 진행률: 100% (완료)

[3일 후 자동 삭제]
  - finished 상태가 된 지 3일 경과
  - 매일 자동 실행 (cleanupFinishedRequests)
  - 삭제 전 matching-history.json에 데이터 보존
  - 개인정보 보호를 위한 자동 정리

[상태별 상세 시나리오]

waiting → matched 시나리오:
  - user-1 신청 → waiting 상태
  - 매니저 user-2에게 제안 → propose 상태
  - user-2 수락 → user-1, user-2 모두 matched
  - user-2 거절 → user-1은 waiting 유지, 매니저 재매칭 시도

matched → confirmed 시나리오:
  - 양쪽 일정/지역 입력 완료 → confirmed
  - 한쪽만 입력 → matched 상태 유지
  - 7일 초과 → 매칭 실패, 포인트 반환

confirmed → scheduled 시나리오:
  - 매니저 최종 확정 → scheduled
  - 사진 공개: 약속일 30분 전 (photo_visible_at)
  - 푸시: "소개팅 30분 전입니다! 상대방 프로필을 확인해보세요."
  - UI: "소개팅이 곧 진행됩니다!"
  - 진행률: 66.7% (4/6)

scheduled → completed 시나리오:
  - 소개팅 진행
  - 리뷰 작성 요청
  - 리뷰 작성 완료 → completed

completed → exchanged 시나리오:
  - 쌍방 재만남 의사 YES → 연락처 교환 가능
  - user-1 연락처 입력 → "연락처를 보냈습니다"
  - user-2 연락처 입력 → exchanged 상태
  - 연락처 확인 가능

exchanged → finished 시나리오:
  - user-1 소개팅 종료 → finished 상태
  - user-2 소개팅 종료 → finished 상태
  - 둘 다 finished → matching-history로 이동, matching-requests에서 삭제
  - 3일 후 자동 삭제로 개인정보 보호

[예외 상황 처리]

매칭 실패 시나리오:
  - 7일 내 일정 미입력 → failed 상태, 포인트 반환
  - 30일 내 소개팅 미진행 → failed 상태, 포인트 반환
  - 매니저 취소 → failed 상태, 포인트 반환
  - 유저에게는 waiting 상태로만 표시

거절/취소 시나리오:
  - user-2 제안 거절 → user-1은 waiting 상태 유지
  - 매니저가 재매칭 시도 가능
  - 유저는 거절/취소 사실을 모름

소개팅 종료 시나리오:
  - 한쪽만 finished → 다른 쪽은 exchanged 상태 유지
  - 둘 다 finished → matching-history로 이동, matching-requests에서 삭제
  - 3일 후 자동 삭제로 개인정보 보호

[UI 상태별 표시 규칙]

Step UI (6단계):
  - 항상 고정된 6단계 표시 (finished는 별도 처리)
  - 현재 단계에 따라 진행률 표시
  - 이전 단계는 완료 표시, 이후 단계는 대기 표시
  - finished 상태는 메인 화면에서 별도 표시

안내 문구:
  - 상황에 따라 동적으로 변경
  - 실패/거절/취소 시에도 유저는 waiting 상태로만 인지
  - "매칭을 기다려주세요" 등으로 유지
  - finished 상태: "소개팅이 종료되었습니다."

연락처 교환 UI:
  - completed + contactReady + !hasSentContact: "연락처 교환하기" (활성)
  - completed + contactReady + hasSentContact: "연락처를 보냈습니다" (비활성)
  - exchanged: "연락처가 도착했습니다" (빨간색 heart 아이콘)
  - finished: 연락처 확인 불가, 소개팅 종료 완료

[데이터 흐름]

MatchingRequests 테이블:
  - 사용자별 현재 진행 중인 매칭 1개만 관리
  - 상태 변경 시 updated_at 갱신
  - 매칭 성사 시 match_pair_id, partner_id 추가
  - finished 상태는 3일 후 자동 삭제

MatchPairs 테이블:
  - 매칭 성사 시 자동 생성
  - 페어 관계 및 공통 정보만 관리
  - 상태 정보는 MatchingRequests에서 관리

MatchingHistory 테이블:
  - 매칭 완료/연락처 교환 완료 시 자동 이관
  - 소개팅 종료 시에도 자동 이관
  - 모든 관련 데이터 보존 (개인정보 보호 정책 적용)
  - final_status: finished 또는 exchanged
  - cleanup_reason: "3일 경과 자동 삭제" 또는 "소개팅 종료"

---

## 🔌 API 엔드포인트

### 히스토리 관련 API

#### GET /history
- **설명**: 사용자의 매칭 히스토리 조회
- **인증**: JWT 토큰 필요
- **쿼리 파라미터**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
  - `status`: 상태 필터 (finished, exchanged)
- **응답**:
  ```json
  {
    "ok": true,
    "history": [
      {
        "match_pair_id": "string",
        "partner_name": "string",
        "final_date": "2024-01-15",
        "final_location": "강남역",
        "final_status": "finished|exchanged",
        "finished_at": "2024-01-15T18:00:00Z",
        "contact_exchanged_at": "2024-01-15T18:30:00Z",
        "review_submitted": true,
        "created_at": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "has_next": true,
      "has_prev": false
    }
  }
  ```

#### 🔒 개인정보 보호 정책
- **finished 상태**: 연락처 정보, 사진, 일정 선택 정보 등 민감한 개인정보 제외
- **히스토리 조회**: 기본 매칭 정보만 제공 (상대방 이름, 날짜, 장소, 상태)
- **데이터 보존**: 매칭 완료 후 3일간 보존 후 자동 삭제
- **API 응답**: 개인정보가 포함되지 않는 안전한 데이터만 반환
