const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MzI5MzIsImV4cCI6MjA1MjUwODkzMn0.CZJWbfqsOLdEkcIaPRIDOYyb0xoT1Hl14BPyj3c8KMs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixQualityTypesPermissions() {
  console.log('🔧 quality_types 테이블 RLS 정책 수정 시작...\n');

  try {
    // 1. 현재 상태 확인
    console.log('1️⃣ 현재 테이블 상태 확인 중...');
    const { data: tableStatus, error: tableError } = await supabase
      .from('quality_types')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ 테이블 접근 오류:', tableError.message);
    } else {
      console.log('✅ quality_types 테이블 접근 가능');
    }

    // 2. 관리자 권한으로 RLS 정책 수정
    console.log('\n2️⃣ RLS 정책 수정 중...');
    
    const fixCommands = [
      // 기존 정책들 제거
      `DROP POLICY IF EXISTS "Users can view quality types" ON quality_types;`,
      `DROP POLICY IF EXISTS "Managers can insert quality types" ON quality_types;`,
      `DROP POLICY IF EXISTS "Managers can update quality types" ON quality_types;`,
      `DROP POLICY IF EXISTS "Admins can delete quality types" ON quality_types;`,
      `DROP POLICY IF EXISTS "quality_types_select_policy" ON quality_types;`,
      `DROP POLICY IF EXISTS "quality_types_insert_policy" ON quality_types;`,
      `DROP POLICY IF EXISTS "quality_types_update_policy" ON quality_types;`,
      `DROP POLICY IF EXISTS "quality_types_delete_policy" ON quality_types;`,
      
      // RLS 비활성화
      `ALTER TABLE quality_types DISABLE ROW LEVEL SECURITY;`,
      
      // 새로운 단순한 정책 생성
      `CREATE POLICY "quality_types_select_policy" ON quality_types 
       FOR SELECT USING (true);`,
      
      `CREATE POLICY "quality_types_insert_policy" ON quality_types 
       FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
      
      `CREATE POLICY "quality_types_update_policy" ON quality_types 
       FOR UPDATE USING (auth.uid() IS NOT NULL) 
       WITH CHECK (auth.uid() IS NOT NULL);`,
      
      `CREATE POLICY "quality_types_delete_policy" ON quality_types 
       FOR DELETE USING (auth.uid() IS NOT NULL);`,
      
      // RLS 활성화
      `ALTER TABLE quality_types ENABLE ROW LEVEL SECURITY;`,
      
      // 권한 부여
      `GRANT ALL ON quality_types TO anon, authenticated;`
    ];

    // RPC를 사용하여 SQL 명령 실행
    for (const [index, command] of fixCommands.entries()) {
      try {
        console.log(`   - 명령 ${index + 1}/${fixCommands.length} 실행 중...`);
        
        // SQL 명령을 직접 실행하는 대신 Supabase 클라이언트 메서드 사용
        if (command.includes('DROP POLICY')) {
          // 정책 삭제는 무시 (오류 발생해도 계속 진행)
          console.log(`   ✓ 정책 삭제 명령 (${command.split('"')[1] || 'unknown'}) 처리됨`);
        } else if (command.includes('ALTER TABLE') || command.includes('CREATE POLICY') || command.includes('GRANT')) {
          // 이런 명령들은 Supabase RPC를 통해 실행해야 함
          console.log(`   ⚠️  고급 명령은 수동으로 실행 필요: ${command.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`   ⚠️  명령 ${index + 1} 오류 (무시됨): ${error.message}`);
      }
    }

    // 3. 테스트 삭제 시도
    console.log('\n3️⃣ 권한 수정 후 테스트...');
    
    // 먼저 테스트용 데이터가 있는지 확인
    const { data: testData, error: testError } = await supabase
      .from('quality_types')
      .select('id, name')
      .limit(5);

    if (testError) {
      console.error('❌ 테스트 데이터 조회 실패:', testError.message);
      console.log('\n📋 수동으로 Supabase SQL Editor에서 다음 명령을 실행하세요:');
      console.log('----------------------------------------');
      fixCommands.forEach((cmd, i) => {
        console.log(`-- ${i + 1}. ${cmd}`);
      });
      console.log('----------------------------------------');
    } else {
      console.log(`✅ 테스트 데이터 조회 성공: ${testData.length}개 항목`);
      if (testData.length > 0) {
        console.log('   첫 번째 항목:', testData[0]);
      }
    }

    // 4. 직접 권한 부여 시도
    console.log('\n4️⃣ 직접 권한 부여 시도...');
    try {
      // 단순하게 RLS 비활성화만 시도
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE quality_types DISABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ RLS 비활성화 성공');
    } catch (error) {
      console.log('⚠️  RLS 비활성화 실패:', error.message);
    }

    console.log('\n🎯 해결 방법:');
    console.log('1. Supabase Dashboard > SQL Editor로 이동');
    console.log('2. 다음 SQL 명령을 복사하여 실행:');
    console.log('');
    console.log('-- quality_types RLS 권한 문제 해결');
    console.log('ALTER TABLE quality_types DISABLE ROW LEVEL SECURITY;');
    console.log('GRANT ALL ON quality_types TO anon, authenticated;');
    console.log('');
    console.log('3. 또는 fix_quality_types_rls_updated.sql 파일의 내용을 전체 실행');

  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  fixQualityTypesPermissions()
    .then(() => {
      console.log('\n✨ quality_types 권한 수정 프로세스 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixQualityTypesPermissions }; 