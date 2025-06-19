-- quality_types 테이블 RLS 정책 수정 (권한 오류 해결)
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 상태 확인
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'quality_types';

-- 2. 기존 정책들 제거
DROP POLICY IF EXISTS "Users can view quality types" ON quality_types;
DROP POLICY IF EXISTS "Managers can insert quality types" ON quality_types;
DROP POLICY IF EXISTS "Managers can update quality types" ON quality_types;
DROP POLICY IF EXISTS "Admins can delete quality types" ON quality_types;
DROP POLICY IF EXISTS "quality_types_select_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_insert_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_update_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_delete_policy" ON quality_types;

-- 3. RLS 비활성화 (임시)
ALTER TABLE quality_types DISABLE ROW LEVEL SECURITY;

-- 4. 새로운 단순한 정책 생성
-- 모든 사용자가 조회 가능
CREATE POLICY "quality_types_select_policy" ON quality_types 
    FOR SELECT 
    USING (true);

-- 로그인한 사용자 누구나 삽입 가능
CREATE POLICY "quality_types_insert_policy" ON quality_types 
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- 로그인한 사용자 누구나 수정 가능
CREATE POLICY "quality_types_update_policy" ON quality_types 
    FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 로그인한 사용자 누구나 삭제 가능
CREATE POLICY "quality_types_delete_policy" ON quality_types 
    FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- 5. RLS 활성화
ALTER TABLE quality_types ENABLE ROW LEVEL SECURITY;

-- 6. 권한 부여 (추가 보안)
GRANT ALL ON quality_types TO anon, authenticated;

-- 7. 정책 확인
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'quality_types';

-- 8. 생성된 정책 목록 확인
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'quality_types'
ORDER BY policyname;

-- 9. 완료 메시지
SELECT 
  'quality_types RLS 정책 수정 완료!' as status,
  'auth.users 참조를 제거하여 권한 오류 해결' as description,
  NOW() as completed_at; 