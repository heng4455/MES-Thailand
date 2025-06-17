-- =========================================
-- MES Thailand - Complete Database Schema
-- =========================================

-- 1. 사용자 및 권한 관리 (Users & Authentication)
-- =========================================

-- 사용자 프로필 테이블 (기본 auth.users 확장)
CREATE TABLE user_profiles (
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
    last_login TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 권한 관리 테이블
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 역할별 권한 매핑
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id),
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 2. 고객 관리 (Customer Management)
-- =========================================

-- 고객 그룹 테이블
CREATE TABLE customer_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- 결제조건 (일)
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객사 테이블
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_name_en VARCHAR(200),
    customer_group_id INTEGER REFERENCES customer_groups(id),
    business_type VARCHAR(50),
    tax_id VARCHAR(30),
    
    -- 주소 정보
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Thailand',
    
    -- 연락처 정보
    main_phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    
    -- 담당자 정보
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    
    -- 비즈니스 정보
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- 상태 및 메타데이터
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    tags TEXT[], -- 태그 배열
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 고객 연락처 테이블 (다수의 연락처 지원)
CREATE TABLE customer_contacts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50),
    department VARCHAR(50),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    email VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 3. 제품 관리 (Product Management)
-- =========================================

-- 제품 카테고리 테이블
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_th VARCHAR(100),
    name_zh VARCHAR(100),
    parent_id INTEGER REFERENCES product_categories(id),
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 제품 마스터 테이블
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    name_th VARCHAR(200),
    name_zh VARCHAR(200),
    category_id INTEGER REFERENCES product_categories(id),
    
    -- 제품 기본 정보
    description TEXT,
    specifications JSONB, -- 제품 사양 (JSON 형태)
    unit VARCHAR(20) DEFAULT 'pcs',
    weight DECIMAL(10,3),
    dimensions JSONB, -- {length, width, height, unit}
    
    -- 가격 정보
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- 재고 관리
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 1,
    
    -- 품질 관리
    qc_required BOOLEAN DEFAULT false,
    shelf_life_days INTEGER,
    
    -- 생산 정보
    is_manufactured BOOLEAN DEFAULT true, -- 자체 생산 여부
    standard_production_time INTEGER, -- 표준 생산시간 (분)
    
    -- 파일 및 이미지
    image_url TEXT,
    drawing_url TEXT,
    documents JSONB, -- 관련 문서들
    
    -- 상태 및 메타데이터
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    barcode VARCHAR(50),
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BOM (Bill of Materials) 테이블
CREATE TABLE product_bom (
    id SERIAL PRIMARY KEY,
    parent_product_id INTEGER REFERENCES products(id),
    child_product_id INTEGER REFERENCES products(id),
    quantity DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    is_optional BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 4. 공정 관리 (Process Management)
-- =========================================

-- 워크센터 테이블
CREATE TABLE work_centers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_th VARCHAR(100),
    name_zh VARCHAR(100),
    description TEXT,
    
    -- 위치 정보
    location VARCHAR(100),
    floor INTEGER,
    department VARCHAR(50),
    
    -- 용량 정보
    capacity_per_hour DECIMAL(10,2),
    efficiency_rate DECIMAL(5,2) DEFAULT 100.00,
    setup_time_minutes INTEGER DEFAULT 0,
    
    -- 비용 정보
    hourly_rate DECIMAL(10,2),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 공정 라우팅 테이블
CREATE TABLE process_routes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    route_name VARCHAR(100) NOT NULL,
    version VARCHAR(10) DEFAULT '1.0',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 공정 단계 테이블
CREATE TABLE process_steps (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES process_routes(id),
    step_number INTEGER NOT NULL,
    work_center_id INTEGER REFERENCES work_centers(id),
    operation_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 시간 정보
    setup_time_minutes INTEGER DEFAULT 0,
    run_time_minutes DECIMAL(10,2) NOT NULL,
    queue_time_minutes INTEGER DEFAULT 0,
    
    -- 품질 관리
    qc_required BOOLEAN DEFAULT false,
    qc_sample_size INTEGER,
    
    -- 작업 지시
    work_instructions TEXT,
    tools_required TEXT[],
    skills_required TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 5. 설비 관리 (Equipment Management)
-- =========================================

-- 설비 카테고리
CREATE TABLE equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 설비 마스터
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    equipment_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES equipment_categories(id),
    work_center_id INTEGER REFERENCES work_centers(id),
    
    -- 기본 정보
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    installation_date DATE,
    warranty_expiry DATE,
    
    -- 기술 사양
    specifications JSONB,
    capacity DECIMAL(10,2),
    power_consumption DECIMAL(10,2),
    
    -- 위치 정보
    location VARCHAR(100),
    floor INTEGER,
    
    -- 재무 정보
    purchase_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2),
    
    -- 유지보수 정보
    maintenance_interval_days INTEGER DEFAULT 30,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'breakdown', 'retired')),
    availability_rate DECIMAL(5,2) DEFAULT 100.00,
    
    -- 메타데이터
    notes TEXT,
    documents JSONB,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 설비 유지보수 기록
