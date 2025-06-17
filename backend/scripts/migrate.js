const { query } = require('../src/config/database');

const createTables = async () => {
  try {
    console.log('🔄 Starting database migration...');

    // Users 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        department VARCHAR(100),
        position VARCHAR(100),
        role VARCHAR(20) DEFAULT 'general' CHECK (role IN ('general', 'manager', 'admin')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Production Lines 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS production_lines (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        capacity INTEGER,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100),
        unit VARCHAR(50),
        standard_time INTEGER, -- 표준 작업 시간 (분)
        target_quantity INTEGER,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Work Orders 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        product_id INTEGER REFERENCES products(id),
        production_line_id INTEGER REFERENCES production_lines(id),
        planned_quantity INTEGER NOT NULL,
        actual_quantity INTEGER DEFAULT 0,
        defect_quantity INTEGER DEFAULT 0,
        planned_start_date DATE,
        planned_end_date DATE,
        actual_start_date TIMESTAMP,
        actual_end_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Production Records 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS production_records (
        id SERIAL PRIMARY KEY,
        work_order_id INTEGER REFERENCES work_orders(id),
        production_line_id INTEGER REFERENCES production_lines(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        defect_quantity INTEGER DEFAULT 0,
        operator_id INTEGER REFERENCES users(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        cycle_time INTEGER, -- 사이클 타임 (초)
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Equipment 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(100),
        manufacturer VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        production_line_id INTEGER REFERENCES production_lines(id),
        installation_date DATE,
        warranty_expiry DATE,
        status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'breakdown', 'retired')),
        location VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Equipment Maintenance 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS equipment_maintenance (
        id SERIAL PRIMARY KEY,
        equipment_id INTEGER REFERENCES equipment(id),
        maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('preventive', 'corrective', 'breakdown')),
        scheduled_date DATE,
        actual_date DATE,
        duration INTEGER, -- 분 단위
        cost DECIMAL(12,2),
        technician_id INTEGER REFERENCES users(id),
        description TEXT,
        parts_used TEXT,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Quality Checks 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS quality_checks (
        id SERIAL PRIMARY KEY,
        work_order_id INTEGER REFERENCES work_orders(id),
        product_id INTEGER REFERENCES products(id),
        inspector_id INTEGER REFERENCES users(id),
        check_type VARCHAR(50),
        sample_size INTEGER,
        defect_count INTEGER DEFAULT 0,
        defect_rate DECIMAL(5,2),
        status VARCHAR(20) DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'pending')),
        notes TEXT,
        check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Quality Standards 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS quality_standards (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        parameter_name VARCHAR(100) NOT NULL,
        target_value DECIMAL(10,4),
        tolerance_upper DECIMAL(10,4),
        tolerance_lower DECIMAL(10,4),
        unit VARCHAR(50),
        check_frequency VARCHAR(50),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Defect Types 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS defect_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100),
        description TEXT,
        severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Production Defects 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS production_defects (
        id SERIAL PRIMARY KEY,
        production_record_id INTEGER REFERENCES production_records(id),
        defect_type_id INTEGER REFERENCES defect_types(id),
        quantity INTEGER NOT NULL,
        detected_by INTEGER REFERENCES users(id),
        root_cause TEXT,
        corrective_action TEXT,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inventory 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        location VARCHAR(200),
        quantity INTEGER NOT NULL DEFAULT 0,
        reserved_quantity INTEGER DEFAULT 0,
        minimum_stock INTEGER DEFAULT 0,
        maximum_stock INTEGER,
        unit_cost DECIMAL(12,2),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Digital Signatures 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS digital_signatures (
        id SERIAL PRIMARY KEY,
        document_type VARCHAR(100) NOT NULL,
        document_id INTEGER NOT NULL,
        signer_id INTEGER REFERENCES users(id),
        signature_data TEXT, -- Base64 encoded signature
        signature_hash VARCHAR(255),
        signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit Logs 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 인덱스 생성
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_work_orders_dates ON work_orders(planned_start_date, planned_end_date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_production_records_work_order ON production_records(work_order_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_production_records_time ON production_records(start_time, end_time);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_quality_checks_date ON quality_checks(check_date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  createTables().then(() => {
    process.exit(0);
  });
}

module.exports = { createTables }; 