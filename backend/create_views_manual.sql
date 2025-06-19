-- ============================================
-- MES Thailand - 필수 뷰 생성 스크립트
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. 기존 뷰 삭제 (있다면)
DROP VIEW IF EXISTS public.user_approval_status CASCADE;
DROP VIEW IF EXISTS public.team_assignments_with_users CASCADE;
DROP VIEW IF EXISTS public.quality_inspections_with_product CASCADE;

-- 2. user_approval_status 뷰 생성
-- 사용자 승인 상태를 관리하는 뷰 (실제 user_profiles 구조에 맞춤)
CREATE VIEW public.user_approval_status AS
SELECT 
  up.id,
  up.email,
  up.full_name,
  -- full_name을 분할하여 first_name, last_name 제공
  CASE 
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 
      SPLIT_PART(up.full_name, ' ', 1)
    ELSE '사용자'
  END as first_name,
  CASE 
    WHEN up.full_name IS NOT NULL AND up.full_name != '' AND position(' ' in up.full_name) > 0 THEN 
      TRIM(SUBSTRING(up.full_name FROM position(' ' in up.full_name) + 1))
    ELSE ''
  END as last_name,
  up.role,
  up.department,
  up.position,
  up.phone,
  COALESCE(up.approval_status, 'pending') as approval_status,
  CASE 
    WHEN COALESCE(up.approval_status, 'pending') = 'pending' THEN '승인 대기'
    WHEN up.approval_status = 'approved' THEN '승인됨'
    WHEN up.approval_status = 'rejected' THEN '거부됨'
    ELSE '승인 대기'
  END as status_display,
  COALESCE(up.is_active, true) as is_active,
  up.created_at as registration_date,
  up.updated_at,
  up.approved_by,
  up.approved_at
FROM public.user_profiles up;

-- 3. team_assignments_with_users 뷰 생성
-- 팀 배정과 사용자 정보를 조인한 뷰 (실제 user_profiles 구조에 맞춤)
CREATE VIEW public.team_assignments_with_users AS
SELECT 
  ta.id,
  ta.user_id,
  ta.team_name,
  ta.role_in_team as team_role,
  ta.responsibilities,
  ta.assigned_date,
  COALESCE(ta.is_active, true) as is_active,
  ta.created_at,
  ta.updated_at,
  up.full_name,
  -- full_name을 분할하여 first_name, last_name 제공
  CASE 
    WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 
      SPLIT_PART(up.full_name, ' ', 1)
    ELSE '사용자'
  END as first_name,
  CASE 
    WHEN up.full_name IS NOT NULL AND up.full_name != '' AND position(' ' in up.full_name) > 0 THEN 
      TRIM(SUBSTRING(up.full_name FROM position(' ' in up.full_name) + 1))
    ELSE ''
  END as last_name,
  up.email,
  up.department,
  up.position,
  up.phone,
  up.approval_status,
  COALESCE(up.is_active, true) as user_is_active
FROM public.team_assignments ta
LEFT JOIN public.user_profiles up ON ta.user_id = up.id;

-- 4. quality_inspections_with_product 뷰 생성
-- 품질 검사와 제품 정보를 조인한 뷰 (안전한 기본 구조)
CREATE VIEW public.quality_inspections_with_product AS
SELECT 
  qi.id,
  qi.work_order_id,
  qi.quality_standard_id,
  qi.inspector_id,
  qi.inspection_datetime,
  qi.sample_size,
  qi.measured_value,
  qi.result,
  qi.notes,
  qi.created_at,
  -- 작업 지시 정보 (기본값 포함, 안전한 조인)
  COALESCE(wo.order_number, '') as order_number,
  COALESCE(wo.status, '') as work_order_status,
  -- 품질 기준 정보 (기본값 포함)
  COALESCE(qs.test_name, '') as test_name,
  COALESCE(qs.test_type, '') as test_type,
  COALESCE(qs.target_value, 0) as target_value,
  COALESCE(qs.lower_limit, 0) as lower_limit,
  COALESCE(qs.upper_limit, 0) as upper_limit,
  -- 검사자 정보 (기본값 포함, full_name 사용)
  COALESCE(up.full_name, '알 수 없음') as inspector_name,
  COALESCE(up.email, '') as inspector_email,
  COALESCE(up.department, '') as inspector_department,
  -- 제품 정보는 별도로 처리 (기본값)
  '' as product_code,
  '알 수 없는 제품' as product_name,
  '' as category,
  '' as client
FROM public.quality_inspections qi
LEFT JOIN public.work_orders wo ON qi.work_order_id = wo.id
LEFT JOIN public.quality_standards qs ON qi.quality_standard_id = qs.id
LEFT JOIN public.user_profiles up ON qi.inspector_id = up.id;

-- 5. 모든 뷰에 대한 권한 부여
GRANT SELECT ON public.user_approval_status TO authenticated, anon;
GRANT SELECT ON public.team_assignments_with_users TO authenticated, anon;
GRANT SELECT ON public.quality_inspections_with_product TO authenticated, anon;

-- 6. 기본 테이블들의 RLS 비활성화 (개발 환경용)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- 7. 모든 테이블에 대한 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- 8. 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON public.user_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON public.user_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_team_assignments_user_id ON public.team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_is_active ON public.team_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_work_order ON public.quality_inspections(work_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_datetime ON public.quality_inspections(inspection_datetime);

-- 완료 메시지
SELECT 'MES Thailand 뷰 생성 완료! 웹 애플리케이션을 새로고침하세요.' as message; 