-- 누락된 관리자 패널 테이블들 생성

-- 1. team_assignments 테이블 생성
CREATE TABLE IF NOT EXISTS team_assignments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    role_in_team VARCHAR(50) NOT NULL DEFAULT 'member',
    responsibilities TEXT,
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. status_definitions 테이블 생성
CREATE TABLE IF NOT EXISTS status_definitions (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- customer, product, process, equipment
    status_key VARCHAR(100) NOT NULL,
    status_label VARCHAR(100) NOT NULL,
    status_color VARCHAR(7) DEFAULT '#6B7280',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, status_key)
);

-- 3. product_groups 테이블 생성
CREATE TABLE IF NOT EXISTS product_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) UNIQUE NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    pattern_regex TEXT,
    group_color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. plc_devices 테이블 생성
CREATE TABLE IF NOT EXISTS plc_devices (
    id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    ip_address INET,
    port INTEGER DEFAULT 502,
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    last_communication TIMESTAMP WITH TIME ZONE,
    configuration JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. line_notification_settings 테이블 생성
CREATE TABLE IF NOT EXISTS line_notification_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL,
    channel_access_token TEXT,
    channel_secret TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. notification_templates 테이블 생성
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- line, email, sms
    trigger_event VARCHAR(100) NOT NULL,
    message_template TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. admin_settings 테이블 생성
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'text', -- text, number, boolean, json
    is_sensitive BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, setting_key)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_team_assignments_user_id ON team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team_name ON team_assignments(team_name);
CREATE INDEX IF NOT EXISTS idx_status_definitions_category ON status_definitions(category);
CREATE INDEX IF NOT EXISTS idx_product_groups_code ON product_groups(group_code);
CREATE INDEX IF NOT EXISTS idx_plc_devices_status ON plc_devices(connection_status);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER update_team_assignments_updated_at BEFORE UPDATE ON team_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_status_definitions_updated_at BEFORE UPDATE ON status_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_groups_updated_at BEFORE UPDATE ON product_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plc_devices_updated_at BEFORE UPDATE ON plc_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_line_notification_settings_updated_at BEFORE UPDATE ON line_notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 데이터 삽입
INSERT INTO status_definitions (category, status_key, status_label, status_color, display_order) VALUES
-- 고객 상태
('customer', 'active', '활성', '#10B981', 1),
('customer', 'inactive', '비활성', '#6B7280', 2),
('customer', 'potential', '잠재고객', '#F59E0B', 3),
('customer', 'suspended', '거래중단', '#EF4444', 4),

-- 제품 상태  
('product', 'pending', '대기', '#6B7280', 1),
('product', 'in_process', '가공중', '#F59E0B', 2),
('product', 'completed', '완료', '#10B981', 3),
('product', 'shipped', '출고', '#3B82F6', 4),
('product', 'cancelled', '취소', '#EF4444', 5),

-- 공정 상태
('process', 'waiting', '대기', '#6B7280', 1),
('process', 'processing', '진행중', '#F59E0B', 2),
('process', 'completed', '완료', '#10B981', 3),
('process', 'paused', '일시정지', '#8B5CF6', 4),
('process', 'error', '오류', '#EF4444', 5),

-- 설비 상태
('equipment', 'running', '가동중', '#10B981', 1),
('equipment', 'maintenance', '보전중', '#F59E0B', 2),
('equipment', 'stopped', '정지', '#EF4444', 3),
('equipment', 'idle', '대기', '#6B7280', 4)
ON CONFLICT (category, status_key) DO NOTHING;

INSERT INTO product_groups (group_code, group_name, pattern_regex, group_color, description) VALUES
('ELEC', '전자부품', '^(E|ELEC)', '#3B82F6', '전자 관련 제품'),
('MECH', '기계부품', '^(M|MECH)', '#10B981', '기계 관련 제품'),
('CHEM', '화학제품', '^(C|CHEM)', '#F59E0B', '화학 관련 제품'),
('AUTO', '자동차부품', '^(A|AUTO)', '#EF4444', '자동차 관련 제품')
ON CONFLICT (group_code) DO NOTHING;

INSERT INTO plc_devices (device_name, device_type, ip_address, port, connection_status) VALUES
('PLC-001', 'Siemens S7-1200', '192.168.1.100', 502, 'connected'),
('PLC-002', 'Mitsubishi FX5U', '192.168.1.101', 502, 'disconnected'),
('PLC-003', 'Allen Bradley CompactLogix', '192.168.1.102', 44818, 'connected')
ON CONFLICT DO NOTHING;

INSERT INTO admin_settings (category, setting_key, setting_value, data_type, description) VALUES
('system', 'maintenance_mode', 'false', 'boolean', '시스템 점검 모드'),
('system', 'max_users', '100', 'number', '최대 사용자 수'),
('notification', 'email_enabled', 'true', 'boolean', '이메일 알림 활성화'),
('notification', 'line_enabled', 'false', 'boolean', 'LINE 알림 활성화'),
('backup', 'auto_backup', 'true', 'boolean', '자동 백업 활성화'),
('backup', 'backup_interval', '24', 'number', '백업 주기 (시간)')
ON CONFLICT (category, setting_key) DO NOTHING;

-- RLS 정책 비활성화 (개발용)
ALTER TABLE team_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE plc_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON team_assignments TO anon, authenticated;
GRANT ALL ON status_definitions TO anon, authenticated;
GRANT ALL ON product_groups TO anon, authenticated;
GRANT ALL ON plc_devices TO anon, authenticated;
GRANT ALL ON line_notification_settings TO anon, authenticated;
GRANT ALL ON notification_templates TO anon, authenticated;
GRANT ALL ON admin_settings TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 