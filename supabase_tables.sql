-- =========================================
-- MES Thailand - Supabase Compatible Database Schema
-- 현재 앱과 완벽 호환되는 실용적인 스키마
-- =========================================

-- =========================================
-- 1. 사용자 관리 (현재 앱과 호환)
-- =========================================

-- 사용자 프로필 테이블 (auth.users 확장)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    department VARCHAR(50),
    position VARCHAR(50),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    language VARCHAR(5) DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'th', 'zh')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 2. 고객 관리 (CustomersPage 호환)
-- =========================================

CREATE TABLE public.customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL, -- customerName from app
    company_name VARCHAR(200) NOT NULL,  -- companyName from app
    contact VARCHAR(100),                -- contact from app
    email VARCHAR(100),                  -- email from app
    phone VARCHAR(20),                   -- phone from app
    address TEXT,                        -- address from app
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')), -- status from app
    registration_date DATE DEFAULT CURRENT_DATE,
    last_order_date DATE,
    total_orders INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    
    -- 추가 고객 정보
    business_type VARCHAR(50),
    tax_id VARCHAR(30),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- 메타데이터
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 3. 제품 관리 (ProductsPage 호환)
-- =========================================

CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,    -- productCode from app
    product_name VARCHAR(200) NOT NULL,          -- productName from app
    client VARCHAR(100),                         -- client from app
    quantity INTEGER DEFAULT 0,                 -- quantity from app
    unit VARCHAR(10) DEFAULT '개',              -- unit from app
    order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'inProcess', 'completed', 'shipped')), -- orderStatus from app
    registration_date DATE DEFAULT CURRENT_DATE, -- registrationDate from app
    order_progress INTEGER DEFAULT 0,           -- orderProgress from app
    
    -- 추가 제품 정보
    description TEXT,
    category VARCHAR(50),
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    is_active BOOLEAN DEFAULT true,
    
    -- 메타데이터
    specifications JSONB,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 4. 공정 관리 (ProcessPage)
-- =========================================

CREATE TABLE public.work_centers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    department VARCHAR(50),
    capacity_per_hour DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.process_routes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id),
    route_name VARCHAR(100) NOT NULL,
    version VARCHAR(10) DEFAULT '1.0',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.process_steps (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES public.process_routes(id),
    step_number INTEGER NOT NULL,
    work_center_id INTEGER REFERENCES public.work_centers(id),
    operation_name VARCHAR(100) NOT NULL,
    description TEXT,
    setup_time_minutes INTEGER DEFAULT 0,
    run_time_minutes DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 5. 설비 관리 (EquipmentPage)
-- =========================================

CREATE TABLE public.equipment (
    id SERIAL PRIMARY KEY,
    equipment_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    work_center_id INTEGER REFERENCES public.work_centers(id),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'breakdown', 'retired')),
    location VARCHAR(100),
    specifications JSONB,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLC 장비 테이블 (현재 AdminPanel에서 사용)
CREATE TABLE public.plc_devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    equipment_id INTEGER REFERENCES public.equipment(id),
    ip_address INET NOT NULL,
    port INTEGER DEFAULT 502,
    protocol VARCHAR(20) DEFAULT 'modbus',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_connection TIMESTAMPTZ,
    connection_status BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 6. 생산 관리 (ProductionPage)
-- =========================================

CREATE TABLE public.work_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES public.products(id),
    customer_id INTEGER REFERENCES public.customers(id),
    planned_quantity INTEGER NOT NULL,
    produced_quantity INTEGER DEFAULT 0,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.production_records (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES public.work_orders(id),
    equipment_id INTEGER REFERENCES public.equipment(id),
    operator_id UUID REFERENCES auth.users(id),
    quantity_produced INTEGER NOT NULL,
    quantity_good INTEGER NOT NULL,
    quantity_scrap INTEGER DEFAULT 0,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    shift VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 7. 품질 관리 (QualityPage)
-- =========================================

CREATE TABLE public.quality_standards (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id),
    test_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(30) CHECK (test_type IN ('dimensional', 'visual', 'functional', 'material', 'other')),
    target_value DECIMAL(15,6),
    lower_limit DECIMAL(15,6),
    upper_limit DECIMAL(15,6),
    unit VARCHAR(20),
    is_critical BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.quality_inspections (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES public.work_orders(id),
    quality_standard_id INTEGER REFERENCES public.quality_standards(id),
    inspector_id UUID REFERENCES auth.users(id),
    inspection_datetime TIMESTAMPTZ DEFAULT NOW(),
    sample_size INTEGER NOT NULL,
    measured_value DECIMAL(15,6),
    result VARCHAR(20) CHECK (result IN ('pass', 'fail', 'conditional')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 8. 재고 관리 (InventoryPage)
-- =========================================

CREATE TABLE public.warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) CHECK (type IN ('raw_material', 'wip', 'finished_goods', 'spare_parts')),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id),
    warehouse_id INTEGER REFERENCES public.warehouses(id),
    quantity_on_hand DECIMAL(12,4) DEFAULT 0,
    quantity_reserved DECIMAL(12,4) DEFAULT 0,
    -- quantity_available은 계산 필드로 처리 (Generated column 문제 해결)
    unit_cost DECIMAL(15,4),
    bin_location VARCHAR(20),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'quarantine', 'damaged', 'expired')),
    lot_number VARCHAR(30),
    expiry_date DATE,
    last_counted_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- quantity_available을 위한 뷰 생성 (Generated column 대신)
