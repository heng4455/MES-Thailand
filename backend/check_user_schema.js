const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rrkumbyeyhxdsblqxrmn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc4NTIsImV4cCI6MjA2NTY0Mzg1Mn0.ZPxkyybsWNNl4sNS_k161t1DxKx2FMGsshohVTEbOtk'
);

async function checkSchema() {
  try {
    console.log('=== user_profiles 테이블 스키마 확인 ===');
    
    // 테이블 구조 확인
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public');
      
    if (error) {
      console.error('스키마 조회 오류:', error);
    } else {
      console.log('컬럼 정보:');
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    }
    
    // 실제 데이터 샘플 확인
    console.log('\n=== 실제 데이터 샘플 ===');
    const { data: sample, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);
      
    if (sampleError) {
      console.error('데이터 조회 오류:', sampleError);
    } else {
      console.log('샘플 데이터:', JSON.stringify(sample, null, 2));
    }
    
    // joon 계정 찾기
    console.log('\n=== joon 계정 찾기 ===');
    const { data: joonData, error: joonError } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('email', '%joon%');
      
    if (joonError) {
      console.error('joon 계정 조회 오류:', joonError);
    } else {
      console.log('joon 계정 데이터:', JSON.stringify(joonData, null, 2));
    }
    
    // 특정 사용자 ID로 찾기
    console.log('\n=== 특정 사용자 ID로 찾기 ===');
    const { data: userById, error: userByIdError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', '25424ac0-4d3f-4912-80e9-c8a008034c6c');
      
    if (userByIdError) {
      console.error('ID로 조회 오류:', userByIdError);
    } else {
      console.log('ID로 찾은 데이터:', JSON.stringify(userById, null, 2));
    }
    
  } catch (error) {
    console.error('전체 오류:', error);
  }
}

checkSchema(); 