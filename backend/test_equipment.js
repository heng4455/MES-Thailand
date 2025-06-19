const { supabase } = require('./src/config/database');

async function testEquipment() {
  try {
    console.log('설비 테이블 확인 중...');
    
    // 설비 데이터 조회 테스트
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('설비 데이터 조회 오류:', error);
      return;
    }
    
    console.log('✅ 설비 데이터 조회 성공');
    console.log('현재 설비 개수:', data.length);
    
    if (data.length > 0) {
      console.log('첫 번째 설비:', data[0]);
    } else {
      console.log('설비 데이터가 없습니다');
    }
    
    // 새 설비 생성 테스트
    console.log('\n새 설비 생성 테스트...');
    const testEquipment = {
      equipment_code: 'TEST-001',
      name: '테스트 설비',
      location: '1층 생산라인',
      status: 'operational',
      specifications: JSON.stringify({
        capacity: '100 units/hour',
        relatedProcess: '조립',
        type: 'Manufacturing Equipment'
      }),
      notes: '테스트용 설비입니다'
    };
    
    const { data: newEquipment, error: createError } = await supabase
      .from('equipment')
      .insert([testEquipment])
      .select();
    
    if (createError) {
      console.error('설비 생성 오류:', createError);
    } else {
      console.log('✅ 설비 생성 성공:', newEquipment[0]);
      
      // 생성된 설비 삭제 (테스트 정리)
      await supabase.from('equipment').delete().eq('id', newEquipment[0].id);
      console.log('테스트 설비 삭제 완료');
    }
    
  } catch (err) {
    console.error('실행 오류:', err);
  }
}

testEquipment(); 