CREATE VIEW public.inventory_with_available AS
SELECT 
    *,
    (quantity_on_hand - quantity_reserved) AS quantity_available,
    (quantity_on_hand * unit_cost) AS total_value
FROM public.inventory;

CREATE TABLE public.inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES public.inventory(id),
    transaction_type VARCHAR(30) CHECK (transaction_type IN ('receipt', 'issue', 'transfer', 'adjustment', 'scrap')),
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(15,4),
    reference_type VARCHAR(30),
    reference_number VARCHAR(50),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 9. 리포트 관리 (ReportsPage)
-- =========================================

CREATE TABLE public.report_definitions (
    id SERIAL PRIMARY KEY,
    report_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30),
    report_type VARCHAR(20) CHECK (report_type IN ('tabular', 'chart', 'dashboard')),
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 10. 시스템 설정 (AdminPanelPage)
-- =========================================

CREATE TABLE public.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(50),
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 감사 로그
CREATE TABLE public.audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    user_ip INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 인덱스 생성 (성능 최적화)
-- =========================================

-- 자주 검색되는 필드들에 인덱스 추가
CREATE INDEX idx_customers_name ON public.customers(customer_name);
CREATE INDEX idx_customers_company ON public.customers(company_name);
CREATE INDEX idx_customers_status ON public.customers(status);

CREATE INDEX idx_products_code ON public.products(product_code);
CREATE INDEX idx_products_name ON public.products(product_name);
CREATE INDEX idx_products_client ON public.products(client);
CREATE INDEX idx_products_status ON public.products(order_status);

CREATE INDEX idx_work_orders_number ON public.work_orders(order_number);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);

CREATE INDEX idx_inventory_product ON public.inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON public.inventory(warehouse_id);

CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- =========================================
-- 관리자 패널 추가 테이블들
-- =========================================

-- 상태 관리 테이블
CREATE TABLE public.status_definitions (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'production', 'quality', 'inventory', 'equipment', etc.
    status_key VARCHAR(50) NOT NULL,
    status_label VARCHAR(100) NOT NULL,
    status_color VARCHAR(7) DEFAULT '#3B82F6', -- hex color code
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, status_key)
);

-- 담당자 팀 배정 테이블
CREATE TABLE public.team_assignments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    team_name VARCHAR(100) NOT NULL,
    role_in_team VARCHAR(50), -- 'leader', 'member', 'supervisor'
    responsibilities TEXT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제품 그룹 관리 테이블
