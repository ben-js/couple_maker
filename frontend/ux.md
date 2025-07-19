# Date Sense Frontend - UI/UX 가이드

## 🎨 디자인 시스템

### 📱 전체 디자인 철학
- **Flat UI**: 그림자 최소화, 테두리 기반 구분
- **Instagram 스타일**: 절제된 색상, 구조 중심 UI
- **일관성**: 모든 화면에서 동일한 디자인 언어 사용

### 🎯 색상 시스템

```typescript
// colors.ts 기반
export const colors = {
  // 기본 색상
  primary: '#222',           // 메인 텍스트 및 강조
  secondary: '#8E8E8E',      // 서브 텍스트
  
  // 배경 색상
  background: '#FFFFFF',     // 앱 전체 배경
  surface: '#F8F8F8',        // 카드/컴포넌트 영역 배경
  
  // 텍스트 색상
  text: {
    primary: '#262626',      // 기본 텍스트 (타이틀, 본문)
    secondary: '#8E8E8E',    // 설명, 보조 텍스트
    disabled: '#CCCCCC',     // 비활성 상태 텍스트
  },
  
  // 테두리 및 구분선
  border: '#DBDBDB',         // 입력창, 카드 구분선
  divider: '#F3F3F3',        // 섹션 사이 구분선
  
  // 상태 색상
  success: '#2E7D32',        // 성공
  warning: '#ED6C02',        // 경고
  error: '#D32F2F',          // 오류
  
  // 기타
  accent: '#3897F0',         // 인스타그램 파랑 (해시태그 등)
  stepInactive: '#E0E0E0',   // 진행바 미완료
}
```

### 📝 타이포그래피 시스템

```typescript
// typography.ts 기반
export const typography = {
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: '#262626',
  },
  body: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#262626',
  },
  caption: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 13,
    color: '#8E8E8E',
  },
  button: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#262626',
  },
  headingMedium: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    color: '#262626',
  },
  bodyRegular: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    color: '#262626',
  },
  captionSmall: {
    fontFamily: 'Pretendard-Light',
    fontSize: 12,
    color: '#8E8E8E',
  },
  hashtag: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
    color: '#3897F0',
  },
}
```

## 🧩 컴포넌트 시스템

### 📋 폼 컴포넌트

#### FormInput
- **용도**: 텍스트 입력 필드
- **스타일**: 테두리 없음, 플레이스홀더 회색
- **크기**: 최소 높이 48px, 패딩 12px

```typescript
<FormInput
  label="이름"
  placeholder="이름을 입력하세요"
  value={name}
  onChangeText={setName}
  error={errors.name}
/>
```

#### FormChips
- **용도**: 다중 선택 칩
- **스타일**: 둥근 모서리, 선택 시 파란색 배경
- **상호작용**: 터치로 선택/해제

```typescript
<FormChips
  label="관심사"
  options={['운동', '독서', '여행']}
  value={selected}
  onChange={setSelected}
  max={3}
/>
```

#### FormPicker
- **용도**: 단일 선택 드롭다운
- **스타일**: 전체 화면 모달, 체크 아이콘
- **상호작용**: 터치로 모달 열기

```typescript
<FormPicker
  label="직업"
  value={job}
  onChange={setJob}
  options={['학생', '회사원', '자영업']}
/>
```

#### FormRangeSlider
- **용도**: 범위 선택 (나이, 거리 등)
- **스타일**: 이중 슬라이더, 값 표시
- **상호작용**: 드래그로 범위 조정

```typescript
<FormRangeSlider
  label="희망 나이"
  min={20}
  max={50}
  value={[25, 35]}
  onValueChange={setAgeRange}
/>
```

### 🃏 카드 컴포넌트

#### CardCTA (Call-to-Action)
- **용도**: 주요 액션 버튼
- **스타일**: 전체 너비, 둥근 모서리
- **예시**: "소개팅 신청하기"

```typescript
<CardCTA
  title="지금 소개팅 신청하기"
  subtitle="AI + 매니저가 어울리는 상대를 찾아드려요!"
  buttonText="신청하기"
  onPress={handleRequest}
/>
```

#### CardProfile
- **용도**: 매칭된 상대 프로필 표시
- **스타일**: 사진 + 정보, 터치 가능
- **예시**: 소개팅 전 프로필 카드

```typescript
<CardProfile
  user={matchedUser}
  matchId={matchId}
  onPress={() => navigation.navigate('UserDetail')}
/>
```

#### CardReview
- **용도**: 리뷰 작성 유도
- **스타일**: 리뷰 상태 표시, 버튼 포함
- **예시**: 소개팅 후 리뷰 카드

```typescript
<CardReview
  user={matchedUser}
  matchId={matchId}
  onPress={() => navigation.navigate('ReviewWrite')}
/>
```

### 📊 진행 상태 컴포넌트

#### StepProgressBar
- **용도**: 매칭 진행 상황 표시
- **스타일**: 점 + 선 연결, 현재 단계 강조
- **단계**: 신청완료 → 매칭중 → 일정조율 → 소개팅예정

