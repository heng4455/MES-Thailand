const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rrkumbyeyhxdsblqxrmn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc4NTIsImV4cCI6MjA2NTY0Mzg1Mn0.ZPxkyybsWNNl4sNS_k161t1DxKx2FMGsshohVTEbOtk'
);

async function checkTableSchemas() {
  const tables = [
    'user_profiles',
    'team_assignments', 
    'status_definitions',
    'product_groups',
    'plc_devices',
    'user_roles',
    'permissions',
    'role_permissions'
  ];

  for (const tableName of tables) {
    try {
      console.log(`\n=== ${tableName} 테이블 스키마 ===`);
      
      // 테이블 구조 확인 (간단한 방법)
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error(`${tableName} 조회 오류:`, sampleError.message);
        continue;
      }
      
      if (sample && sample.length > 0) {
        console.log('컬럼 목록:', Object.keys(sample[0]));
        console.log('샘플 데이터:', JSON.stringify(sample[0], null, 2));
      } else {
        console.log('데이터가 없음 - 빈 insert로 컬럼 확인 시도');
        
        // 빈 데이터로 insert 시도해서 에러 메시지로 컬럼 확인
        try {
          await supabase.from(tableName).insert({});
        } catch (insertError) {
          console.log('Insert 에러:', insertError.message);
        }
      }
      
    } catch (error) {
      console.error(`${tableName} 테이블 확인 중 오류:`, error);
    }
  }
}

checkTableSchemas(); 