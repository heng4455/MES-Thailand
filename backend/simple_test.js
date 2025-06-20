const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MzI3MjQwMiwiZXhwIjoxOTk4ODQ4NDAyfQ.kKJJQFPeQdYagr5IcNj1z8Ir3QGHDJeYLo-8-DLppZA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeCodeUniqueConstraint() {
  try {
    console.log('🔧 work_centers 테이블의 code unique constraint 제거 시작...');
    
    // 테스트: 중복 코드로 데이터 삽입 시도 (제약 조건 확인)
    console.log('🧪 현재 제약 조건 상태 테스트...');
    
    const testCode = 'TEST-CONSTRAINT-' + Date.now();
    
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
      return;
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
      console.log('⚠️ unique constraint가 여전히 활성화되어 있습니다.');
      console.log('');
      console.log('📝 해결 방법:');
      console.log('1. Supabase 대시보드에 로그인');
      console.log('2. Table Editor > work_centers 테이블 선택');
      console.log('3. 테이블 설정 > Constraints 섹션에서');
      console.log('4. "work_centers_code_key" 제약 조건 찾아서 삭제');
      console.log('');
      console.log('또는 SQL Editor에서 다음 명령 실행:');
      console.log('ALTER TABLE work_centers DROP CONSTRAINT work_centers_code_key;');
    } else {
      console.log('✅ 두 번째 테스트 삽입 성공:', test2[0].id);
      console.log('🎉 중복 코드 허용이 이미 작동하고 있습니다!');
    }
    
    // 테스트 데이터 정리
    if (test1) {
      await supabase.from('work_centers').delete().eq('id', test1[0].id);
      console.log('🧹 첫 번째 테스트 데이터 삭제됨');
    }
    if (test2) {
      await supabase.from('work_centers').delete().eq('id', test2[0].id);
      console.log('🧹 두 번째 테스트 데이터 삭제됨');
    }
    
  } catch (error) {
    console.error('❌ 작업 실패:', error);
  }
}

removeCodeUniqueConstraint();
