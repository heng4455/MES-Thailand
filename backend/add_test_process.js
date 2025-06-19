const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://enhrflynwqxjhtvwybdt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaHJmbHlud3F4amh0dnd5YmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDYxOTU4OCwiZXhwIjoyMDMwMTk1NTg4fQ.lZRE8-mJO0UX7B1-qlnVJaNE2ynSasmHp2ogZtdmpGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestProcessData() {
    console.log('🔧 테스트 공정 데이터 추가 시작...\n');
    
    try {
        // 1. 먼저 기존 제품이 있는지 확인
        console.log('📋 기존 제품 확인...');
        const { data: existingProducts, error: productError } = await supabase
            .from('products')
            .select('id, product_code, product_name, client')
            .limit(3);
            
        if (productError) {
            console.log('❌ 제품 확인 오류:', productError.message);
            return;
        }
        
        console.log('✅ 기존 제품:', existingProducts);
        
        // 2. 테스트 제품이 없다면 추가
        if (existingProducts.length === 0) {
            console.log('📦 테스트 제품 추가...');
            const testProducts = [
                {
                    product_code: 'TEST-001',
                    product_name: '테스트 제품 1',
                    client: 'MOBIS',
                    quantity: 100,
                    order_status: 'pending'
                },
                {
                    product_code: 'TEST-002', 
                    product_name: '테스트 제품 2',
                    client: 'LG Electronics',
                    quantity: 50,
                    order_status: 'inProcess'
                }
            ];
            
            const { data: newProducts, error: insertProductError } = await supabase
                .from('products')
                .insert(testProducts)
                .select();
                
            if (insertProductError) {
                console.log('❌ 제품 추가 오류:', insertProductError.message);
                return;
            }
            
            console.log('✅ 테스트 제품 추가 완료:', newProducts);
        }
        
        // 3. 테스트 work_centers 추가
        console.log('🏭 테스트 work_center 추가...');
        const testWorkCenters = [
            {
                code: 'WC-001',
                name: '조립 공정',
                description: '제품 조립을 위한 공정',
                location: '1공장',
                department: '생산부',
                capacity_per_hour: 50,
                status: 'active'
            },
            {
                code: 'WC-002',
                name: '품질 검사',
                description: '제품 품질 검사 공정',
                location: '1공장',
                department: '품질부',
                capacity_per_hour: 30,
                status: 'active'
            },
            {
                code: 'WC-003',
                name: '포장 공정',
                description: '제품 포장을 위한 공정',
                location: '2공장',
                department: '출하부',
                capacity_per_hour: 80,
                status: 'active'
            }
        ];
        
        // 기존 work_center 삭제 (테스트용)
        await supabase.from('work_centers').delete().neq('id', 0);
        
        const { data: workCenters, error: wcError } = await supabase
            .from('work_centers')
            .insert(testWorkCenters)
            .select();
            
        if (wcError) {
            console.log('❌ work_center 추가 오류:', wcError.message);
            return;
        }
        
        console.log('✅ work_center 추가 완료:', workCenters);
        
        // 4. process_routes 추가 (제품과 연결)
        console.log('🛤️ process_routes 추가...');
        const { data: products } = await supabase
            .from('products')
            .select('id, product_code')
            .limit(2);
            
        if (products && products.length > 0) {
            const testRoutes = products.map((product, index) => ({
                product_id: product.id,
                route_name: `${product.product_code} 생산 라우트`,
                version: '1.0',
                is_default: true,
                is_active: true
            }));
            
            const { data: routes, error: routeError } = await supabase
                .from('process_routes')
                .insert(testRoutes)
                .select();
                
            if (routeError) {
                console.log('❌ process_routes 추가 오류:', routeError.message);
            } else {
                console.log('✅ process_routes 추가 완료:', routes);
                
                // 5. process_steps 추가
                console.log('👣 process_steps 추가...');
                const testSteps = [];
                
                routes.forEach((route, routeIndex) => {
                    workCenters.forEach((wc, stepIndex) => {
                        testSteps.push({
                            route_id: route.id,
                            step_number: stepIndex + 1,
                            work_center_id: wc.id,
                            operation_name: `${wc.name} 작업`,
                            description: `${route.route_name}의 ${wc.name} 단계`,
                            setup_time_minutes: 10,
                            run_time_minutes: 30,
                            is_active: true
                        });
                    });
                });
                
                const { data: steps, error: stepError } = await supabase
                    .from('process_steps')
                    .insert(testSteps)
                    .select();
                    
                if (stepError) {
                    console.log('❌ process_steps 추가 오류:', stepError.message);
                } else {
                    console.log('✅ process_steps 추가 완료:', steps);
                }
            }
        }
        
        // 6. 최종 확인
        console.log('\n📊 최종 데이터 확인...');
        
        const { data: finalWorkCenters } = await supabase
            .from('work_centers')
            .select('*');
        console.log(`work_centers: ${finalWorkCenters?.length || 0}개`);
        
        const { data: finalRoutes } = await supabase
            .from('process_routes')
            .select('*');
        console.log(`process_routes: ${finalRoutes?.length || 0}개`);
        
        const { data: finalSteps } = await supabase
            .from('process_steps')
            .select('*');
        console.log(`process_steps: ${finalSteps?.length || 0}개`);
        
        console.log('\n🎉 테스트 데이터 추가 완료!');
        
    } catch (error) {
        console.error('❌ 테스트 데이터 추가 실패:', error);
    }
}

// 실행
if (require.main === module) {
    addTestProcessData();
}

module.exports = { addTestProcessData }; 