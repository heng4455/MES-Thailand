const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://enhrflynwqxjhtvwybdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaHJmbHlud3F4amh0dnd5YmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ2MTk1ODgsImV4cCI6MjAzMDE5NTU4OH0.X3m7fwx5IgRsOqgQ5xJBqvpzB9OD7wjqE-JmZw7d2P8';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaHJmbHlud3F4amh0dnd5YmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDYxOTU4OCwiZXhwIjoyMDMwMTk1NTg4fQ.lZRE8-mJO0UX7B1-qlnVJaNE2ynSasmHp2ogZtdmpGU';

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testProcessData() {
    console.log('🔍 공정 데이터베이스 테스트 시작...\n');
    
    try {
        // 1. work_centers 테이블 확인
        console.log('📋 work_centers 테이블 확인...');
        const { data: workCenters, error: wcError } = await supabaseService
            .from('work_centers')
            .select('*')
            .limit(10);
            
        if (wcError) {
            console.log('❌ work_centers 오류:', wcError.message);
        } else {
            console.log(`✅ work_centers: ${workCenters.length}개 레코드`);
            if (workCenters.length > 0) {
                console.log('첫 번째 레코드 샘플:', workCenters[0]);
            }
        }
        
        // 2. process_routes 테이블 확인
        console.log('\n📋 process_routes 테이블 확인...');
        const { data: processRoutes, error: prError } = await supabaseService
            .from('process_routes')
            .select('*')
            .limit(10);
            
        if (prError) {
            console.log('❌ process_routes 오류:', prError.message);
        } else {
            console.log(`✅ process_routes: ${processRoutes.length}개 레코드`);
            if (processRoutes.length > 0) {
                console.log('첫 번째 레코드 샘플:', processRoutes[0]);
            }
        }
        
        // 3. process_steps 테이블 확인
        console.log('\n📋 process_steps 테이블 확인...');
        const { data: processSteps, error: psError } = await supabaseService
            .from('process_steps')
            .select('*')
            .limit(10);
            
        if (psError) {
            console.log('❌ process_steps 오류:', psError.message);
        } else {
            console.log(`✅ process_steps: ${processSteps.length}개 레코드`);
            if (processSteps.length > 0) {
                console.log('첫 번째 레코드 샘플:', processSteps[0]);
            }
        }
        
        // 4. JOIN 쿼리 테스트 (프론트엔드에서 사용하는 방식)
        console.log('\n📋 JOIN 쿼리 테스트...');
        const { data: joinData, error: joinError } = await supabaseService
            .from('work_centers')
            .select(`
                *,
                process_routes!work_center_id (
                    *,
                    products!process_routes_product_id_fkey (
                        product_code,
                        product_name,
                        client
                    ),
                    process_steps!route_id (*)
                )
            `)
            .limit(5);
            
        if (joinError) {
            console.log('❌ JOIN 쿼리 오류:', joinError.message);
        } else {
            console.log(`✅ JOIN 쿼리 성공: ${joinData.length}개 레코드`);
            if (joinData.length > 0) {
                console.log('JOIN 결과 샘플:', JSON.stringify(joinData[0], null, 2));
            }
        }
        
        // 5. 간단한 쿼리로 실제 데이터 구조 확인
        console.log('\n📋 간단한 work_centers 쿼리...');
        const { data: simpleData, error: simpleError } = await supabaseService
            .from('work_centers')
            .select('id, code, name, description, location, department, status')
            .limit(3);
            
        if (simpleError) {
            console.log('❌ 간단한 쿼리 오류:', simpleError.message);
        } else {
            console.log(`✅ 간단한 쿼리 성공: ${simpleData.length}개 레코드`);
            simpleData.forEach((item, index) => {
                console.log(`레코드 ${index + 1}:`, item);
            });
        }
        
        // 6. 제품 테이블 확인 (참조 관계)
        console.log('\n📋 products 테이블 확인...');
        const { data: products, error: prodError } = await supabaseService
            .from('products')
            .select('id, product_code, product_name, client')
            .limit(5);
            
        if (prodError) {
            console.log('❌ products 오류:', prodError.message);
        } else {
            console.log(`✅ products: ${products.length}개 레코드`);
            products.forEach((item, index) => {
                console.log(`제품 ${index + 1}:`, item);
            });
        }
        
        console.log('\n🎉 테스트 완료!');
        
    } catch (error) {
        console.error('❌ 테스트 실행 오류:', error);
    }
}

// 실행
if (require.main === module) {
    testProcessData();
}

module.exports = { testProcessData }; 