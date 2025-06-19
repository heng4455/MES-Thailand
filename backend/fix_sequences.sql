-- 시퀀스 수정 스크립트
-- user_profiles_id_seq 및 기타 누락된 시퀀스 생성

-- 1. user_profiles 테이블 시퀀스 수정
DROP SEQUENCE IF EXISTS user_profiles_id_seq CASCADE;
CREATE SEQUENCE user_profiles_id_seq;

-- 현재 최대값으로 시퀀스 시작값 설정
SELECT setval('user_profiles_id_seq', COALESCE((SELECT MAX(id) FROM user_profiles), 1));

-- id 컬럼의 기본값을 시퀀스로 설정
ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT nextval('user_profiles_id_seq');

-- 시퀀스 소유권을 테이블 컬럼에 할당
ALTER SEQUENCE user_profiles_id_seq OWNED BY user_profiles.id;

-- 2. 다른 주요 테이블들의 시퀀스도 확인하고 생성

-- products 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'products_id_seq') THEN
        CREATE SEQUENCE products_id_seq;
        PERFORM setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
        ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');
        ALTER SEQUENCE products_id_seq OWNED BY products.id;
        RAISE NOTICE 'products_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- customers 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'customers_id_seq') THEN
        CREATE SEQUENCE customers_id_seq;
        PERFORM setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1));
        ALTER TABLE customers ALTER COLUMN id SET DEFAULT nextval('customers_id_seq');
        ALTER SEQUENCE customers_id_seq OWNED BY customers.id;
        RAISE NOTICE 'customers_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- work_orders 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'work_orders_id_seq') THEN
        CREATE SEQUENCE work_orders_id_seq;
        PERFORM setval('work_orders_id_seq', COALESCE((SELECT MAX(id) FROM work_orders), 1));
        ALTER TABLE work_orders ALTER COLUMN id SET DEFAULT nextval('work_orders_id_seq');
        ALTER SEQUENCE work_orders_id_seq OWNED BY work_orders.id;
        RAISE NOTICE 'work_orders_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- status_definitions 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'status_definitions_id_seq') THEN
        CREATE SEQUENCE status_definitions_id_seq;
        PERFORM setval('status_definitions_id_seq', COALESCE((SELECT MAX(id) FROM status_definitions), 1));
        ALTER TABLE status_definitions ALTER COLUMN id SET DEFAULT nextval('status_definitions_id_seq');
        ALTER SEQUENCE status_definitions_id_seq OWNED BY status_definitions.id;
        RAISE NOTICE 'status_definitions_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- team_assignments 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'team_assignments_id_seq') THEN
        CREATE SEQUENCE team_assignments_id_seq;
        PERFORM setval('team_assignments_id_seq', COALESCE((SELECT MAX(id) FROM team_assignments), 1));
        ALTER TABLE team_assignments ALTER COLUMN id SET DEFAULT nextval('team_assignments_id_seq');
        ALTER SEQUENCE team_assignments_id_seq OWNED BY team_assignments.id;
        RAISE NOTICE 'team_assignments_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- product_groups 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'product_groups_id_seq') THEN
        CREATE SEQUENCE product_groups_id_seq;
        PERFORM setval('product_groups_id_seq', COALESCE((SELECT MAX(id) FROM product_groups), 1));
        ALTER TABLE product_groups ALTER COLUMN id SET DEFAULT nextval('product_groups_id_seq');
        ALTER SEQUENCE product_groups_id_seq OWNED BY product_groups.id;
        RAISE NOTICE 'product_groups_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- user_roles 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'user_roles_id_seq') THEN
        CREATE SEQUENCE user_roles_id_seq;
        PERFORM setval('user_roles_id_seq', COALESCE((SELECT MAX(id) FROM user_roles), 1));
        ALTER TABLE user_roles ALTER COLUMN id SET DEFAULT nextval('user_roles_id_seq');
        ALTER SEQUENCE user_roles_id_seq OWNED BY user_roles.id;
        RAISE NOTICE 'user_roles_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- permissions 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'permissions_id_seq') THEN
        CREATE SEQUENCE permissions_id_seq;
        PERFORM setval('permissions_id_seq', COALESCE((SELECT MAX(id) FROM permissions), 1));
        ALTER TABLE permissions ALTER COLUMN id SET DEFAULT nextval('permissions_id_seq');
        ALTER SEQUENCE permissions_id_seq OWNED BY permissions.id;
        RAISE NOTICE 'permissions_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- role_permissions 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'role_permissions_id_seq') THEN
        CREATE SEQUENCE role_permissions_id_seq;
        PERFORM setval('role_permissions_id_seq', COALESCE((SELECT MAX(id) FROM role_permissions), 1));
        ALTER TABLE role_permissions ALTER COLUMN id SET DEFAULT nextval('role_permissions_id_seq');
        ALTER SEQUENCE role_permissions_id_seq OWNED BY role_permissions.id;
        RAISE NOTICE 'role_permissions_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- line_notification_settings 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'line_notification_settings_id_seq') THEN
        CREATE SEQUENCE line_notification_settings_id_seq;
        PERFORM setval('line_notification_settings_id_seq', COALESCE((SELECT MAX(id) FROM line_notification_settings), 1));
        ALTER TABLE line_notification_settings ALTER COLUMN id SET DEFAULT nextval('line_notification_settings_id_seq');
        ALTER SEQUENCE line_notification_settings_id_seq OWNED BY line_notification_settings.id;
        RAISE NOTICE 'line_notification_settings_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- notification_templates 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'notification_templates_id_seq') THEN
        CREATE SEQUENCE notification_templates_id_seq;
        PERFORM setval('notification_templates_id_seq', COALESCE((SELECT MAX(id) FROM notification_templates), 1));
        ALTER TABLE notification_templates ALTER COLUMN id SET DEFAULT nextval('notification_templates_id_seq');
        ALTER SEQUENCE notification_templates_id_seq OWNED BY notification_templates.id;
        RAISE NOTICE 'notification_templates_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- notification_logs 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'notification_logs_id_seq') THEN
        CREATE SEQUENCE notification_logs_id_seq;
        PERFORM setval('notification_logs_id_seq', COALESCE((SELECT MAX(id) FROM notification_logs), 1));
        ALTER TABLE notification_logs ALTER COLUMN id SET DEFAULT nextval('notification_logs_id_seq');
        ALTER SEQUENCE notification_logs_id_seq OWNED BY notification_logs.id;
        RAISE NOTICE 'notification_logs_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- admin_settings 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'admin_settings_id_seq') THEN
        CREATE SEQUENCE admin_settings_id_seq;
        PERFORM setval('admin_settings_id_seq', COALESCE((SELECT MAX(id) FROM admin_settings), 1));
        ALTER TABLE admin_settings ALTER COLUMN id SET DEFAULT nextval('admin_settings_id_seq');
        ALTER SEQUENCE admin_settings_id_seq OWNED BY admin_settings.id;
        RAISE NOTICE 'admin_settings_id_seq 시퀀스가 생성되었습니다.';
    END IF;
END
$$;

-- 시퀀스 상태 확인
SELECT 
    schemaname, 
    sequencename, 
    last_value,
    increment_by
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename; 