-- RLS 무한 재귀 문제 해결을 위한 SQL 스크립트
-- 개발 환경에서 RLS를 비활성화하고 모든 권한을 부여합니다

-- 1. 모든 테이블의 RLS 비활성화
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quality_inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS status_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS line_notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions DISABLE ROW LEVEL SECURITY;

-- 2. 기존 정책들 삭제 (무한 재귀를 일으키는 정책들)
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles;
DROP POLICY IF EXISTS "customers_policy" ON customers;
DROP POLICY IF EXISTS "products_policy" ON products;
DROP POLICY IF EXISTS "equipment_policy" ON equipment;
DROP POLICY IF EXISTS "inventory_policy" ON inventory;
DROP POLICY IF EXISTS "work_orders_policy" ON work_orders;
DROP POLICY IF EXISTS "quality_inspections_policy" ON quality_inspections;

DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON user_profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Enable update for users based on email" ON customers;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON customers;

DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for users based on email" ON products;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON products;

-- 3. anon과 authenticated 역할에 모든 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. 특정 테이블에 대한 명시적 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON equipment TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quality_inspections TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_groups TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON status_definitions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_assignments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON permissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions TO anon, authenticated;

-- 5. 시퀀스 권한 부여
GRANT USAGE, SELECT ON user_profiles_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON customers_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON products_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON equipment_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON inventory_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON work_orders_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON quality_inspections_id_seq TO anon, authenticated;

-- 완료 메시지
SELECT 'RLS 무한 재귀 문제 해결 완료!' as status; 