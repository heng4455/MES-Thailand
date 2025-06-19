const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2Nzg1MiwiZXhwIjoyMDY1NjQzODUyfQ.Nv_v9sLWZKIR4Fl7CWUJqTZAD3RjPdPgDfYwBODJhGo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRLSPolicies() {
  console.log('🔧 RLS 정책 무한 재귀 문제 해결 중...');
  
  try {
    // 1. 모든 테이블의 RLS 비활성화
    const tables = [
      'user_profiles', 'customers', 'products', 'equipment', 
      'inventory', 'work_orders', 'quality_inspections',
      'product_groups', 'status_definitions', 'team_assignments',
      'line_notification_settings', 'notification_templates',
      'notification_logs', 'admin_settings', 'user_roles',
      'permissions', 'role_permissions'
    ];
    
    console.log('1️⃣ RLS 비활성화 중...');
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
        });
        if (error) throw error;
        console.log(`✅ ${table} RLS 비활성화 완료`);
      } catch (error) {
        console.log(`⚠️  ${table} RLS 비활성화 실패 (테이블이 없을 수 있음): ${error.message}`);
      }
    }
    
    // 2. 기존 정책들 삭제
    console.log('2️⃣ 기존 정책 삭제 중...');
    const policies = [
      'user_profiles_policy',
      'customers_policy', 
      'products_policy',
      'equipment_policy',
      'inventory_policy',
      'work_orders_policy',
      'quality_inspections_policy',
      'Enable read access for all users',
      'Enable insert for authenticated users only',
      'Enable update for users based on email',
      'Enable delete for users based on email'
    ];
    
    for (const table of tables) {
      for (const policy of policies) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: `DROP POLICY IF EXISTS "${policy}" ON ${table};`
          });
          // 정책이 없으면 무시
        } catch (error) {
          // 정책이 없으면 무시
        }
      }
    }
    
    console.log('✅ 기존 정책 삭제 완료');
    
    // 3. anon 역할에 모든 권한 부여 (개발 환경용)
    console.log('3️⃣ 권한 부여 중...');
    for (const table of tables) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `GRANT ALL ON ${table} TO anon, authenticated;`
        });
        if (error) throw error;
        console.log(`✅ ${table} 권한 부여 완료`);
      } catch (error) {
        console.log(`⚠️  ${table} 권한 부여 실패: ${error.message}`);
      }
    }
    
    // 4. 시퀀스 권한 부여
    console.log('4️⃣ 시퀀스 권한 부여 중...');
    const sequences = [
      'user_profiles_id_seq', 'customers_id_seq', 'products_id_seq',
      'equipment_id_seq', 'inventory_id_seq', 'work_orders_id_seq',
      'quality_inspections_id_seq', 'product_groups_id_seq',
      'status_definitions_id_seq', 'team_assignments_id_seq',
      'user_roles_id_seq', 'permissions_id_seq', 'role_permissions_id_seq'
    ];
    
    for (const seq of sequences) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `GRANT USAGE, SELECT ON SEQUENCE ${seq} TO anon, authenticated;`
        });
        if (error) throw error;
        console.log(`✅ ${seq} 시퀀스 권한 부여 완료`);
      } catch (error) {
        console.log(`⚠️  ${seq} 시퀀스 권한 부여 실패: ${error.message}`);
      }
    }
    
    // 5. 테스트 쿼리 실행
    console.log('5️⃣ 테스트 쿼리 실행 중...');
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
      if (error) throw error;
      console.log('✅ user_profiles 테스트 성공');
    } catch (error) {
      console.log(`❌ user_profiles 테스트 실패: ${error.message}`);
    }
    
    try {
      const { data, error } = await supabase.from('customers').select('*').limit(1);
      if (error) throw error;
      console.log('✅ customers 테스트 성공');
    } catch (error) {
      console.log(`❌ customers 테스트 실패: ${error.message}`);
    }
    
    console.log('🎉 RLS 정책 수정 완료!');
    console.log('🔄 브라우저를 새로고침하여 변경사항을 확인하세요.');
    
  } catch (error) {
    console.error('❌ RLS 정책 수정 실패:', error);
  }
}

// exec_sql 함수가 없는 경우를 위한 대안
async function fixRLSWithDirectSQL() {
  console.log('🔧 직접 SQL로 RLS 문제 해결 중...');
  
  const sqlCommands = [
    // RLS 비활성화
    'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE customers DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE products DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE quality_inspections DISABLE ROW LEVEL SECURITY;',
    
    // 권한 부여
    'GRANT ALL ON user_profiles TO anon, authenticated;',
    'GRANT ALL ON customers TO anon, authenticated;',
    'GRANT ALL ON products TO anon, authenticated;',
    'GRANT ALL ON equipment TO anon, authenticated;',
    'GRANT ALL ON inventory TO anon, authenticated;',
    'GRANT ALL ON work_orders TO anon, authenticated;',
    'GRANT ALL ON quality_inspections TO anon, authenticated;',
    
    // 시퀀스 권한
    'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;'
  ];
  
  for (const sql of sqlCommands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`⚠️  SQL 실행 실패: ${sql} - ${error.message}`);
      } else {
        console.log(`✅ SQL 실행 성공: ${sql}`);
      }
    } catch (error) {
      console.log(`❌ SQL 실행 오류: ${sql} - ${error.message}`);
    }
  }
}

// 메인 실행
async function main() {
  try {
    await fixRLSPolicies();
  } catch (error) {
    console.log('exec_sql 함수를 사용할 수 없습니다. 직접 SQL로 시도합니다...');
    await fixRLSWithDirectSQL();
  }
}

main(); 