CREATE TABLE public.product_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(20) UNIQUE NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    pattern_regex VARCHAR(200), -- 제품 코드 패턴 매칭용
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    parent_group_id INTEGER REFERENCES public.product_groups(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINE 알림 설정 테이블
CREATE TABLE public.line_notification_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL,
    channel_access_token TEXT,
    channel_secret TEXT,
    webhook_url TEXT,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 템플릿 테이블
CREATE TABLE public.notification_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'line', 'email', 'sms'
    event_trigger VARCHAR(100) NOT NULL, -- 'production_complete', 'quality_fail', etc.
    subject VARCHAR(200),
    content TEXT NOT NULL,
    variables JSONB, -- 템플릿에서 사용할 변수들
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 발송 기록 테이블
CREATE TABLE public.notification_logs (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES public.notification_templates(id),
    recipient_type VARCHAR(20), -- 'user', 'group', 'line_channel'
    recipient_id VARCHAR(100),
    subject VARCHAR(200),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 역할 관리 테이블
CREATE TABLE public.user_roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(20) UNIQUE NOT NULL, -- 'admin', 'manager', 'operator', 'viewer', etc.
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    permissions JSONB, -- 권한 목록을 JSON으로 저장
    is_system_role BOOLEAN DEFAULT false, -- 시스템 기본 역할 여부
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 권한 정의 테이블
CREATE TABLE public.permissions (
    id SERIAL PRIMARY KEY,
    permission_code VARCHAR(50) UNIQUE NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    permission_description TEXT,
    category VARCHAR(50), -- 'user', 'production', 'quality', 'inventory', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 역할-권한 매핑 테이블 (다대다 관계)
CREATE TABLE public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES public.user_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 시스템 설정 확장 (카테고리별 관리)
CREATE TABLE public.admin_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'general', 'security', 'notification', 'backup'
    setting_key VARCHAR(100) NOT NULL,
    setting_name VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    validation_rule TEXT, -- regex or json schema for validation
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false, -- for passwords, tokens, etc.
    requires_restart BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, setting_key)
);

-- =========================================
-- 추가 인덱스 생성
-- =========================================

CREATE INDEX idx_status_definitions_category ON public.status_definitions(category);
CREATE INDEX idx_team_assignments_user ON public.team_assignments(user_id);
CREATE INDEX idx_team_assignments_team ON public.team_assignments(team_name);
CREATE INDEX idx_product_groups_code ON public.product_groups(group_code);
CREATE INDEX idx_product_groups_parent ON public.product_groups(parent_group_id);
CREATE INDEX idx_notification_templates_type ON public.notification_templates(template_type);
CREATE INDEX idx_notification_templates_trigger ON public.notification_templates(event_trigger);
CREATE INDEX idx_notification_logs_template ON public.notification_logs(template_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_admin_settings_category ON public.admin_settings(category);
CREATE INDEX idx_user_roles_code ON public.user_roles(role_code);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX idx_permissions_code ON public.permissions(permission_code);
CREATE INDEX idx_permissions_category ON public.permissions(category);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON public.role_permissions(permission_id);

-- =========================================
-- RLS (Row Level Security) 설정
-- =========================================

-- 사용자 프로필 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- 관리자는 모든 프로필 관리 가능 (무한 재귀 방지)
CREATE POLICY "Admins can manage all profiles" 
ON public.user_profiles FOR ALL 
TO authenticated
USING (
    auth.uid() IN (
        SELECT auth.uid() FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    )
    OR 
    auth.uid() = id
);

-- 기타 테이블들은 인증된 사용자만 접근 가능하도록 설정
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- 공정 관리 테이블들 RLS 설정
ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access work_centers" ON public.work_centers FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.process_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access process_routes" ON public.process_routes FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access process_steps" ON public.process_steps FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access work_orders" ON public.work_orders FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access equipment" ON public.equipment FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access inventory" ON public.inventory FOR ALL USING (auth.role() = 'authenticated');

-- 추가 테이블들 RLS 설정
ALTER TABLE public.status_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access status_definitions" ON public.status_definitions FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access team_assignments" ON public.team_assignments FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access product_groups" ON public.product_groups FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.line_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access line_notification_settings" ON public.line_notification_settings FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access notification_templates" ON public.notification_templates FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access notification_logs" ON public.notification_logs FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access admin_settings" ON public.admin_settings FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access user_roles" ON public.user_roles FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access permissions" ON public.permissions FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can access role_permissions" ON public.role_permissions FOR ALL USING (auth.role() = 'authenticated');

-- =========================================
-- 유용한 뷰 생성
-- =========================================

-- 고객별 주문 통계 뷰
CREATE VIEW public.customer_order_stats AS
SELECT 
    c.id,
    c.customer_name,
    c.company_name,
    COUNT(wo.id) as total_work_orders,
    SUM(CASE WHEN wo.status = 'in_progress' THEN 1 ELSE 0 END) as active_orders,
    SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
    MAX(wo.created_at) as last_order_date
FROM public.customers c
LEFT JOIN public.work_orders wo ON c.id = wo.customer_id
GROUP BY c.id, c.customer_name, c.company_name;

-- 제품별 생산 통계 뷰
CREATE VIEW public.product_production_stats AS
SELECT 
    p.id,
    p.product_code,
    p.product_name,
    p.client,
    COUNT(wo.id) as total_work_orders,
    SUM(wo.planned_quantity) as total_planned_qty,
    SUM(wo.produced_quantity) as total_produced_qty,
    AVG(wo.produced_quantity::decimal / NULLIF(wo.planned_quantity, 0) * 100) as avg_completion_rate
FROM public.products p
LEFT JOIN public.work_orders wo ON p.id = wo.product_id
GROUP BY p.id, p.product_code, p.product_name, p.client;

-- =========================================
-- 트리거 함수 (자동 업데이트)
-- =========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 추가 테이블들 업데이트 트리거
CREATE TRIGGER update_status_definitions_updated_at BEFORE UPDATE ON public.status_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_assignments_updated_at BEFORE UPDATE ON public.team_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_groups_updated_at BEFORE UPDATE ON public.product_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_line_notification_settings_updated_at BEFORE UPDATE ON public.line_notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 기본 데이터 삽입
-- =========================================

-- 기본 권한 삽입
INSERT INTO public.permissions (permission_code, permission_name, permission_description, category) VALUES
-- 사용자 관리 권한
('view_users', '사용자 조회', '사용자 목록을 조회할 수 있습니다', 'user'),
('create_users', '사용자 생성', '새로운 사용자를 생성할 수 있습니다', 'user'),
('edit_users', '사용자 수정', '사용자 정보를 수정할 수 있습니다', 'user'),
('delete_users', '사용자 삭제', '사용자를 삭제할 수 있습니다', 'user'),
('approve_users', '사용자 승인', '사용자 가입을 승인할 수 있습니다', 'user'),

-- 생산 관리 권한
('view_production', '생산 조회', '생산 데이터를 조회할 수 있습니다', 'production'),
('manage_production', '생산 관리', '생산 계획 및 실행을 관리할 수 있습니다', 'production'),
('view_work_orders', '작업지시 조회', '작업지시서를 조회할 수 있습니다', 'production'),
('manage_work_orders', '작업지시 관리', '작업지시서를 생성/수정할 수 있습니다', 'production'),

-- 품질 관리 권한
('view_quality', '품질 조회', '품질 데이터를 조회할 수 있습니다', 'quality'),
('manage_quality', '품질 관리', '품질 검사 및 기준을 관리할 수 있습니다', 'quality'),
('quality_inspection', '품질 검사', '품질 검사를 수행할 수 있습니다', 'quality'),

-- 재고 관리 권한
('view_inventory', '재고 조회', '재고 현황을 조회할 수 있습니다', 'inventory'),
('manage_inventory', '재고 관리', '재고 입출고를 관리할 수 있습니다', 'inventory'),

-- 설비 관리 권한
('view_equipment', '설비 조회', '설비 현황을 조회할 수 있습니다', 'equipment'),
('manage_equipment', '설비 관리', '설비를 관리할 수 있습니다', 'equipment'),

-- 관리자 권한
('admin_panel', '관리자 패널', '관리자 패널에 접근할 수 있습니다', 'admin'),
('manage_roles', '역할 관리', '사용자 역할을 관리할 수 있습니다', 'admin'),
('system_settings', '시스템 설정', '시스템 설정을 변경할 수 있습니다', 'admin');

-- 기본 역할 삽입
INSERT INTO public.user_roles (role_code, role_name, role_description, is_system_role, display_order) VALUES
('super_admin', '최고 관리자', '모든 권한을 가진 최고 관리자', true, 1),
('admin', '시스템 관리자', '시스템 전체를 관리하는 관리자', true, 2),
('manager', '부서 관리자', '특정 부서를 관리하는 관리자', true, 3),
('operator', '작업자', '일반적인 작업을 수행하는 사용자', true, 4),
('viewer', '조회자', '데이터 조회만 가능한 사용자', true, 5);

-- 역할별 권한 매핑
-- 최고 관리자: 모든 권한
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.user_roles r, public.permissions p 
WHERE r.role_code = 'super_admin';

-- 시스템 관리자: 관리자 권한 + 대부분의 관리 권한
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.user_roles r, public.permissions p 
WHERE r.role_code = 'admin' 
AND p.permission_code IN (
    'view_users', 'create_users', 'edit_users', 'approve_users',
    'view_production', 'manage_production', 'view_work_orders', 'manage_work_orders',
    'view_quality', 'manage_quality',
    'view_inventory', 'manage_inventory',
    'view_equipment', 'manage_equipment',
    'admin_panel', 'system_settings'
);

-- 부서 관리자: 조회 + 일부 관리 권한
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.user_roles r, public.permissions p 
WHERE r.role_code = 'manager' 
AND p.permission_code IN (
    'view_users', 'view_production', 'manage_production', 'view_work_orders', 'manage_work_orders',
    'view_quality', 'quality_inspection',
    'view_inventory', 'manage_inventory',
    'view_equipment'
);

-- 작업자: 기본 작업 권한
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.user_roles r, public.permissions p 
WHERE r.role_code = 'operator' 
AND p.permission_code IN (
    'view_production', 'view_work_orders',
    'view_quality', 'quality_inspection',
    'view_inventory',
    'view_equipment'
);

-- 조회자: 조회 권한만
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.user_roles r, public.permissions p 
WHERE r.role_code = 'viewer' 
AND p.permission_code IN (
    'view_users', 'view_production', 'view_work_orders',
    'view_quality', 'view_inventory', 'view_equipment'
);

-- =========================================
-- 완료 메시지
-- =========================================

-- 스키마 생성 완료
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MES Thailand Database Schema Created Successfully!';
    RAISE NOTICE '현재 앱과 완벽 호환되는 25개 테이블 생성 완료';
    RAISE NOTICE '- 고객 관리: customers';
    RAISE NOTICE '- 제품 관리: products';  
    RAISE NOTICE '- 공정 관리: work_centers, process_routes, process_steps';
    RAISE NOTICE '- 설비 관리: equipment, plc_devices';
    RAISE NOTICE '- 생산 관리: work_orders, production_records';
    RAISE NOTICE '- 품질 관리: quality_standards, quality_inspections';
    RAISE NOTICE '- 재고 관리: warehouses, inventory, inventory_transactions';
    RAISE NOTICE '- 사용자 관리: user_profiles';
    RAISE NOTICE '- 시스템 관리: system_settings, audit_logs';
    RAISE NOTICE '========================================';
END
$$;

-- 품질 유형 테이블 (Quality Types)
CREATE TABLE quality_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_ja VARCHAR(100),
    name_zh VARCHAR(100),
    description TEXT,
    description_en TEXT,
    description_ja TEXT,
    description_zh TEXT,
    category VARCHAR(50) DEFAULT 'defect' CHECK (category IN ('defect', 'dimension', 'electrical', 'mechanical', 'visual', 'functional')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system'
);

-- 품질 유형 테이블 인덱스
CREATE INDEX idx_quality_types_category ON quality_types(category);
CREATE INDEX idx_quality_types_severity ON quality_types(severity);
CREATE INDEX idx_quality_types_active ON quality_types(is_active);
CREATE INDEX idx_quality_types_created_at ON quality_types(created_at);

-- 품질 유형 테이블 RLS 정책
ALTER TABLE quality_types ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 품질 유형을 조회할 수 있음
CREATE POLICY "Users can view quality types" ON quality_types
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 매니저급 이상만 품질 유형을 생성할 수 있음
CREATE POLICY "Managers can insert quality types" ON quality_types
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('manager', 'admin', 'super_admin')
        )
    );