CREATE TABLE equipment_maintenance (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id),
    maintenance_type VARCHAR(30) CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'upgrade')),
    
    -- 일정 정보
    scheduled_date DATE,
    start_datetime TIMESTAMP WITH TIME ZONE,
    end_datetime TIMESTAMP WITH TIME ZONE,
    duration_hours DECIMAL(6,2),
    
    -- 작업 정보
    description TEXT NOT NULL,
    work_performed TEXT,
    parts_used JSONB, -- [{part_name, quantity, cost}]
    labor_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- 담당자
    technician_id UUID REFERENCES auth.users(id),
    supervisor_id UUID REFERENCES auth.users(id),
    
    -- 결과
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    completion_notes TEXT,
    next_maintenance_date DATE,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLC 설정 테이블
CREATE TABLE plc_devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    equipment_id INTEGER REFERENCES equipment(id),
    ip_address INET NOT NULL,
    port INTEGER DEFAULT 502,
    protocol VARCHAR(20) DEFAULT 'modbus',
    device_id INTEGER,
    
    -- 연결 설정
    timeout_seconds INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 3,
    poll_interval_ms INTEGER DEFAULT 1000,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    last_connection TIMESTAMP WITH TIME ZONE,
    connection_status BOOLEAN DEFAULT false,
    
    -- 메타데이터
    description TEXT,
    tags JSONB, -- PLC 태그 정보
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 6. 생산 관리 (Production Management)
-- =========================================

-- 작업 지시서 테이블
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(id),
    customer_id INTEGER REFERENCES customers(id),
    route_id INTEGER REFERENCES process_routes(id),
    
    -- 수량 정보
    planned_quantity INTEGER NOT NULL,
    produced_quantity INTEGER DEFAULT 0,
    good_quantity INTEGER DEFAULT 0,
    scrap_quantity INTEGER DEFAULT 0,
    
    -- 일정 정보
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- 우선순위 및 상태
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    
    -- 비용 정보
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    
    -- 메타데이터
    notes TEXT,
    special_instructions TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 작업 지시 공정별 상세