```typescript
<StepProgressBar
  total={4}
  current={2}
  labels={['신청완료', '매칭중', '일정조율', '소개팅예정']}
/>
```

### 🎯 버튼 컴포넌트

#### PrimaryButton
- **용도**: 주요 액션 버튼
- **스타일**: 둥근 모서리, 최소 높이 40px
- **상태**: 활성/비활성, 로딩 상태

```typescript
<PrimaryButton
  title="저장하기"
  onPress={handleSave}
  disabled={isSubmitting}
/>
```

## 📱 화면별 UI 가이드

### 🏠 메인 화면 (MainScreen)

#### 헤더 영역
- **프로필 썸네일**: 원형 44px, 왼쪽 상단
- **환영 메시지**: "소피님, 반가워요 👋"
- **포인트 표시**: "보유 포인트: 120P"
- **알림 아이콘**: 벨 아이콘, 오른쪽 상단

#### 매칭 진행 상황
- **제목**: "매칭 진행 상황"
- **설명**: 상태별 메시지
- **진행바**: StepProgressBar 컴포넌트

#### 소개팅 신청 CTA
- **조건**: 신청 전 상태에서만 표시
- **스타일**: CardCTA 컴포넌트
- **포인트 체크**: 100P 미만 시 충전 안내

#### 매칭된 상대 카드
- **조건**: scheduled 상태에서만 표시
- **스타일**: CardProfile 컴포넌트
- **상호작용**: 터치 시 상세 화면

### 👤 프로필 편집 화면 (ProfileEditScreen)

#### 레이아웃
- **PageLayout**: 상단 헤더 + 스크롤 영역
- **섹션**: 각 정보별로 구분된 카드
- **저장 버튼**: 하단 고정

#### 입력 필드
- **FormInput**: 이름, 자기소개
- **FormChips**: 관심사, 취미
- **FormPicker**: 직업, 학력
- **FormDate**: 생년월일

### ⚙️ 선호도 편집 화면 (PreferenceEditScreen)

#### 레이아웃
- **동적 폼**: JSON 설정 기반
- **섹션**: 각 선호도별 구분
- **저장 버튼**: 하단 고정

#### 입력 필드
- **FormRangeSlider**: 나이, 거리
- **FormRegionChoiceModal**: 지역 선택
- **FormOrderSelector**: 우선순위 선택
- **FormChips**: 선호사항

### 🍽️ 메뉴 화면 (MenuScreen)

#### 사용자 카드
- **프로필 사진**: 원형 44px
- **사용자 정보**: 이름, 이메일
- **포인트**: 현재 보유 포인트

#### 메뉴 항목
- **아이콘**: 40px 원형 배경
- **제목**: 메뉴명
- **설명**: 부가 설명
- **화살표**: 오른쪽 정렬

## 🎨 공통 스타일 가이드

### 📏 간격 시스템
```typescript
// commonStyles.ts 기반
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

### 🔲 카드 스타일
```typescript
const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: 16,
  padding: 20,
  marginBottom: 16,
}
```

### 📝 섹션 스타일
```typescript
const sectionStyle = {
  backgroundColor: colors.surface,
  marginTop: 16,
  paddingHorizontal: 24,
  paddingVertical: 20,
  borderRadius: 16,
}
```

## 🚀 상호작용 가이드

### 👆 터치 피드백
- **버튼**: activeOpacity 0.8
- **카드**: 터치 시 네비게이션
- **폼**: 포커스 시 테두리 없음

### 🔄 로딩 상태
- **스켈레톤**: Skeleton 컴포넌트
- **버튼**: 로딩 텍스트 표시
- **화면**: ActivityIndicator

### ⚠️ 에러 처리
- **폼 에러**: 빨간색 텍스트
- **API 에러**: Alert 또는 Toast
- **네트워크**: 재시도 버튼

## 📱 반응형 디자인

### 📐 화면 크기 대응
- **작은 화면**: 패딩 축소
- **큰 화면**: 최대 너비 제한
- **세로/가로**: 레이아웃 조정

### 🎯 접근성
- **터치 영역**: 최소 44px
- **텍스트 크기**: 가독성 확보
- **색상 대비**: WCAG 기준 준수

## 🔧 개발자 가이드

### 📦 컴포넌트 사용법
1. **import**: 필요한 컴포넌트 가져오기
2. **props**: 타입에 맞는 props 전달
3. **스타일**: colors, typography 상수 사용
4. **테스트**: 다양한 상태에서 테스트

### 🎨 스타일 추가 시
1. **colors.ts**: 색상 추가
2. **typography.ts**: 폰트 스타일 추가
3. **commonStyles.ts**: 공통 스타일 추가
4. **컴포넌트**: 개별 스타일 적용

### 📱 새로운 화면 추가 시
1. **PageLayout**: 기본 레이아웃 사용
2. **컴포넌트**: 기존 컴포넌트 재사용
3. **스타일**: 디자인 시스템 준수
4. **네비게이션**: 일관된 플로우

---

**마지막 업데이트**: 2024년 12월  
**버전**: 1.0.0