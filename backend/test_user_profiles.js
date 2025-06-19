const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc4NTIsImV4cCI6MjA2NTY0Mzg1Mn0.ZPxkyybsWNNl4sNS_k161t1DxKx2FMGsshohVTEbOtk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserProfiles() {
  console.log('🔍 user_profiles 테이블 상태 확인 중...\n');

  try {
    // 1. 전체 테이블 조회 테스트
    console.log('1. 전체 user_profiles 테이블 조회:');
    const { data: allUsers, error: allError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ 전체 조회 오류:', allError);
      console.log(`   에러 코드: ${allError.code}`);
      console.log(`   에러 메시지: ${allError.message}`);
      
      if (allError.code === '406' || allError.message?.includes('Not Acceptable')) {
        console.log('🔧 406 오류 감지 - user_profiles 테이블이 없거나 접근 불가능');
      }
    } else {
      console.log(`✅ 전체 조회 성공 (${allUsers?.length || 0}개 사용자)`);
      allUsers?.forEach(user => {
        console.log(`   - ${user.full_name || user.email} (${user.role})`);
      });
    }

    // 2. 특정 ID 조회 테스트 (문제가 된 ID)
    console.log('\n2. 특정 ID 조회 테스트:');
    const testId = '25424ac0-4d3f-4912-80e9-c8a008034c6c';
    const { data: specificUser, error: specificError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', testId)
      .single();

    if (specificError) {
      console.error(`❌ 특정 ID (${testId}) 조회 오류:`, specificError);
      console.log(`   에러 코드: ${specificError.code}`);
      console.log(`   에러 메시지: ${specificError.message}`);
    } else {
      console.log(`✅ 특정 ID 조회 성공:`, specificUser);
    }

    // 3. 테이블 스키마 확인
    console.log('\n3. 테이블 정보 확인:');
    try {
      // Supabase REST API로 테이블 정보 조회
      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?limit=0`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log(`   응답 상태: ${response.status} ${response.statusText}`);
      
      if (response.status === 406) {
        console.log('🔧 406 Not Acceptable - 테이블이 존재하지 않거나 권한 문제');
      } else if (response.status === 200) {
        console.log('✅ 테이블 접근 가능');
      }
    } catch (fetchError) {
      console.error('❌ 직접 API 호출 오류:', fetchError.message);
    }

    // 4. 사용자 생성 테스트
    console.log('\n4. 새 사용자 생성 테스트:');
    const testUser = {
      email: `test-${Date.now()}@mes-thailand.com`,
      full_name: '테스트 사용자',
      department: 'IT',
      position: 'Tester',
      role: 'operator',
      approval_status: 'approved',
      is_active: true
    };

    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert([testUser])
      .select();

    if (createError) {
      console.error('❌ 사용자 생성 오류:', createError);
    } else {
      console.log('✅ 사용자 생성 성공:', newUser);
      
      // 생성한 테스트 사용자 삭제
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', newUser[0].id);
        
      if (!deleteError) {
        console.log('✅ 테스트 사용자 정리 완료');
      }
    }

  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('테스트 완료');
  console.log('='.repeat(50));
}

// 테스트 실행
testUserProfiles().catch(console.error); 