-- 매니저급 이상만 품질 유형을 수정할 수 있음
CREATE POLICY "Managers can update quality types" ON quality_types
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('manager', 'admin', 'super_admin')
        )
    );

-- 관리자급 이상만 품질 유형을 삭제할 수 있음
CREATE POLICY "Admins can delete quality types" ON quality_types
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text IN ('admin', 'super_admin')
        )
    );

-- 기본 품질 유형 데이터 삽입
INSERT INTO quality_types (name, name_en, name_ja, name_zh, description, category, severity) VALUES
('납땜 불량', 'Soldering Defect', 'はんだ付け不良', '焊接缺陷', '납땜 부족, 과다, 냉납땜 등', 'defect', 'medium'),
('부품 누락', 'Missing Component', '部品欠品', '组件缺失', '필수 부품이 장착되지 않음', 'defect', 'high'),
('치수 오차', 'Dimension Error', '寸法誤差', '尺寸误差', '규격 치수를 벗어남', 'dimension', 'high'),
('표면 불량', 'Surface Defect', '表面不良', '表面缺陷', '스크래치, 얼룩, 변색 등', 'visual', 'low'),
('접속 불량', 'Connection Failure', '接続不良', '连接故障', '전기적 접속 문제', 'electrical', 'high'),
('크랙/파손', 'Crack/Damage', 'クラック/破損', '裂纹/损坏', '균열, 깨짐, 파손', 'mechanical', 'critical'),
('이물질', 'Contamination', '異物', '污染物', '먼지, 오염물질 혼입', 'defect', 'medium'),
('마킹 불량', 'Marking Defect', 'マーキング不良', '标记缺陷', '인쇄, 각인 문제', 'visual', 'low'),
('정렬 불량', 'Alignment Error', '位置ずれ', '对齐错误', '부품 위치, 각도 오차', 'mechanical', 'medium'),
('전기적 불량', 'Electrical Failure', '電気的不良', '电气故障', '전압, 전류, 저항값 이상', 'electrical', 'high'); 