const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://enhrflynwqxjhtvwybdt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaHJmbHlud3F4amh0dnd5YmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDYxOTU4OCwiZXhwIjoyMDMwMTk1NTg4fQ.lZRE8-mJO0UX7B1-qlnVJaNE2ynSasmHp2ogZtdmpGU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyProcessRLS() {
    console.log('🔧 공정 관리 테이블 RLS 정책 적용 시작...');
    
    try {
        // work_centers 테이블 RLS 설정
        console.log('📋 work_centers 테이블 RLS 설정...');
        
        // 기존 정책 삭제 (있다면)
        await supabase.rpc('exec_sql', {
            sql: 'DROP POLICY IF EXISTS "Authenticated users can access work_centers" ON public.work_centers;'
        });
        
        // RLS 활성화
        await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;'
        });
        
        // 새 정책 생성
        await supabase.rpc('exec_sql', {
            sql: 'CREATE POLICY "Authenticated users can access work_centers" ON public.work_centers FOR ALL USING (auth.role() = \'authenticated\');'
        });
        
        console.log('✅ work_centers RLS 설정 완료');
        
        // process_routes 테이블 RLS 설정
        console.log('📋 process_routes 테이블 RLS 설정...');
        
        await supabase.rpc('exec_sql', {
            sql: 'DROP POLICY IF EXISTS "Authenticated users can access process_routes" ON public.process_routes;'
        });
        
        await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.process_routes ENABLE ROW LEVEL SECURITY;'
        });
        
        await supabase.rpc('exec_sql', {
            sql: 'CREATE POLICY "Authenticated users can access process_routes" ON public.process_routes FOR ALL USING (auth.role() = \'authenticated\');'
        });
        
        console.log('✅ process_routes RLS 설정 완료');
        
        // process_steps 테이블 RLS 설정
        console.log('📋 process_steps 테이블 RLS 설정...');
        
        await supabase.rpc('exec_sql', {
            sql: 'DROP POLICY IF EXISTS "Authenticated users can access process_steps" ON public.process_steps;'
        });
        
        await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;'
        });
        
        await supabase.rpc('exec_sql', {
            sql: 'CREATE POLICY "Authenticated users can access process_steps" ON public.process_steps FOR ALL USING (auth.role() = \'authenticated\');'
        });
        
        console.log('✅ process_steps RLS 설정 완료');
        
        // 현재 테이블 상태 확인
        console.log('\n📊 테이블 상태 확인...');
        
        const { data: workCenters, error: wcError } = await supabase
            .from('work_centers')
            .select('*')
            .limit(5);
            
        if (wcError) {
            console.log('❌ work_centers 접근 오류:', wcError.message);
        } else {
            console.log(`✅ work_centers 접근 성공: ${workCenters?.length || 0}개 레코드`);
        }
        
        const { data: processRoutes, error: prError } = await supabase
            .from('process_routes')
            .select('*')
            .limit(5);
            
        if (prError) {
            console.log('❌ process_routes 접근 오류:', prError.message);
        } else {
            console.log(`✅ process_routes 접근 성공: ${processRoutes?.length || 0}개 레코드`);
        }
        
        const { data: processSteps, error: psError } = await supabase
            .from('process_steps')
            .select('*')
            .limit(5);
            
        if (psError) {
            console.log('❌ process_steps 접근 오류:', psError.message);
        } else {
            console.log(`✅ process_steps 접근 성공: ${processSteps?.length || 0}개 레코드`);
        }
        
        console.log('\n🎉 공정 관리 테이블 RLS 정책 적용 완료!');
        
    } catch (error) {
        console.error('❌ RLS 정책 적용 실패:', error);
    }
}

// RLS 정책 적용을 위한 SQL 함수가 없다면 직접 SQL 실행
async function execSQL(sql) {
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.log(`SQL 실행 시도: ${sql}`);
            console.log(`오류: ${error.message}`);
            
            // exec_sql 함수가 없다면 다른 방법 시도
            if (error.message.includes('function "exec_sql" does not exist')) {
                console.log('⚠️ exec_sql 함수가 없습니다. 수동으로 SQL을 실행해야 합니다.');
                return false;
            }
        }
        return true;
    } catch (err) {
        console.error('SQL 실행 오류:', err);
        return false;
    }
}

// 실행
if (require.main === module) {
    applyProcessRLS();
}

module.exports = { applyProcessRLS }; 