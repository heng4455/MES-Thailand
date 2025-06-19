-- =============================================
-- user_profiles 테이블 생성 스크립트
-- =============================================

-- 1. 기존 테이블이 있다면 삭제 (주의: 데이터 손실 발생)
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. user_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    role VARCHAR(50) DEFAULT 'operator',
    approval_status VARCHAR(20) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT false,
    avatar_url TEXT,
    last_login TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON public.user_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);

-- 4. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS 정책 비활성화 (개발 환경)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 7. 권한 부여
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- 8. 기본 관리자 프로필 추가
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    department,
    position,
    role,
    approval_status,
    is_active,
    created_at
) VALUES (
    '25424ac0-4d3f-4912-80e9-c8a008034c6c',
    'admin@mes-thailand.com',
    '시스템 관리자',
    'IT',
    'Administrator',
    'admin',
    'approved',
    true,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role = EXCLUDED.role,
    approval_status = EXCLUDED.approval_status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 9. 기본 사용자 몇 명 추가 (테스트용)
INSERT INTO public.user_profiles (
    email,
    full_name,
    department,
    position,
    role,
    approval_status,
    is_active
) VALUES 
    ('manager@mes-thailand.com', '생산 관리자', '생산부', 'Manager', 'manager', 'approved', true),
    ('operator1@mes-thailand.com', '작업자 1', '생산부', 'Operator', 'operator', 'approved', true),
    ('operator2@mes-thailand.com', '작업자 2', '품질관리부', 'QC Inspector', 'operator', 'approved', true),
    ('pending@mes-thailand.com', '승인대기자', '생산부', 'Operator', 'operator', 'pending', false)
ON CONFLICT (email) DO NOTHING;

-- 10. 확인 쿼리
SELECT 
    'user_profiles' as table_name, 
    COUNT(*) as total_count,
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_count
FROM public.user_profiles; 