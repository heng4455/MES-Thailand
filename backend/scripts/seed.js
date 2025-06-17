const { query } = require('../src/config/database');
const { hashPassword, getCurrentThaiTime } = require('../src/utils/helpers');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // 관리자 계정 생성
    const adminPassword = await hashPassword('Admin123!@#');
    await query(
      `INSERT INTO users (
        email, password, first_name, last_name, phone, department, position,
        role, status, email_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO NOTHING`,
      [
        'admin@mes-thailand.com',
        adminPassword,
        'System',
        'Administrator',
        '02-123-4567',
        'IT',
        'System Administrator',
        'admin',
        'approved',
        true,
        getCurrentThaiTime()
      ]
    );

    // 매니저 계정 생성
    const managerPassword = await hashPassword('Manager123!@#');
    await query(
      `INSERT INTO users (
        email, password, first_name, last_name, phone, department, position,
        role, status, email_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO NOTHING`,
      [
        'manager@mes-thailand.com',
        managerPassword,
        'Production',
        'Manager',
        '02-234-5678',
        'Production',
        'Production Manager',
        'manager',
        'approved',
        true,
        getCurrentThaiTime()
      ]
    );

    // 일반 사용자 계정 생성
    const userPassword = await hashPassword('User123!@#');
    await query(
      `INSERT INTO users (
        email, password, first_name, last_name, phone, department, position,
        role, status, email_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO NOTHING`,
      [
        'operator@mes-thailand.com',
        userPassword,
        'Line',
        'Operator',
        '02-345-6789',
        'Production',
        'Line Operator',
        'general',
        'approved',
        true,
        getCurrentThaiTime()
      ]
    );

    // 생산 라인 데이터 생성
    await query(
      `INSERT INTO production_lines (name, code, description, capacity, status, created_at)
      VALUES 
        ('Assembly Line 1', 'AL001', 'Main assembly line for electronic components', 100, 'active', $1),
        ('Assembly Line 2', 'AL002', 'Secondary assembly line for automotive parts', 80, 'active', $1),
        ('Packaging Line', 'PL001', 'Final packaging and quality control', 120, 'active', $1)
      ON CONFLICT (code) DO NOTHING`,
      [getCurrentThaiTime()]
    );

    // 제품 데이터 생성
    await query(
      `INSERT INTO products (name, code, description, category, unit, standard_time, target_quantity, active, created_at)
      VALUES 
        ('Circuit Board A1', 'PCB-A1', 'Main circuit board for automotive systems', 'Electronics', 'pcs', 15, 500, true, $1),
        ('Wire Harness B2', 'WH-B2', 'Wire harness for vehicle electrical system', 'Automotive', 'pcs', 25, 300, true, $1),
        ('Sensor Module C3', 'SM-C3', 'Temperature and pressure sensor module', 'Sensors', 'pcs', 20, 200, true, $1)
      ON CONFLICT (code) DO NOTHING`,
      [getCurrentThaiTime()]
    );

    // 장비 데이터 생성
    await query(
      `INSERT INTO equipment (name, code, type, manufacturer, model, production_line_id, status, location, created_at)
      VALUES 
        ('SMT Machine 1', 'SMT-001', 'machine', 'Yamaha', 'YSM40R', 1, 'operational', 'Line 1 Station 1', $1),
        ('Pick and Place Robot', 'PPR-001', 'machine', 'KUKA', 'KR10-R1100', 1, 'operational', 'Line 1 Station 2', $1),
        ('Conveyor Belt System', 'CVB-001', 'conveyor', 'Bosch Rexroth', 'TS2plus', 2, 'operational', 'Line 2', $1)
      ON CONFLICT (code) DO NOTHING`,
      [getCurrentThaiTime()]
    );

    // 불량 유형 데이터 생성
    await query(
      `INSERT INTO defect_types (name, code, category, description, severity, active, created_at)
      VALUES 
        ('Soldering Defect', 'SD-001', 'Soldering', 'Poor solder joint quality', 'high', true, $1),
        ('Component Missing', 'CM-001', 'Assembly', 'Required component not installed', 'critical', true, $1),
        ('Scratches', 'SC-001', 'Cosmetic', 'Surface scratches on product', 'low', true, $1),
        ('Dimensional Error', 'DE-001', 'Dimensional', 'Product dimensions out of tolerance', 'medium', true, $1)
      ON CONFLICT (code) DO NOTHING`,
      [getCurrentThaiTime()]
    );

    console.log('✅ Database seeding completed successfully!');
    console.log('📋 Created accounts:');
    console.log('   👑 Admin: admin@mes-thailand.com / Admin123!@#');
    console.log('   👨‍💼 Manager: manager@mes-thailand.com / Manager123!@#');
    console.log('   👷 Operator: operator@mes-thailand.com / User123!@#');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  seedData().then(() => {
    process.exit(0);
  });
}

module.exports = { seedData }; 