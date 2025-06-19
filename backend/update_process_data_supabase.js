const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (프론트엔드와 동일한 설정 사용)
const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc4NTIsImV4cCI6MjA2NTY0Mzg1Mn0.ZPxkyybsWNNl4sNS_k161t1DxKx2FMGsshohVTEbOtk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateProcessData() {
  try {
    console.log('🔄 공정 데이터 업데이트 시작...');
    
    // 기존 데이터 삭제 (순서 중요: 외래키 제약 때문)
    await supabase.from('process_steps').delete().neq('id', 0);
    await supabase.from('process_routes').delete().neq('id', 0);
    await supabase.from('work_centers').delete().neq('id', 0);
    
    console.log('🗑️ 기존 공정 데이터 삭제 완료');
    
    // 새로운 워크센터 데이터 삽입
    const workCenters = [
      {
        code: 'WC01',
        name: '원자재 검수',
        description: 'Raw material inspection and verification',
        location: '1층 원자재 창고',
        department: 'QC',
        capacity_per_hour: 50,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC02',
        name: '권선 작업',
        description: 'Coil winding operations for inductors',
        location: '2층 권선실',
        department: 'Production',
        capacity_per_hour: 30,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC03',
        name: '코어 성형',
        description: 'Ferrite core molding and shaping',
        location: '2층 성형실',
        department: 'Production',
        capacity_per_hour: 25,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC04',
        name: '조립 공정',
        description: 'Component assembly and integration',
        location: '3층 조립라인 A',
        department: 'Production',
        capacity_per_hour: 40,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC05',
        name: '납땜 공정',
        description: 'SMT and wave soldering operations',
        location: '3층 SMT라인',
        department: 'Production',
        capacity_per_hour: 35,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC06',
        name: '테스트 공정',
        description: 'Electrical and functional testing',
        location: '4층 테스트실',
        department: 'QC',
        capacity_per_hour: 60,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC07',
        name: '품질 검사',
        description: 'Final quality inspection and certification',
        location: '4층 품질관리실',
        department: 'QC',
        capacity_per_hour: 45,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC08',
        name: '포장 공정',
        description: 'Product packaging and labeling',
        location: '5층 포장라인',
        department: 'Shipping',
        capacity_per_hour: 80,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC09',
        name: '출하 준비',
        description: 'Shipping preparation and documentation',
        location: '5층 출하 대기실',
        department: 'Shipping',
        capacity_per_hour: 100,
        status: 'active',
        is_active: true
      },
      {
        code: 'WC10',
        name: '특수 가공',
        description: 'Special processing for custom orders',
        location: '2층 특수가공실',
        department: 'Production',
        capacity_per_hour: 15,
        status: 'active',
        is_active: true
      }
    ];
    
    const { data: insertedWorkCenters, error: wcError } = await supabase
      .from('work_centers')
      .insert(workCenters)
      .select();
    
    if (wcError) {
      console.error('워크센터 삽입 오류:', wcError);
      return;
    }
    
    console.log(`✅ 워크센터 데이터 삽입 완료 (${insertedWorkCenters.length}개 공정)`);
    
    // 제품 ID 확인
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, product_code')
      .order('id')
      .limit(9);
    
    if (productError) {
      console.error('제품 조회 오류:', productError);
      return;
    }
    
    console.log('📦 제품 목록:', products.map(p => `ID: ${p.id}, CODE: ${p.product_code}`));
    
    if (products.length >= 5) {
      // 공정 라우팅 삽입
      const routes = [
        {
          product_id: products[0].id,
          route_name: 'Power Inductor 표준 공정',
          version: '1.0',
          is_default: true,
          is_active: true
        },
        {
          product_id: products[1].id,
          route_name: 'Power Inductor 표준 공정',
          version: '1.0',
          is_default: true,
          is_active: true
        },
        {
          product_id: products[2].id,
          route_name: 'Coupled Inductor 공정',
          version: '1.0',
          is_default: true,
          is_active: true
        },
        {
          product_id: products[3].id,
          route_name: 'Shield Inductor 공정',
          version: '1.0',
          is_default: true,
          is_active: true
        },
        {
          product_id: products[4].id,
          route_name: 'Common Mode Choke 공정',
          version: '1.0',
          is_default: true,
          is_active: true
        }
      ];
      
      const { data: insertedRoutes, error: routeError } = await supabase
        .from('process_routes')
        .insert(routes)
        .select();
      
      if (routeError) {
        console.error('라우팅 삽입 오류:', routeError);
        return;
      }
      
      console.log(`🛤️ 공정 라우팅 삽입 완료: ${insertedRoutes.length}개`);
      
      // 공정 단계 삽입 (Power Inductor 표준 공정만 예시로)
      if (insertedRoutes.length > 0 && insertedWorkCenters.length >= 8) {
        const powerInductorSteps = [
          {
            route_id: insertedRoutes[0].id,
            step_number: 10,
            work_center_id: insertedWorkCenters[0].id, // WC01
            operation_name: '원자재 검수',
            description: '페라이트 코어 및 구리선 검수',
            setup_time_minutes: 15,
            run_time_minutes: 5,
            is_active: true
          },
          {
            route_id: insertedRoutes[0].id,
            step_number: 20,
            work_center_id: insertedWorkCenters[1].id, // WC02
            operation_name: '코일 권선',
            description: '지정 회전수로 구리선 권선',
            setup_time_minutes: 30,
            run_time_minutes: 12,
            is_active: true
          },
          {
            route_id: insertedRoutes[0].id,
            step_number: 30,
            work_center_id: insertedWorkCenters[3].id, // WC04
            operation_name: '단자 조립',
            description: '리드선 및 단자 조립',
            setup_time_minutes: 20,
            run_time_minutes: 8,
            is_active: true
          },
          {
            route_id: insertedRoutes[0].id,
            step_number: 40,
            work_center_id: insertedWorkCenters[4].id, // WC05
            operation_name: '납땜 작업',
            description: '단자 납땜 및 고정',
            setup_time_minutes: 25,
            run_time_minutes: 6,
            is_active: true
          },
          {
            route_id: insertedRoutes[0].id,
            step_number: 50,
            work_center_id: insertedWorkCenters[5].id, // WC06
            operation_name: '전기 테스트',
            description: '인덕턴스 및 저항 측정',
            setup_time_minutes: 10,
            run_time_minutes: 3,
            is_active: true
          },
          {
            route_id: insertedRoutes[0].id,
            step_number: 60,
            work_center_id: insertedWorkCenters[6].id, // WC07
            operation_name: '품질 검사',
            description: '외관 및 치수 검사',
            setup_time_minutes: 15,
            run_time_minutes: 4,
            is_active: true
          },
          {
            route_id: insertedRoutes[0].id,
            step_number: 70,
            work_center_id: insertedWorkCenters[7].id, // WC08
            operation_name: '포장 작업',
            description: '제품 포장 및 라벨링',
            setup_time_minutes: 10,
            run_time_minutes: 2,
            is_active: true
          }
        ];
        
        const { data: insertedSteps, error: stepError } = await supabase
          .from('process_steps')
          .insert(powerInductorSteps)
          .select();
        
        if (stepError) {
          console.error('공정 단계 삽입 오류:', stepError);
        } else {
          console.log(`🔧 공정 단계 삽입 완료: ${insertedSteps.length}개`);
        }
      }
    } else {
      console.log('⚠️ 제품 데이터가 부족합니다. 먼저 제품을 등록해주세요.');
    }
    
    // 최종 확인
    const { count: workCenterCount } = await supabase
      .from('work_centers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: routeCount } = await supabase
      .from('process_routes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: stepCount } = await supabase
      .from('process_steps')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    console.log('📊 최종 결과:');
    console.log(`   - 워크센터: ${workCenterCount}개`);
    console.log(`   - 공정 라우팅: ${routeCount}개`);
    console.log(`   - 공정 단계: ${stepCount}개`);
    console.log('✅ 공정 데이터 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateProcessData(); 