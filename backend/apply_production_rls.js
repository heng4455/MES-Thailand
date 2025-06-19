const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정
const supabaseUrl = 'https://hbmkuqeqhvnhqcwbqhxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibWt1cWVxaHZuaHFjd2JxaHhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM0NjEzMCwiZXhwIjoyMDQ5OTIyMTMwfQ.Bd4HUXmjfVWWgQBPQgHUcwSQ9UpCOoLWNPqPLAhHQnE';

// Service role로 Supabase 클라이언트 생성 (RLS 우회 가능)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyProductionRLS() {
  console.log('🚀 배포용 RLS 정책 설정을 시작합니다...');
  
  try {
    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'production_rls_setup.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL 파일을 읽었습니다:', sqlFilePath);
    
    // SQL 명령을 세미콜론으로 분할하여 개별 실행
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 총 ${sqlCommands.length}개의 SQL 명령을 실행합니다...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // 빈 명령이나 주석만 있는 명령 건너뛰기
      if (!command || command.trim().length === 0) continue;
      
      try {
        console.log(`\n[${i + 1}/${sqlCommands.length}] 실행 중...`);
        console.log(`📝 ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);
        
        // Supabase에서 직접 SQL 실행
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command + ';'
        });
        
        if (error) {
          // 일부 오류는 무시할 수 있음 (이미 존재하는 정책 등)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('cannot drop')) {
            console.log(`⚠️  경고 (무시됨): ${error.message}`);
          } else {
            console.error(`❌ 오류: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('✅ 성공');
          successCount++;
        }
        
        // 잠시 대기 (API 제한 방지)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ 예외 발생: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 배포용 RLS 정책 설정 완료!');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 오류: ${errorCount}개`);
    
    if (errorCount === 0) {
      console.log('🎉 모든 RLS 정책이 성공적으로 적용되었습니다!');
    } else {
      console.log('⚠️  일부 오류가 발생했지만 대부분의 정책이 적용되었습니다.');
    }
    
    // 최종 상태 확인
    console.log('\n📊 RLS 상태 확인 중...');
    await checkRLSStatus();
    
  } catch (error) {
    console.error('💥 치명적 오류:', error.message);
    process.exit(1);
  }
}

async function checkRLSStatus() {
  try {
    // 뷰 상태 확인
    console.log('\n🔍 필수 뷰 상태 확인 중...');
    const views = ['user_approval_status', 'team_assignments_with_users', 'quality_inspections_with_product'];
    
    for (const viewName of views) {
      try {
        const { data: viewData, error: viewError } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);
        
        if (viewError) {
          console.log(`❌ ${viewName}: 접근 불가 (${viewError.message})`);
        } else {
          console.log(`✅ ${viewName}: 정상 작동`);
        }
      } catch (err) {
        console.log(`❌ ${viewName}: 오류 (${err.message})`);
      }
    }
    
  } catch (error) {
    console.error('❌ 상태 확인 중 오류:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  applyProductionRLS()
    .then(() => {
      console.log('\n🏁 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { applyProductionRLS, checkRLSStatus }; 