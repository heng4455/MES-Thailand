const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MzI3MjQwMiwiZXhwIjoxOTk4ODQ4NDAyfQ.kKJJQFPeQdYagr5IcNj1z8Ir3QGHDJeYLo-8-DLppZA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConstraint() {
  try {
    console.log('🧪 work_centers 테이블의 unique constraint 테스트 시작...');
    
    const testCode = 'TEST-' + Date.now();
    
    // 첫 번째 삽입
    const { data: test1, error: error1 } = await supabase
      .from('work_centers')
      .insert([{
        code: testCode,
        name: '테스트 공정 1',
        description: '테스트용',
        status: 'active'
      }])
      .select();
      
    if (error1) {
      console.error('❌ 첫 번째 테스트 실패:', error1);
      return;
    }
    
    console.log('✅ 첫 번째 삽입 성공:', test1[0].id);
    
    // 두 번째 삽입 (같은 코드)
    const { data: test2, error: error2 } = await supabase
      .from('work_centers')
      .insert([{
        code: testCode,
        name: '테스트 공정 2',
        description: '테스트용 중복',
        status: 'active'
      }])
      .select();
      
    if (error2) {
      console.error('❌ 중복 코드 삽입 실패:', error2.message);
      console.log('');
      console.log('🔧 해결 방법:');
      console.log('Supabase 대시보드에서 다음 SQL을 실행하세요:');
      console.log('');
      console.log('ALTER TABLE work_centers DROP CONSTRAINT IF EXISTS work_centers_code_key;');
      console.log('');
    } else {
      console.log('✅ 중복 코드 삽입 성공! 제약 조건이 이미 제거되었습니다.');
    }
    
    // 정리
    await supabase.from('work_centers').delete().eq('id', test1[0].id);
    if (test2) {
      await supabase.from('work_centers').delete().eq('id', test2[0].id);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testConstraint();
