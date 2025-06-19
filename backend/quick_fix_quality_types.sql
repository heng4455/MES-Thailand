-- 🚀 quality_types 권한 문제 빠른 해결
-- Supabase SQL Editor에서 이 전체 스크립트를 복사하여 실행하세요

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view quality types" ON quality_types;
DROP POLICY IF EXISTS "Managers can insert quality types" ON quality_types;
DROP POLICY IF EXISTS "Managers can update quality types" ON quality_types;
DROP POLICY IF EXISTS "Admins can delete quality types" ON quality_types;
DROP POLICY IF EXISTS "quality_types_select_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_insert_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_update_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_delete_policy" ON quality_types;

-- 2. RLS 완전 비활성화 (개발 환경)
ALTER TABLE quality_types DISABLE ROW LEVEL SECURITY;

-- 3. 모든 권한 부여
GRANT ALL ON quality_types TO anon, authenticated;

-- 4. 확인
SELECT 
  'quality_types' as table_name,
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'quality_types') as rls_enabled,
  'RLS 비활성화 및 권한 부여 완료' as status;

-- 5. 테스트 쿼리 (선택사항 - 실행하여 테스트)
-- SELECT id, name FROM quality_types LIMIT 3; 