const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MzI3MjQwMiwiZXhwIjoxOTk4ODQ4NDAyfQ.kKJJQFPeQdYagr5IcNj1z8Ir3QGHDJeYLo-8-DLppZA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeCodeUniqueConstraint() {
  try {
    console.log('🔧 work_centers 테이블의 code unique constraint 제거 시작...');
    
    // SQL 실행을 위해 rpc 사용 대신 직접 SQL 실행
    const queries = [
      'ALTER TABLE work_centers DROP CONSTRAINT IF EXISTS work_centers_code_key;',
      'ALTER TABLE work_centers DROP CONSTRAINT IF EXISTS work_centers_code_unique;'
    ];
    
    for (const query of queries) {
      console.log('실행 중:', query);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log('⚠️ 쿼리 실행 중 오류 (무시됨):', error.message);
      } else {
        console.log('✅ 쿼리 실행 성공');
      }
    }
    
    console.log('🎉 제약 조건 제거 작업 완료!');
    
    // 테스트: 중복 코드로 데이터 삽입 시도
    console.log('🧪 중복 코드 테스트 시작...');
    
    const testCode = 'TEST-DUPLICATE-' + Date.now();
    
    // 첫 번째 삽입
    const { data: test1, error: error1 } = await supabase
      .from('work_centers')
      .insert([{
        code: testCode,
        name: '테스트 공정 1',
        description: '테스트용 첫 번째 공정',
        status: 'active'
      }])
      .select();
      
    if (error1) {
      console.error('❌ 첫 번째 테스트 삽입 실패:', error1);
    } else {
      console.log('✅ 첫 번째 테스트 삽입 성공:', test1[0].id);
    }
    
    // 두 번째 삽입 (같은 코드)
    const { data: test2, error: error2 } = await supabase
      .from('work_centers')
      .insert([{
        code: testCode,
        name: '테스트 공정 2',
        description: '테스트용 두 번째 공정 (같은 코드)',
        status: 'active'
      }])
      .select();
      
    if (error2) {
      console.error('❌ 두 번째 테스트 삽입 실패:', error2);
      console.log('⚠️ 여전히 unique constraint가 남아있습니다.');
      console.log('💡 Supabase 대시보드에서 직접 제약 조건을 제거해야 할 수 있습니다.');
    } else {
      console.log('✅ 두 번째 테스트 삽입 성공:', test2[0].id);
      console.log('🎉 중복 코드 허용이 정상적으로 작동합니다!');
    }
    
    // 테스트 데이터 정리
    if (test1) {
      await supabase.from('work_centers').delete().eq('id', test1[0].id);
    }
    if (test2) {
      await supabase.from('work_centers').delete().eq('id', test2[0].id);
    }
    console.log('🧹 테스트 데이터 정리 완료');
    
  } catch (error) {
    console.error('❌ 작업 실패:', error);
  }
}

removeCodeUniqueConstraint(); 