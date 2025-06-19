const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc4NTIsImV4cCI6MjA2NTY0Mzg1Mn0.ZPxkyybsWNNl4sNS_k161t1DxKx2FMGsshohVTEbOtk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRoleTables() {
  console.log('🔍 역할 관리 테이블 확인 중...\n');

  try {
    // 1. user_roles 테이블 확인
    console.log('1. user_roles 테이블 확인:');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.error('❌ user_roles 테이블 오류:', rolesError.message);
    } else {
      console.log(`✅ user_roles 테이블 정상 (${roles.length}개 역할)`);
      roles.forEach(role => {
        console.log(`   - ${role.role_name} (${role.role_code})`);
      });
    }

    // 2. permissions 테이블 확인
    console.log('\n2. permissions 테이블 확인:');
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('*')
      .limit(5);

    if (permissionsError) {
      console.error('❌ permissions 테이블 오류:', permissionsError.message);
    } else {
      console.log(`✅ permissions 테이블 정상 (${permissions.length}개 권한)`);
      permissions.forEach(permission => {
        console.log(`   - ${permission.permission_name} (${permission.permission_code})`);
      });
    }

    // 3. role_permissions 테이블 확인
    console.log('\n3. role_permissions 테이블 확인:');
    const { data: rolePermissions, error: rpError } = await supabase
      .from('role_permissions')
      .select('*')
      .limit(5);

    if (rpError) {
      console.error('❌ role_permissions 테이블 오류:', rpError.message);
    } else {
      console.log(`✅ role_permissions 테이블 정상 (${rolePermissions.length}개 매핑)`);
    }

    // 4. 관계 조인 테스트
    console.log('\n4. 테이블 관계 조인 테스트:');
    const { data: joinTest, error: joinError } = await supabase
      .from('role_permissions')
      .select(`
        role_id,
        permission_id,
        user_roles!inner(role_name, role_code),
        permissions!inner(permission_name, permission_code)
      `)
      .limit(3);

    if (joinError) {
      console.error('❌ 조인 테스트 실패:', joinError.message);
      
      // 대안: 수동 조인 테스트
      console.log('\n5. 수동 조인 테스트:');
      if (roles && roles.length > 0) {
        const testRoleId = roles[0].id;
        const { data: manualJoin, error: manualError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', testRoleId);

        if (manualError) {
          console.error('❌ 수동 조인도 실패:', manualError.message);
        } else {
          console.log(`✅ 수동 조인 성공 (역할 ${testRoleId}에 ${manualJoin.length}개 권한)`);
        }
      }
    } else {
      console.log('✅ 테이블 관계 조인 성공');
      joinTest.forEach(item => {
        console.log(`   - ${item.user_roles?.role_name}: ${item.permissions?.permission_name}`);
      });
    }

    // 6. 테이블 스키마 확인
    console.log('\n6. 테이블 스키마 확인:');
    const tables = ['user_roles', 'permissions', 'role_permissions'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase.rpc('get_table_columns', { 
          table_name: tableName 
        });
        
        if (error) {
          console.log(`⚠️  ${tableName} 스키마 정보 가져오기 실패`);
        } else {
          console.log(`✅ ${tableName} 테이블 존재 확인`);
        }
      } catch (e) {
        console.log(`⚠️  ${tableName} 스키마 확인 중 오류`);
      }
    }

  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error.message);
  }
}

// 테이블 생성 스크립트
async function createMissingTables() {
  console.log('\n🔧 누락된 테이블 생성 시도...\n');

  const createTablesSQL = `
    -- 역할 관리 테이블
    CREATE TABLE IF NOT EXISTS public.user_roles (
        id SERIAL PRIMARY KEY,
        role_code VARCHAR(20) UNIQUE NOT NULL,
        role_name VARCHAR(100) NOT NULL,
        role_description TEXT,
        permissions JSONB,
        is_system_role BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 권한 정의 테이블
    CREATE TABLE IF NOT EXISTS public.permissions (
        id SERIAL PRIMARY KEY,
        permission_code VARCHAR(50) UNIQUE NOT NULL,
        permission_name VARCHAR(100) NOT NULL,
        permission_description TEXT,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 역할-권한 매핑 테이블
    CREATE TABLE IF NOT EXISTS public.role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER REFERENCES public.user_roles(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
        granted_by UUID REFERENCES auth.users(id),
        granted_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(role_id, permission_id)
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_user_roles_code ON public.user_roles(role_code);
    CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(permission_code);
    CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      console.error('❌ 테이블 생성 실패:', error.message);
    } else {
      console.log('✅ 테이블 생성 완료');
    }
  } catch (error) {
    console.error('❌ SQL 실행 실패:', error.message);
  }
}

// 메인 실행
async function main() {
  await testRoleTables();
  
  console.log('\n' + '='.repeat(50));
  console.log('테스트 완료');
  console.log('='.repeat(50));
}

main().catch(console.error); 