const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MzI3MjQwMiwiZXhwIjoxOTk4ODQ4NDAyfQ.kKJJQFPeQdYagr5IcNj1z8Ir3QGHDJeYLo-8-DLppZA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeCodeUniqueConstraint() {
  try {
    console.log('🔧 work_centers 테이블의 code unique constraint 제거 시작...');
    
    // 현재 제약 조건 확인
    const { data: constraints, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT constraint_name, table_name, column_name 
        FROM information_schema.key_column_usage 
        WHERE table_name = 'work_centers' 
        AND column_name = 'code'
        AND table_schema = 'public';
      `
    });
    
    if (checkError) {
      console.log('ℹ️ 제약 조건 확인 중 오류 (무시됨):', checkError.message);
    } else {
      console.log('📋 현재 제약 조건:', constraints);
    }
    
    // unique constraint 제거
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE work_centers 
        DROP CONSTRAINT IF EXISTS work_centers_code_key;
        
        ALTER TABLE work_centers 
        DROP CONSTRAINT IF EXISTS work_centers_code_unique;
        
        -- 혹시 다른 이름으로 된 제약조건도 확인하여 제거
        DO $$
        DECLARE
            constraint_record RECORD;
        BEGIN
            FOR constraint_record IN 
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'work_centers' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name LIKE '%code%'
            LOOP
                EXECUTE 'ALTER TABLE work_centers DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
                RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
            END LOOP;
        END $$;
      `
    });
    
    if (dropError) {
      console.error('❌ 제약 조건 제거 실패:', dropError);
      throw dropError;
    }
    
    console.log('✅ work_centers.code unique constraint 제거 완료!');
    
    // 제거 후 확인
    const { data: finalCheck, error: finalError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT constraint_name, table_name, column_name 
        FROM information_schema.key_column_usage 
        WHERE table_name = 'work_centers' 
        AND column_name = 'code'
        AND table_schema = 'public';
      `
    });
    
    if (!finalError) {
      console.log('📋 제거 후 남은 제약 조건:', finalCheck);
      if (!finalCheck || finalCheck.length === 0) {
        console.log('🎉 모든 code 관련 unique constraint가 성공적으로 제거됨!');
      }
    }
    
    // 테스트: 중복 코드로 데이터 삽입 시도
    console.log('🧪 중복 코드 테스트 시작...');
    
    const testCode = 'TEST-DUPLICATE-001';
    
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
      console.log('⚠️ 여전히 unique constraint가 남아있는 것 같습니다.');
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
    process.exit(1);
  }
}

removeCodeUniqueConstraint(); 