# 매니저 역할별 권한 및 업무 가이드

## 📋 **역할 개요**

DateSense 관리자 서비스에는 3가지 역할이 있습니다:

### **1. Admin (관리자)**
- **역할**: 시스템 최고 관리자
- **주요 업무**: 매니저 관리 및 시스템 설정
- **접근 권한**: 모든 기능에 대한 완전한 권한

### **2. Manager (매니저)**
- **역할**: 운영 담당자
- **주요 업무**: 사용자 관리, 매칭 관리, 포인트 관리
- **접근 권한**: 운영 관련 기능에 대한 제한적 권한

### **3. Support (고객지원)**
- **역할**: 고객 지원 담당자
- **주요 업무**: 사용자 문의 응대, 기본 정보 조회
- **접근 권한**: 읽기 전용 권한 위주

---

## 🔐 **역할별 상세 권한**

### **Admin (관리자) 권한**

```javascript
{
  user_management: { read: true, write: true, delete: true },
  matching_management: { read: true, write: true, delete: true },
  review_management: { read: true, write: true, delete: true },
  point_management: { read: true, write: true, delete: true },
  manager_management: { read: true, write: true, delete: true },
  manager_logs: { read: true, write: true, delete: true },
  dashboard: { read: true, write: true, delete: true }
}
```

**주요 업무:**
- ✅ **매니저 관리**: 매니저 계정 생성/삭제/권한 설정
- ✅ **시스템 설정**: 전체 시스템 설정 관리
- ✅ **모니터링**: 모든 활동 로그 확인
- ✅ **권한 관리**: 각 매니저의 권한 설정

### **Manager (매니저) 권한**

```javascript
{
  user_management: { read: true, write: true, delete: false },
  matching_management: { read: true, write: true, delete: false },
  point_management: { read: true, write: true, delete: false },
  manager_logs: { read: false, write: false, delete: false },
  dashboard: { read: true, write: false, delete: false },
  review_management: { read: false, write: false, delete: false },
  manager_management: { read: false, write: false, delete: false }
}
```

**주요 업무:**
- ✅ **사용자 관리**: 사용자 정보 조회, 상태 변경, 등급 관리
- ✅ **매칭 관리**: 매칭 요청 처리, 매칭 상태 관리
- ✅ **포인트 관리**: 포인트 지급/차감, 포인트 히스토리 관리
- ✅ **대시보드**: 기본 통계 정보 확인
- ❌ **매니저 관리**: 다른 매니저 관리 불가
- ❌ **활동 로그**: 관리자 로그 조회 불가
- ❌ **삭제 권한**: 사용자/매칭/포인트 삭제 불가

### **Support (고객지원) 권한**

```javascript
{
  user_management: { read: true, write: false, delete: false },
  matching_management: { read: true, write: false, delete: false },
  dashboard: { read: true, write: false, delete: false },
  review_management: { read: false, write: false, delete: false },
  point_management: { read: false, write: false, delete: false },
  manager_management: { read: false, write: false, delete: false },
  manager_logs: { read: false, write: false, delete: false }
}
```

**주요 업무:**
- ✅ **사용자 정보 조회**: 사용자 기본 정보 확인
- ✅ **매칭 정보 조회**: 매칭 상태 및 이력 확인
- ✅ **대시보드 확인**: 기본 통계 정보 확인
- ❌ **수정 권한**: 모든 수정 기능 제한
- ❌ **관리 기능**: 매니저/포인트/로그 관리 불가

---

## 🎯 **역할별 업무 가이드**

### **Admin 업무 가이드**

#### **매니저 관리**
1. **매니저 추가**: 새로운 매니저 계정 생성
2. **권한 설정**: 각 매니저의 세부 권한 설정
3. **역할 변경**: 매니저 역할 변경 (Manager ↔ Support)
4. **계정 관리**: 매니저 계정 활성화/비활성화

#### **시스템 모니터링**
1. **활동 로그**: 모든 매니저의 활동 확인
2. **성과 분석**: 매니저별 업무 성과 분석
3. **시스템 상태**: 전체 시스템 상태 모니터링

### **Manager 업무 가이드**

#### **사용자 관리**
1. **사용자 목록**: 전체 사용자 목록 조회
2. **상태 관리**: 사용자 상태 변경 (green/yellow/red/black)
3. **등급 관리**: 사용자 등급 변경 (general/excellent/gold/vip/vvip)
4. **포인트 관리**: 사용자 포인트 지급/차감

#### **매칭 관리**
1. **매칭 요청**: 새로운 매칭 요청 처리
2. **상태 변경**: 매칭 상태 업데이트
3. **문제 해결**: 매칭 관련 문제 해결

#### **활동 기록**
1. **업무 로그**: 수행한 업무 활동 기록
2. **문제 해결**: 사용자 문의 및 문제 해결 기록

### **Support 업무 가이드**

#### **고객 지원**
1. **정보 조회**: 사용자 기본 정보 확인
2. **매칭 확인**: 매칭 상태 및 이력 확인
3. **문의 응대**: 사용자 문의에 대한 기본 정보 제공
4. **문제 접수**: 복잡한 문제는 Manager에게 이관

---

## 📊 **권한 매트릭스**

| 기능 | Admin | Manager | Support |
|------|-------|---------|---------|
| **사용자 관리** | ✅ 읽기/쓰기/삭제 | ✅ 읽기/쓰기 | ✅ 읽기만 |
| **매칭 관리** | ✅ 읽기/쓰기/삭제 | ✅ 읽기/쓰기 | ✅ 읽기만 |
| **포인트 관리** | ✅ 읽기/쓰기/삭제 | ✅ 읽기/쓰기 | ❌ 접근 불가 |
| **매니저 관리** | ✅ 읽기/쓰기/삭제 | ❌ 접근 불가 | ❌ 접근 불가 |
| **활동 로그** | ✅ 읽기/쓰기/삭제 | ❌ 접근 불가 | ❌ 접근 불가 |
| **대시보드** | ✅ 읽기/쓰기/삭제 | ✅ 읽기만 | ✅ 읽기만 |

---

## 🔄 **역할 변경 가이드**

### **Manager → Admin**
- **권한 확장**: 모든 기능에 대한 완전한 권한 부여
- **업무 확장**: 매니저 관리 및 시스템 설정 업무 추가

### **Manager → Support**
- **권한 축소**: 읽기 전용 권한으로 제한
- **업무 축소**: 고객 지원 업무로 전환

### **Support → Manager**
- **권한 확장**: 사용자/매칭/포인트 관리 권한 부여
- **업무 확장**: 운영 업무 담당

---

## ⚠️ **주의사항**

1. **권한 분리**: 각 역할은 명확히 분리된 권한을 가집니다
2. **최소 권한 원칙**: 업무에 필요한 최소한의 권한만 부여
3. **감사 로그**: 모든 권한 변경은 로그에 기록됩니다
4. **정기 검토**: 권한 설정을 정기적으로 검토하고 조정

---

## 📞 **문의 및 지원**

역할별 권한이나 업무에 대한 문의사항이 있으시면:
- **Admin**: 시스템 관리자에게 문의
- **Manager/Support**: 상위 매니저 또는 Admin에게 문의 