CREATE TABLE work_order_operations (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id),
    process_step_id INTEGER REFERENCES process_steps(id),
    operation_sequence INTEGER NOT NULL,
    
    -- 수량 정보
    planned_quantity INTEGER NOT NULL,
    completed_quantity INTEGER DEFAULT 0,
    scrap_quantity INTEGER DEFAULT 0,
    
    -- 시간 정보
    planned_start_datetime TIMESTAMP WITH TIME ZONE,
    planned_end_datetime TIMESTAMP WITH TIME ZONE,
    actual_start_datetime TIMESTAMP WITH TIME ZONE,
    actual_end_datetime TIMESTAMP WITH TIME ZONE,
    
    setup_time_actual INTEGER DEFAULT 0,
    run_time_actual INTEGER DEFAULT 0,
    
    -- 담당자
    assigned_operator_id UUID REFERENCES auth.users(id),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'paused', 'cancelled')),
    
    -- 메타데이터
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 생산 실적 기록
CREATE TABLE production_records (
    id SERIAL PRIMARY KEY,
    work_order_operation_id INTEGER REFERENCES work_order_operations(id),
    equipment_id INTEGER REFERENCES equipment(id),
    operator_id UUID REFERENCES auth.users(id),
    
    -- 생산 정보
    quantity_produced INTEGER NOT NULL,
    quantity_good INTEGER NOT NULL,
    quantity_scrap INTEGER DEFAULT 0,
    
    -- 시간 정보
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    
    -- 품질 정보
    qc_passed BOOLEAN DEFAULT true,
    defect_codes TEXT[],
    
    -- 메타데이터
    shift VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 7. 품질 관리 (Quality Management)
-- =========================================

-- 품질 검사 기준
CREATE TABLE quality_standards (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    test_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(30) CHECK (test_type IN ('dimensional', 'visual', 'functional', 'material', 'other')),
    
    -- 기준값
    target_value DECIMAL(15,6),
    lower_limit DECIMAL(15,6),
    upper_limit DECIMAL(15,6),
    unit VARCHAR(20),
    
    -- 검사 방법
    test_method TEXT,
    equipment_required VARCHAR(100),
    sample_size INTEGER DEFAULT 1,
    
    -- 메타데이터
    is_critical BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 품질 검사 기록
CREATE TABLE quality_inspections (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id),
    production_record_id INTEGER REFERENCES production_records(id),
    quality_standard_id INTEGER REFERENCES quality_standards(id),
    inspector_id UUID REFERENCES auth.users(id),
    
    -- 검사 정보
    inspection_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sample_size INTEGER NOT NULL,
    measured_value DECIMAL(15,6),
    
    -- 결과
    result VARCHAR(20) CHECK (result IN ('pass', 'fail', 'conditional')),
    deviation DECIMAL(15,6),
    
    -- 메타데이터
    notes TEXT,
    corrective_action TEXT,
    images JSONB, -- 검사 이미지 URL들
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 부적합품 관리
CREATE TABLE non_conformance_reports (
    id SERIAL PRIMARY KEY,
    ncr_number VARCHAR(30) UNIQUE NOT NULL,
    work_order_id INTEGER REFERENCES work_orders(id),
    product_id INTEGER REFERENCES products(id),
    
    -- 발견 정보
    discovered_by UUID REFERENCES auth.users(id),
    discovered_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discovered_stage VARCHAR(30), -- production, inspection, customer, etc.
    
    -- 문제 설명
    description TEXT NOT NULL,
    defect_type VARCHAR(50),
    defect_category VARCHAR(50),
    quantity_affected INTEGER NOT NULL,
    
    -- 원인 분석
    root_cause TEXT,
    investigation_notes TEXT,
    
    -- 조치 사항
    immediate_action TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    
    -- 담당자
    assigned_to UUID REFERENCES auth.users(id),
    verified_by UUID REFERENCES auth.users(id),
    
    -- 상태 및 일정
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'action_pending', 'closed', 'cancelled')),
    target_close_date DATE,
    actual_close_date DATE,
    
    -- 비용 영향
    cost_impact DECIMAL(15,2),
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 8. 재고 관리 (Inventory Management)
-- =========================================

-- 창고 테이블
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) CHECK (type IN ('raw_material', 'wip', 'finished_goods', 'spare_parts', 'tools')),
    
    -- 위치 정보
    location VARCHAR(100),
    address TEXT,
    
    -- 용량 정보
    total_capacity DECIMAL(12,3),
    used_capacity DECIMAL(12,3) DEFAULT 0,
    capacity_unit VARCHAR(20) DEFAULT 'm3',
    
    -- 관리자
    manager_id UUID REFERENCES auth.users(id),
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 재고 마스터
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    
    -- 재고 수량
    quantity_on_hand DECIMAL(12,4) DEFAULT 0,
    quantity_reserved DECIMAL(12,4) DEFAULT 0,
    quantity_available DECIMAL(12,4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    
    -- 재고 위치
    bin_location VARCHAR(20),
    zone VARCHAR(10),
    
    -- 재고 가치
    unit_cost DECIMAL(15,4),
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost) STORED,
    
    -- 재고 상태
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'quarantine', 'damaged', 'expired')),
    
    -- 배치 정보
    lot_number VARCHAR(30),
    expiry_date DATE,
    received_date DATE,
    
    -- 메타데이터
    last_counted_date DATE,
    cycle_count_required BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 재고 거래 내역
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id),
    transaction_type VARCHAR(30) CHECK (transaction_type IN ('receipt', 'issue', 'transfer', 'adjustment', 'scrap', 'return')),
    
    -- 거래 정보
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(15,4),
    total_value DECIMAL(15,2),
    
    -- 참조 정보
    reference_type VARCHAR(30), -- work_order, purchase_order, sales_order, etc.
    reference_id INTEGER,
    reference_number VARCHAR(50),
    
    -- 위치 정보
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    
    -- 배치 정보
    lot_number VARCHAR(30),
    
    -- 메타데이터
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 재고 조정
CREATE TABLE inventory_adjustments (
    id SERIAL PRIMARY KEY,
    adjustment_number VARCHAR(30) UNIQUE NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id),
    
    -- 조정 정보
    adjustment_date DATE NOT NULL,
    reason VARCHAR(100),
    description TEXT,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted')),
    
    -- 승인 정보
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 재고 조정 상세
CREATE TABLE inventory_adjustment_lines (
    id SERIAL PRIMARY KEY,
    adjustment_id INTEGER REFERENCES inventory_adjustments(id),
    inventory_id INTEGER REFERENCES inventory(id),
    
    -- 수량 정보
    system_quantity DECIMAL(12,4) NOT NULL,
    physical_quantity DECIMAL(12,4) NOT NULL,
    adjustment_quantity DECIMAL(12,4) GENERATED ALWAYS AS (physical_quantity - system_quantity) STORED,
    
    -- 가치 정보
    unit_cost DECIMAL(15,4),
    adjustment_value DECIMAL(15,2) GENERATED ALWAYS AS (adjustment_quantity * unit_cost) STORED,
    
    -- 사유
    reason VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 9. 리포트 및 분석 (Reports & Analytics)
-- =========================================

-- 리포트 정의
CREATE TABLE report_definitions (
    id SERIAL PRIMARY KEY,
    report_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_th VARCHAR(100),
    name_zh VARCHAR(100),
    description TEXT,
    
    -- 리포트 설정
    category VARCHAR(30), -- production, quality, inventory, financial, etc.
    report_type VARCHAR(20) CHECK (report_type IN ('tabular', 'chart', 'dashboard', 'kpi')),
    data_source JSONB, -- 데이터 소스 설정
    parameters JSONB, -- 파라미터 정의
    layout JSONB, -- 레이아웃 설정
    
    -- 접근 권한
    access_roles TEXT[], -- 접근 가능한 역할들
    
    -- 스케줄링
    is_scheduled BOOLEAN DEFAULT false,
    schedule_cron VARCHAR(50),
    recipients TEXT[], -- 이메일 수신자들
    
    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 리포트 실행 이력
CREATE TABLE report_executions (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES report_definitions(id),
    
    -- 실행 정보
    execution_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parameters_used JSONB,
    execution_duration_ms INTEGER,
    
    -- 결과
    status VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')),
    result_data JSONB,
    error_message TEXT,
    file_url TEXT, -- 생성된 파일 URL
    
    -- 요청자
    requested_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI 정의
CREATE TABLE kpi_definitions (
    id SERIAL PRIMARY KEY,
    kpi_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- KPI 설정
    category VARCHAR(30),
    unit VARCHAR(20),
    calculation_method TEXT,
    target_value DECIMAL(15,4),
    warning_threshold DECIMAL(15,4),
    critical_threshold DECIMAL(15,4),
    
    -- 계산 주기
    calculation_frequency VARCHAR(20) CHECK (calculation_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'monthly')),
    
    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPI 값 이력
CREATE TABLE kpi_values (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER REFERENCES kpi_definitions(id),
    
    -- 값 정보
    measurement_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    
    -- 상태
    status VARCHAR(20) CHECK (status IN ('normal', 'warning', 'critical')),
    
    -- 메타데이터
    calculation_details JSONB,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 10. 시스템 관리 (System Management)
-- =========================================

-- 시스템 설정
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(50),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 감사 로그
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- 변경 데이터
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- 사용자 정보
    user_id UUID REFERENCES auth.users(id),
    user_ip INET,
    user_agent TEXT,
    
    -- 메타데이터
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 템플릿
CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50), -- work_order_complete, quality_fail, etc.
    
    -- 템플릿 내용
    subject_template TEXT,
    body_template TEXT,
    
    -- 발송 설정
    delivery_methods TEXT[] DEFAULT ARRAY['email'], -- email, sms, push, in_app
    priority INTEGER DEFAULT 5,
    
    -- 수신자 설정
    default_recipients JSONB, -- 기본 수신자 규칙
    
    -- 메타데이터
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 알림 큐
CREATE TABLE notification_queue (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES notification_templates(id),
    
    -- 수신자 정보
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('user', 'role', 'email')),
    recipient_id VARCHAR(100), -- user_id, role_name, or email
    
    -- 메시지 내용
    subject TEXT,
    body TEXT,
    delivery_method VARCHAR(20),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- 예약 및 실행
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- 메타데이터
    context_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 인덱스 및 제약조건
-- =========================================

-- 성능을 위한 인덱스들
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_company ON customers(company_name);
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_work_orders_number ON work_orders(order_number);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);
CREATE INDEX idx_quality_inspections_result ON quality_inspections(result);
CREATE INDEX idx_production_records_datetime ON production_records(start_datetime);
CREATE INDEX idx_audit_logs_table_action ON audit_logs(table_name, action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 외래키 제약조건들은 이미 테이블 정의에 포함됨

-- =========================================
-- 초기 데이터 삽입
-- =========================================

-- 기본 권한 설정
INSERT INTO permissions (name, description, module) VALUES
('user_management', '사용자 관리', 'admin'),
('customer_management', '고객 관리', 'sales'),
('product_management', '제품 관리', 'production'),
('process_management', '공정 관리', 'production'),
('equipment_management', '설비 관리', 'maintenance'),
('production_management', '생산 관리', 'production'),
('quality_management', '품질 관리', 'quality'),
('inventory_management', '재고 관리', 'inventory'),
('report_management', '리포트 관리', 'admin'),
('system_settings', '시스템 설정', 'admin');

-- 기본 역할별 권한 설정
INSERT INTO role_permissions (role, permission_id, can_create, can_read, can_update, can_delete)
SELECT 'admin', id, true, true, true, true FROM permissions;

INSERT INTO role_permissions (role, permission_id, can_create, can_read, can_update, can_delete)
SELECT 'manager', id, 
    CASE WHEN module != 'admin' THEN true ELSE false END,
    true,
    CASE WHEN module != 'admin' THEN true ELSE false END,
    CASE WHEN module IN ('production', 'quality') THEN true ELSE false END
FROM permissions;

INSERT INTO role_permissions (role, permission_id, can_create, can_read, can_update, can_delete)
SELECT 'operator', id, 
    CASE WHEN module IN ('production', 'quality') THEN true ELSE false END,
    CASE WHEN module NOT IN ('admin', 'system') THEN true ELSE false END,
    CASE WHEN module IN ('production', 'quality') THEN true ELSE false END,
    false
FROM permissions;

-- 기본 시스템 설정
INSERT INTO system_settings (setting_key, setting_value, data_type, category, description) VALUES
('company_name', 'MES Thailand', 'string', 'general', '회사명'),
('default_language', 'ko', 'string', 'general', '기본 언어'),
('default_currency', 'THB', 'string', 'general', '기본 통화'),
('timezone', 'Asia/Bangkok', 'string', 'general', '시간대'),
('auto_approve_users', 'false', 'boolean', 'security', '사용자 자동 승인'),
('session_timeout_minutes', '480', 'number', 'security', '세션 타임아웃 (분)'),
('production_auto_start', 'false', 'boolean', 'production', '생산 자동 시작'),
('quality_sample_default', '5', 'number', 'quality', '기본 샘플 수량'),
('inventory_negative_allowed', 'false', 'boolean', 'inventory', '음수 재고 허용'),
('report_retention_days', '365', 'number', 'reports', '리포트 보관 기간 (일)');

-- =========================================
-- RLS (Row Level Security) 정책
-- =========================================

-- 사용자 프로필 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 기타 테이블들도 유사한 RLS 정책 적용...
-- (각 테이블마다 적절한 권한 제어 정책 설정)

COMMENT ON DATABASE postgres IS 'MES Thailand - Manufacturing Execution System Database'; 