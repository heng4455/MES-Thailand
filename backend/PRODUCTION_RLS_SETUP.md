# 배포용 RLS 정책 설정 가이드

## 개요
이 가이드는 MES Thailand 시스템의 **배포용 Row Level Security (RLS) 정책**을 설정하는 방법을 설명합니다.

개발용에서 사용했던 `DISABLE ROW LEVEL SECURITY` 설정을 제거하고, 실제 운영 환경에 적합한 보안 정책을 적용합니다.

## 주요 변경사항

### 🔒 보안 강화
- **개발용**: 모든 테이블의 RLS 비활성화 (`DISABLE ROW LEVEL SECURITY`)
- **배포용**: 역할 기반 세밀한 접근 제어 정책 적용

### 📋 적용 대상 테이블
- `user_profiles` - 사용자 프로필 관리
- `customers` - 고객 정보 관리
- `products` - 제품 정보 관리
- `work_orders` - 작업 지시서 관리
- `inventory` - 재고 관리
- `quality_inspections` - 품질 검사 관리
- `status_definitions` - 상태 정의 관리
- `team_assignments` - 팀 배정 관리
- `product_groups` - 제품 그룹 관리
- `line_notification_settings` - LINE 알림 설정
- `notification_templates` - 알림 템플릿 관리
- `notification_logs` - 알림 로그 관리
- `admin_settings` - 관리자 설정
- `user_roles` - 사용자 역할 관리
- `permissions` - 권한 관리
- `role_permissions` - 역할-권한 매핑
- `equipment` - 설비 관리
- `plc_devices` - PLC 장치 관리

## 설정 방법

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. MES Thailand 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2. SQL 스크립트 실행
1. `backend/production_rls_setup.sql` 파일 내용을 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭하여 실행

### 3. 실행 결과 확인
스크립트 실행 후 다음과 같은 결과가 표시되어야 합니다:
```sql
-- 뷰 생성 완료
✅ user_approval_status
✅ team_assignments_with_users  
✅ quality_inspections_with_product

-- RLS 정책 적용 완료
✅ 19개 테이블의 RLS 활성화
✅ 각 테이블별 역할 기반 정책 생성

-- 성능 최적화 인덱스 생성 완료
```

## 보안 정책 상세

### 👤 사용자 관리 (user_profiles)
- **본인 프로필 조회**: 자신의 프로필만 조회 가능
- **관리자 전체 조회**: admin/super_admin 역할만 모든 사용자 조회 가능
- **본인 프로필 수정**: 자신의 프로필만 수정 가능
- **관리자 전체 관리**: admin/super_admin 역할만 모든 사용자 관리 가능

### 🏢 고객/제품 관리 (customers, products)
- **조회 권한**: 승인된 활성 사용자만 조회 가능
- **관리 권한**: admin/super_admin/manager 역할만 생성/수정/삭제 가능

### 🔧 생산 관리 (work_orders, inventory)
- **조회 권한**: 승인된 활성 사용자만 조회 가능
- **작업지시서**: admin/super_admin/manager/operator 역할이 관리 가능
- **재고**: admin/super_admin/manager 역할만 관리 가능

### 🔍 품질 관리 (quality_inspections)
- **조회 권한**: 승인된 활성 사용자만 조회 가능
- **관리 권한**: admin/super_admin/manager/operator 역할이 관리 가능

### ⚙️ 관리자 기능
- **시스템 설정**: admin/super_admin 역할만 접근 가능
- **팀 배정**: 본인 배정은 조회 가능, 관리는 manager 이상만 가능
- **역할/권한 관리**: admin/super_admin 역할만 관리 가능

### 🏭 설비 관리 (equipment, plc_devices)
- **조회 권한**: 승인된 활성 사용자만 조회 가능
- **설비 관리**: admin/super_admin/manager 역할이 관리 가능
- **PLC 관리**: admin/super_admin 역할만 관리 가능

## 문제 해결

### 🚨 일반적인 오류

#### 1. "permission denied for table" 오류
```sql
-- 해결 방법: 사용자 승인 상태 확인
SELECT approval_status, is_active FROM user_profiles WHERE id = auth.uid();
```

#### 2. "row-level security policy violated" 오류
```sql
-- 해결 방법: 사용자 역할 확인
SELECT role FROM user_profiles WHERE id = auth.uid();
```

#### 3. 뷰 접근 불가
```sql
-- 해결 방법: 뷰 재생성
DROP VIEW IF EXISTS user_approval_status CASCADE;
-- 이후 production_rls_setup.sql의 뷰 생성 부분만 재실행
```

### 🔧 수동 복구 방법

만약 RLS 정책으로 인해 접근이 불가능한 경우:

```sql
-- 임시로 특정 테이블의 RLS 비활성화 (응급 상황용)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 문제 해결 후 다시 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

## 테스트 방법

### 1. 기본 접근 테스트
```javascript
// 프론트엔드에서 테스트
const { data: users, error } = await supabase
  .from('user_approval_status')
  .select('*')
  .limit(5);

console.log('사용자 목록:', users);
console.log('오류:', error);
```

### 2. 역할별 접근 테스트
```javascript
// 관리자 기능 테스트
const { data: settings, error } = await supabase
  .from('admin_settings')
  .select('*');

// admin/super_admin 역할만 접근 가능해야 함
```

## 롤백 방법

만약 문제가 발생하여 개발용 설정으로 되돌려야 하는 경우:

```sql
-- 모든 테이블의 RLS 비활성화
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
-- ... 기타 테이블들

-- 모든 테이블에 대한 전체 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
```

## 주의사항

⚠️ **중요**: 이 설정은 **운영 환경용**입니다. 개발 중에는 `create_views_manual.sql`을 사용하세요.

⚠️ **백업**: RLS 정책 적용 전에 반드시 데이터베이스 백업을 수행하세요.

⚠️ **테스트**: 실제 운영 환경에 적용하기 전에 스테이징 환경에서 충분히 테스트하세요.

## 완료 확인

설정이 완료되면 다음을 확인하세요:

1. ✅ 모든 뷰가 정상 작동
2. ✅ 역할별 접근 제어가 올바르게 작동
3. ✅ 웹 애플리케이션에서 모든 기능이 정상 작동
4. ✅ 성능에 문제가 없음

---

**문의사항이 있으시면 개발팀에 연락해 주세요.** 