-- MES Thailand - 배포용 RLS 정책 설정
-- ============================================
-- MES Thailand - 배포용 RLS 정책 설정
-- Production Row Level Security Setup
-- ============================================

-- 1. 기존 뷰 삭제 후 재생성
DROP VIEW IF EXISTS public.user_approval_status CASCADE;
DROP VIEW IF EXISTS public.team_assignments_with_users CASCADE;
DROP VIEW IF EXISTS public.quality_inspections_with_product CASCADE;

-- 2. user_approval_status 뷰 생성
CREATE VIEW public.user_approval_status AS
SELECT 
  up.id,
  up.email,
  up.full_name,
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
  COALESCE(wo.order_number, '') as order_number,
  COALESCE(wo.status, '') as work_order_status,
  COALESCE(qs.test_name, '') as test_name,
  COALESCE(qs.test_type, '') as test_type,
  COALESCE(qs.target_value, 0) as target_value,
  COALESCE(qs.lower_limit, 0) as lower_limit,
  COALESCE(qs.upper_limit, 0) as upper_limit,
  COALESCE(up.full_name, '알 수 없음') as inspector_name,
  COALESCE(up.email, '') as inspector_email,
  COALESCE(up.department, '') as inspector_department,
  '' as product_code,
  '알 수 없는 제품' as product_name,
  '' as category,
  '' as client
FROM public.quality_inspections qi
LEFT JOIN public.work_orders wo ON qi.work_order_id = wo.id
LEFT JOIN public.quality_standards qs ON qi.quality_standard_id = qs.id
LEFT JOIN public.user_profiles up ON qi.inspector_id = up.id;

-- ============================================
-- 배포용 RLS 정책 설정
-- ============================================

-- 5. 핵심 테이블 RLS 활성화 및 정책 설정

-- user_profiles 테이블
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- 새로운 보안 정책 생성
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- customers 테이블
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access customers" ON public.customers;

CREATE POLICY "Approved users can view customers" ON public.customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Managers can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
      AND approval_status = 'approved'
    )
  );

-- products 테이블
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access products" ON public.products;

CREATE POLICY "Approved users can view products" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Managers can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
      AND approval_status = 'approved'
    )
  );

-- work_orders 테이블
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access work_orders" ON public.work_orders;

CREATE POLICY "Approved users can view work_orders" ON public.work_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Operators can manage work_orders" ON public.work_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'operator')
      AND approval_status = 'approved'
    )
  );

-- inventory 테이블
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access inventory" ON public.inventory;

CREATE POLICY "Approved users can view inventory" ON public.inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Managers can manage inventory" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
      AND approval_status = 'approved'
    )
  );

-- quality_inspections 테이블
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view quality_inspections" ON public.quality_inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Quality staff can manage inspections" ON public.quality_inspections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'operator')
      AND approval_status = 'approved'
    )
  );

-- ============================================
-- 관리자 패널 테이블 RLS 설정
-- ============================================

-- status_definitions 테이블
ALTER TABLE public.status_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view status_definitions" ON public.status_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage status_definitions" ON public.status_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- team_assignments 테이블
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments" ON public.team_assignments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
      AND approval_status = 'approved'
    )
  );

CREATE POLICY "Managers can manage team_assignments" ON public.team_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
      AND approval_status = 'approved'
    )
  );

-- product_groups 테이블
ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view product_groups" ON public.product_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage product_groups" ON public.product_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- line_notification_settings 테이블
ALTER TABLE public.line_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage line_notification_settings" ON public.line_notification_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- notification_templates 테이블
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view notification_templates" ON public.notification_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage notification_templates" ON public.notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- notification_logs 테이블
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification_logs" ON public.notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- admin_settings 테이블
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- ============================================
-- 역할 관리 테이블 RLS 설정
-- ============================================

-- user_roles 테이블
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view user_roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- permissions 테이블
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view permissions" ON public.permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- role_permissions 테이블
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view role_permissions" ON public.role_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- ============================================
-- 설비 관리 테이블 RLS 설정
-- ============================================

-- equipment 테이블
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view equipment" ON public.equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Managers can manage equipment" ON public.equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
      AND approval_status = 'approved'
    )
  );

-- plc_devices 테이블
ALTER TABLE public.plc_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view plc_devices" ON public.plc_devices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage plc_devices" ON public.plc_devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND approval_status = 'approved'
    )
  );

-- ============================================
-- 뷰에 대한 권한 설정
-- ============================================

-- 뷰는 기본 테이블의 RLS 정책을 상속하므로 별도 권한만 부여
GRANT SELECT ON public.user_approval_status TO authenticated;
GRANT SELECT ON public.team_assignments_with_users TO authenticated;
GRANT SELECT ON public.quality_inspections_with_product TO authenticated;

-- ============================================
-- 성능 최적화 인덱스 생성
-- ============================================

-- 사용자 프로필 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON public.user_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON public.user_profiles(full_name);

-- 팀 배정 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_team_assignments_user_id ON public.team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_is_active ON public.team_assignments(is_active);

-- 품질 검사 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_quality_inspections_work_order ON public.quality_inspections(work_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_datetime ON public.quality_inspections(inspection_datetime);

-- ============================================
-- 완료 확인
-- ============================================

SELECT 
  'production_rls_setup' as setup_type,
  'completed' as status,
  NOW() as completed_at,
  'All RLS policies configured for production environment' as message;

-- 테이블별 RLS 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policy WHERE polrelid = c.oid) as policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'customers', 'products', 'work_orders', 'inventory',
    'quality_inspections', 'status_definitions', 'team_assignments',
    'product_groups', 'line_notification_settings', 'notification_templates',
    'notification_logs', 'admin_settings', 'user_roles', 'permissions',
    'role_permissions', 'equipment', 'plc_devices'
  )
ORDER BY tablename;
