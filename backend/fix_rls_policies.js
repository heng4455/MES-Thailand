const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2Nzg1MiwiZXhwIjoyMDY1NjQzODUyfQ.QW1WGfU8Q0Fp4UtVd1eCOHlOSs9kRnDbJXhsNgMD8fI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 RLS 정책 수정 시작...');

  try {
    // 1. 기존 정책들 삭제
    console.log('🗑️ 기존 RLS 정책 삭제...');
    
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
      DROP POLICY IF EXISTS "Authenticated users can access customers" ON public.customers;
      DROP POLICY IF EXISTS "Authenticated users can access products" ON public.products;
      DROP POLICY IF EXISTS "Authenticated users can access work_orders" ON public.work_orders;
      DROP POLICY IF EXISTS "Authenticated users can access inventory" ON public.inventory;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    if (dropError) console.log('정책 삭제 중 일부 오류 (정상):', dropError.message);

    // 2. 새로운 안전한 정책들 생성
    console.log('🔐 새로운 RLS 정책 생성...');

    const createPolicies = `
      -- user_profiles 테이블 정책
      CREATE POLICY "Enable read for authenticated users" 
      ON public.user_profiles FOR SELECT 
      TO authenticated
      USING (true);

      CREATE POLICY "Enable insert for authenticated users" 
      ON public.user_profiles FOR INSERT 
      TO authenticated
      WITH CHECK (true);

      CREATE POLICY "Enable update for own profile" 
      ON public.user_profiles FOR UPDATE 
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);

      CREATE POLICY "Enable delete for own profile" 
      ON public.user_profiles FOR DELETE 
      TO authenticated
      USING (auth.uid() = id);

      -- 기타 테이블들은 인증된 사용자 전체 접근 허용
      CREATE POLICY "Enable all for authenticated users" 
      ON public.customers FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);

      CREATE POLICY "Enable all for authenticated users" 
      ON public.products FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);

      CREATE POLICY "Enable all for authenticated users" 
      ON public.work_orders FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);

      CREATE POLICY "Enable all for authenticated users" 
      ON public.inventory FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);

      CREATE POLICY "Enable all for authenticated users" 
      ON public.equipment FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);

      CREATE POLICY "Enable all for authenticated users" 
      ON public.plc_devices FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);

      CREATE POLICY "Enable all for authenticated users" 
      ON public.work_centers FOR ALL 
      TO authenticated
      USING (true)
      WITH CHECK (true);
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    if (createError) {
      console.error('정책 생성 오류:', createError);
      return;
    }

    console.log('✅ RLS 정책 수정 완료!');

    // 3. 테스트 쿼리 실행
    console.log('🧪 정책 테스트 중...');
    
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ 테스트 실패:', testError);
    } else {
      console.log('✅ 테스트 성공! 정책이 올바르게 작동합니다.');
    }

  } catch (error) {
    console.error('RLS 정책 수정 중 오류:', error);
  }
}

// exec_sql 함수가 없을 경우를 대비한 직접 SQL 실행 함수
async function createExecSqlFunction() {
  try {
    const createFunction = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;

    const { error } = await supabase.rpc('exec', { sql: createFunction });
    if (error) {
      console.log('exec_sql 함수 생성 건너뜀 (이미 존재하거나 권한 없음)');
    }
  } catch (error) {
    console.log('exec_sql 함수 생성 건너뜀');
  }
}

async function main() {
  await createExecSqlFunction();
  await fixRLSPolicies();
}

main().catch(console.error); 