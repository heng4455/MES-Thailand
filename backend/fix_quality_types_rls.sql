-- quality_types 테이블 RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책들 제거
DROP POLICY IF EXISTS "Users can view quality types" ON quality_types;
DROP POLICY IF EXISTS "quality_types_select_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_insert_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_update_policy" ON quality_types;
DROP POLICY IF EXISTS "quality_types_delete_policy" ON quality_types;

-- 2. RLS 비활성화 (임시)
ALTER TABLE quality_types DISABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책 생성
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

-- 4. RLS 활성화
ALTER TABLE quality_types ENABLE ROW LEVEL SECURITY;

-- 5. 정책 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quality_types';

-- 6. 생성된 정책 목록 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'quality_types'; 