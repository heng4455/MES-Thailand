const db = require('./src/config/database');

async function updateProcessData() {
  try {
    console.log('🔄 공정 데이터 업데이트 시작...');
    
    // 기존 데이터 삭제 (순서 중요: 외래키 제약 때문)
    await db.query('DELETE FROM process_steps WHERE route_id IN (SELECT id FROM process_routes)');
    await db.query('DELETE FROM process_routes');
    await db.query('DELETE FROM work_centers');
    
    console.log('🗑️ 기존 공정 데이터 삭제 완료');
    
    // 새로운 워크센터 데이터 삽입
    const workCenters = [
      ['WC01', '원자재 검수', 'Raw material inspection and verification', '1층 원자재 창고', 'QC', 50, 'active'],
      ['WC02', '권선 작업', 'Coil winding operations for inductors', '2층 권선실', 'Production', 30, 'active'],
      ['WC03', '코어 성형', 'Ferrite core molding and shaping', '2층 성형실', 'Production', 25, 'active'],
      ['WC04', '조립 공정', 'Component assembly and integration', '3층 조립라인 A', 'Production', 40, 'active'],
      ['WC05', '납땜 공정', 'SMT and wave soldering operations', '3층 SMT라인', 'Production', 35, 'active'],
      ['WC06', '테스트 공정', 'Electrical and functional testing', '4층 테스트실', 'QC', 60, 'active'],
      ['WC07', '품질 검사', 'Final quality inspection and certification', '4층 품질관리실', 'QC', 45, 'active'],
      ['WC08', '포장 공정', 'Product packaging and labeling', '5층 포장라인', 'Shipping', 80, 'active'],
      ['WC09', '출하 준비', 'Shipping preparation and documentation', '5층 출하 대기실', 'Shipping', 100, 'active'],
      ['WC10', '특수 가공', 'Special processing for custom orders', '2층 특수가공실', 'Production', 15, 'active']
    ];
    
    for (const wc of workCenters) {
      await db.query(`
        INSERT INTO work_centers (code, name, description, location, department, capacity_per_hour, status, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
      `, wc);
    }
    
    console.log('✅ 워크센터 데이터 삽입 완료 (10개 공정)');
    
    // 제품 ID 확인
    const products = await db.query('SELECT id, product_code FROM products ORDER BY id LIMIT 9');
    console.log('📦 제품 목록:', products.rows.map(p => `ID: ${p.id}, CODE: ${p.product_code}`));
    
    if (products.rows.length >= 5) {
      // 공정 라우팅 삽입
      const routes = [
        [products.rows[0].id, 'Power Inductor 표준 공정', '1.0', true, true],
        [products.rows[1].id, 'Power Inductor 표준 공정', '1.0', true, true],
        [products.rows[2].id, 'Coupled Inductor 공정', '1.0', true, true],
        [products.rows[3].id, 'Shield Inductor 공정', '1.0', true, true],
        [products.rows[4].id, 'Common Mode Choke 공정', '1.0', true, true]
      ];
      
      const routeResults = [];
      for (const route of routes) {
        const result = await db.query(`
          INSERT INTO process_routes (product_id, route_name, version, is_default, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `, route);
        routeResults.push(result.rows[0].id);
      }
      
      console.log('🛤️ 공정 라우팅 삽입 완료:', routeResults);
      
      // 공정 단계 삽입 (Power Inductor 표준 공정)
      const powerInductorSteps = [
        [routeResults[0], 10, 1, '원자재 검수', '페라이트 코어 및 구리선 검수', 15, 5],
        [routeResults[0], 20, 2, '코일 권선', '지정 회전수로 구리선 권선', 30, 12],
        [routeResults[0], 30, 4, '단자 조립', '리드선 및 단자 조립', 20, 8],
        [routeResults[0], 40, 5, '납땜 작업', '단자 납땜 및 고정', 25, 6],
        [routeResults[0], 50, 6, '전기 테스트', '인덕턴스 및 저항 측정', 10, 3],
        [routeResults[0], 60, 7, '품질 검사', '외관 및 치수 검사', 15, 4],
        [routeResults[0], 70, 8, '포장 작업', '제품 포장 및 라벨링', 10, 2]
      ];
      
      for (const step of powerInductorSteps) {
        await db.query(`
          INSERT INTO process_steps (route_id, step_number, work_center_id, operation_name, description, setup_time_minutes, run_time_minutes, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
        `, step);
      }
      
      console.log('🔧 공정 단계 삽입 완료');
    } else {
      console.log('⚠️ 제품 데이터가 부족합니다. 먼저 제품을 등록해주세요.');
    }
    
    // 최종 확인
    const workCenterCount = await db.query('SELECT COUNT(*) FROM work_centers WHERE is_active = true');
    const routeCount = await db.query('SELECT COUNT(*) FROM process_routes WHERE is_active = true');
    const stepCount = await db.query('SELECT COUNT(*) FROM process_steps WHERE is_active = true');
    
    console.log('📊 최종 결과:');
    console.log(`   - 워크센터: ${workCenterCount.rows[0].count}개`);
    console.log(`   - 공정 라우팅: ${routeCount.rows[0].count}개`);
    console.log(`   - 공정 단계: ${stepCount.rows[0].count}개`);
    console.log('✅ 공정 데이터 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

updateProcessData(); 