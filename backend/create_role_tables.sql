-- =============================================
-- 역할 관리 시스템 테이블 생성 스크립트
-- =============================================

-- 1. 기존 테이블 삭제 (순서 중요 - 외래키 제약조건 때문에)
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;  
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 2. 역할 정의 테이블 생성
CREATE TABLE public.user_roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(20) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    permissions JSONB,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 권한 정의 테이블 생성
CREATE TABLE public.permissions (
    id SERIAL PRIMARY KEY,
    permission_code VARCHAR(50) UNIQUE NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    permission_description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 역할-권한 매핑 테이블 생성
CREATE TABLE public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES public.user_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 5. 인덱스 생성
CREATE INDEX idx_user_roles_code ON public.user_roles(role_code);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX idx_permissions_code ON public.permissions(permission_code);
CREATE INDEX idx_permissions_category ON public.permissions(category);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

-- 6. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON public.user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 기본 권한 데이터 삽입
INSERT INTO public.permissions (permission_code, permission_name, permission_description, category) VALUES
-- 사용자 관리 권한
('user.view', '사용자 조회', '사용자 목록 및 정보 조회', 'user'),
('user.create', '사용자 생성', '새 사용자 계정 생성', 'user'),
('user.edit', '사용자 수정', '사용자 정보 수정', 'user'),
('user.delete', '사용자 삭제', '사용자 계정 삭제', 'user'),
('user.approve', '사용자 승인', '사용자 가입 승인/거부', 'user'),

-- 생산 관리 권한
('production.view', '생산 조회', '생산 현황 및 데이터 조회', 'production'),
('production.create', '생산 등록', '생산 계획 및 실적 등록', 'production'),
('production.edit', '생산 수정', '생산 정보 수정', 'production'),
('production.delete', '생산 삭제', '생산 데이터 삭제', 'production'),

-- 품질 관리 권한
('quality.view', '품질 조회', '품질 검사 결과 조회', 'quality'),
('quality.create', '품질 등록', '품질 검사 결과 등록', 'quality'),
('quality.edit', '품질 수정', '품질 검사 결과 수정', 'quality'),

-- 재고 관리 권한
('inventory.view', '재고 조회', '재고 현황 조회', 'inventory'),
('inventory.create', '재고 등록', '재고 입출고 등록', 'inventory'),
('inventory.edit', '재고 수정', '재고 정보 수정', 'inventory'),

-- 설비 관리 권한
('equipment.view', '설비 조회', '설비 상태 및 정보 조회', 'equipment'),
('equipment.create', '설비 등록', '새 설비 등록', 'equipment'),
('equipment.edit', '설비 수정', '설비 정보 수정', 'equipment'),

-- 관리자 권한
('admin.settings', '시스템 설정', '시스템 설정 관리', 'admin'),
('admin.users', '사용자 관리', '사용자 계정 관리', 'admin'),
('admin.roles', '역할 관리', '역할 및 권한 관리', 'admin');

-- 9. 기본 역할 데이터 삽입
INSERT INTO public.user_roles (role_code, role_name, role_description, is_system_role, display_order) VALUES
('super_admin', '최고 관리자', '모든 권한을 가진 최고 관리자', true, 1),
('admin', '관리자', '시스템 관리 권한을 가진 관리자', true, 2),
('manager', '매니저', '부서별 관리 권한을 가진 매니저', true, 3),
('operator', '운영자', '생산 및 품질 관리 운영자', true, 4),
('viewer', '조회자', '데이터 조회만 가능한 사용자', true, 5);

-- 10. 역할별 권한 매핑
-- 최고 관리자: 모든 권한
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_code = 'super_admin';

-- 관리자: 관리자 권한 + 사용자 관리
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_code = 'admin' 
AND (p.category IN ('admin', 'user') OR p.permission_code LIKE '%.view');

-- 매니저: 생산, 품질, 재고 관리 + 조회
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_code = 'manager' 
AND (p.category IN ('production', 'quality', 'inventory', 'equipment') 
     OR p.permission_code LIKE '%.view');

-- 운영자: 생산, 품질 관리 + 조회
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_code = 'operator' 
AND (p.category IN ('production', 'quality') 
     OR p.permission_code LIKE '%.view');

-- 조회자: 모든 조회 권한만
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ur.id, p.id 
FROM public.user_roles ur, public.permissions p 
WHERE ur.role_code = 'viewer' 
AND p.permission_code LIKE '%.view';

-- 11. RLS 정책 설정 (개발 환경에서는 비활성화)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;

-- 12. 권한 부여
GRANT ALL ON public.user_roles TO anon, authenticated;
GRANT ALL ON public.permissions TO anon, authenticated;
GRANT ALL ON public.role_permissions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_roles_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE permissions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE role_permissions_id_seq TO anon, authenticated;

-- 13. 확인 쿼리
SELECT 'user_roles' as table_name, COUNT(*) as count FROM public.user_roles
UNION ALL
SELECT 'permissions' as table_name, COUNT(*) as count FROM public.permissions
UNION ALL
SELECT 'role_permissions' as table_name, COUNT(*) as count FROM public.role_permissions;

-- 14. 역할별 권한 확인
SELECT 
    ur.role_name,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(p.permission_name, ', ' ORDER BY p.permission_name) as permissions
FROM public.user_roles ur
LEFT JOIN public.role_permissions rp ON ur.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id
GROUP BY ur.id, ur.role_name
ORDER BY ur.display_order; 