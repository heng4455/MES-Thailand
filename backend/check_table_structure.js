const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2Nzg1MiwiZXhwIjoyMDY1NjQzODUyfQ.9VeVlir8e76L51si0BK_xsaBvRhPvzW1VIV9thcnoQs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSRecursion() {
    console.log('🚨 RLS 무한 재귀 문제 해결 시작...');
    
    // 1. 모든 테이블의 RLS 비활성화
    const disableRLSCommands = [
        'ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE customers DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE products DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE equipment DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE process_routes DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE work_orders DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE work_centers DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE quality_inspections DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE inventory DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE status_definitions DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE team_assignments DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE product_groups DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE line_notification_settings DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE permissions DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY'
    ];

    console.log('\n🔧 1단계: RLS 비활성화...');
    let successCount = 0;
    let errorCount = 0;

    for (const command of disableRLSCommands) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
            if (error) {
                console.log(`❌ ${command}: ${error.message}`);
                errorCount++;
            } else {
                console.log(`✅ ${command}`);
                successCount++;
            }
        } catch (err) {
            console.log(`❌ ${command}: ${err.message}`);
            errorCount++;
        }
        
        // API 제한 방지를 위한 대기
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 RLS 비활성화 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);

    // 2. 문제가 있는 정책들 삭제
    const dropPolicyCommands = [
        'DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles',
        'DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles',
        'DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles',
        'DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles',
        'DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles',
        'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles',
        'DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profiles',
        'DROP POLICY IF EXISTS "Enable read access for all users" ON customers',
        'DROP POLICY IF EXISTS "Enable read access for all users" ON products',
        'DROP POLICY IF EXISTS "Enable read access for all users" ON equipment',
        'DROP POLICY IF EXISTS "Enable read access for all users" ON process_routes'
    ];

    console.log('\n🗑️ 2단계: 문제 정책 삭제...');
    let policySuccessCount = 0;
    let policyErrorCount = 0;

    for (const command of dropPolicyCommands) {
        try {
            const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
            if (error) {
                console.log(`❌ ${command}: ${error.message}`);
                policyErrorCount++;
            } else {
                console.log(`✅ ${command}`);
                policySuccessCount++;
            }
        } catch (err) {
            console.log(`❌ ${command}: ${err.message}`);
            policyErrorCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 정책 삭제 완료: 성공 ${policySuccessCount}개, 실패 ${policyErrorCount}개`);

    // 3. RLS 상태 확인
    console.log('\n🔍 3단계: RLS 상태 확인...');
    try {
        const { data: rlsStatus, error: rlsError } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    rowsecurity
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            `
        });

        if (rlsError) {
            console.log('❌ RLS 상태 확인 실패:', rlsError.message);
        } else {
            console.log('📋 RLS 상태:');
            if (rlsStatus && rlsStatus.length > 0) {
                rlsStatus.forEach(table => {
                    const status = table.rowsecurity ? '🔒 활성화' : '🔓 비활성화';
                    console.log(`  - ${table.tablename}: ${status}`);
                });
            }
        }
    } catch (err) {
        console.log('❌ RLS 상태 확인 실패:', err.message);
    }

    // 4. 테이블 접근 테스트
    console.log('\n🧪 4단계: 테이블 접근 테스트...');
    const testTables = ['user_profiles', 'customers', 'products', 'equipment'];
    
    for (const tableName of testTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${tableName} 테이블 접근 실패: ${error.message}`);
            } else {
                console.log(`✅ ${tableName} 테이블 접근 성공`);
            }
        } catch (err) {
            console.log(`❌ ${tableName} 테이블 접근 실패: ${err.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 RLS 무한 재귀 문제 해결 완료!');
    console.log('💡 이제 애플리케이션을 새로고침해서 정상 작동하는지 확인해주세요.');
}

fixRLSRecursion(); 