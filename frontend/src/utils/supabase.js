import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc4NTIsImV4cCI6MjA2NTY0Mzg1Mn0.ZPxkyybsWNNl4sNS_k161t1DxKx2FMGsshohVTEbOtk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit' // PKCE에서 implicit으로 변경 (웹 호환성 개선)
  }
});

// 디버깅을 위한 연결 테스트
console.log('🔗 Supabase 연결 정보:');
console.log('URL:', supabaseUrl);
console.log('Current Origin:', window.location.origin);
console.log('User Agent:', navigator.userAgent);

// =========================================
// 사용자 관리 API 함수들
// =========================================

// 제품 그룹 관리 API
export const productGroupsAPI = {
  // 모든 제품 그룹 조회
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .select('*')
        .order('group_code', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('제품 그룹 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 제품 그룹 생성
  create: async (groupData) => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .insert([groupData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('제품 그룹 생성 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 제품 그룹 수정
  update: async (id, groupData) => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .update(groupData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('제품 그룹 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 제품 그룹 삭제
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('product_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('제품 그룹 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 사용자 관리 API
export const usersAPI = {
  // 승인 대기 중인 사용자들 조회 (user_profiles 테이블 사용)
  getPendingUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // UI 포맷으로 변환
      const pendingUsers = data.map(user => {
        const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          id: user.id,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          department: user.department || '',
          position: user.position || '',
          phone: user.phone || '',
          emailConfirmed: true, // user_profiles에 있다면 이미 이메일 인증됨
          registrationDate: new Date(user.created_at).toLocaleString('ko-KR'),
          user_metadata: {
            approval_status: user.approval_status,
            first_name: firstName,
            last_name: lastName,
            department: user.department,
            position: user.position,
            phone: user.phone
          }
        };
      });
      
      return { success: true, data: pendingUsers };
    } catch (error) {
      console.error('승인 대기 사용자 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 모든 활성 사용자 조회
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 사용자 추가
  create: async (userData) => {
    try {
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          full_name: fullName,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          approval_status: userData.status === 'active' ? 'approved' : 'pending',
          is_active: userData.status === 'active',
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('사용자 추가 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 사용자 수정
  update: async (id, userData) => {
    try {
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          position: userData.position,
          approval_status: userData.status === 'active' ? 'approved' : 'pending',
          is_active: userData.status === 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('사용자 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 사용자 삭제
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 사용자 승인 (user_profiles 테이블에서 직접 승인)
  approveUser: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'approved',
          is_active: true,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 사용자 거부 (user_profiles 테이블에서 직접 거부)
  rejectUser: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'rejected',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('사용자 거부 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// =========================================
// 데이터베이스 API 함수들
// =========================================

// 고객 관리 API
export const customersAPI = {
  // 모든 고객 조회
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('고객 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 고객 추가
  create: async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          customer_name: customerData.customerName,
          company_name: customerData.companyName,
          contact: customerData.contact,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          status: customerData.status,
          registration_date: new Date().toISOString().split('T')[0],
          total_orders: 0,
          active_projects: 0
        }])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('고객 추가 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 고객 수정
  update: async (id, customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          customer_name: customerData.customerName,
          company_name: customerData.companyName,
          contact: customerData.contact,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          status: customerData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('고객 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 고객 삭제
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('고객 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 제품 관리 API
export const productsAPI = {
  // 모든 제품 조회
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('제품 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 제품 추가
  create: async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          product_code: productData.product_code || productData.productCode,
          product_name: productData.product_name || productData.productName,
          client: productData.client,
          quantity: productData.quantity,
          unit: productData.unit,
          order_status: productData.order_status || productData.orderStatus,
          registration_date: productData.registration_date || new Date().toISOString().split('T')[0],
          order_progress: productData.order_progress || productData.orderProgress || 0,
          description: productData.description || ''
        }])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('제품 추가 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 제품 수정
  update: async (id, productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          product_code: productData.productCode,
          product_name: productData.productName,
          client: productData.client,
          quantity: productData.quantity,
          unit: productData.unit,
          order_status: productData.orderStatus,
          order_progress: productData.orderProgress,
          description: productData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('제품 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 제품 삭제
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('제품 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 공정 관리 API
export const processAPI = {
  // 모든 공정 조회 (관련 제품 정보 포함)
  getAll: async () => {
    try {
      console.log('📊 공정 목록 조회 시작...');
      
      // 1. work_centers 기본 데이터 조회
      const { data: workCenters, error: wcError } = await supabase
        .from('work_centers')
        .select('*')
        .order('created_at', { ascending: false });

      if (wcError) {
        console.error('❌ work_centers 조회 오류:', wcError);
        throw wcError;
      }

      console.log(`✅ work_centers 조회 성공: ${workCenters.length}개`);

      // 2. 각 work_center에 대해 제품 정보 매핑
      const processesWithProducts = await Promise.all(
        workCenters.map(async (wc) => {
          let relatedProduct = 'N/A';
          let relatedProductName = 'N/A';
          let client = wc.department || 'N/A';

          try {
            // description에서 제품 코드 추출 시도
            let productCode = null;
            if (wc.description && wc.description !== 'N/A') {
              // "CMT-0001 | 제품명" 형식에서 제품 코드 추출
              const match = wc.description.match(/^([A-Z0-9-]+)/);
              if (match) {
                productCode = match[1];
              }
            }

            // 제품 코드가 있으면 제품 정보 조회
            if (productCode) {
              const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, product_code, product_name, client')
                .eq('product_code', productCode)
                .single();

              if (!productError && productData) {
                relatedProduct = productData.product_code;
                relatedProductName = productData.product_name;
                client = productData.client || wc.department || 'N/A';
                console.log(`🔗 제품 연결 성공: ${wc.name} -> ${relatedProduct} (${relatedProductName})`);
              } else {
                console.log(`⚠️ 제품 정보 조회 실패: ${productCode}`);
                relatedProduct = productCode; // 최소한 코드라도 표시
              }
            }

            // process_steps를 통한 제품 정보 조회 시도 (fallback)
            if (relatedProduct === 'N/A') {
              const { data: steps, error: stepsError } = await supabase
                .from('process_steps')
                .select(`
                  route_id,
                  process_routes!inner(
                    product_id,
                    products!inner(
                      product_code,
                      product_name,
                      client
                    )
                  )
                `)
                .eq('work_center_id', wc.id)
                .limit(1);

              if (!stepsError && steps && steps.length > 0) {
                const productInfo = steps[0].process_routes.products;
                relatedProduct = productInfo.product_code;
                relatedProductName = productInfo.product_name;
                client = productInfo.client || client;
                console.log(`🔗 process_steps를 통한 제품 연결: ${wc.name} -> ${relatedProduct}`);
              }
            }

          } catch (error) {
            console.warn(`⚠️ 제품 정보 조회 중 오류 (ID: ${wc.id}):`, error.message);
          }

          // UI 형식으로 변환
          return {
            id: `wc_${wc.id}`,
            processName: wc.name,
            processCode: wc.code,
            relatedProduct: relatedProduct,
            relatedProductName: relatedProductName,
            relatedProductDisplay: relatedProduct !== 'N/A' && relatedProductName !== 'N/A' 
              ? `${relatedProduct} - ${relatedProductName}` 
              : relatedProduct,
            customer: client,
            processType: wc.location || 'N/A',
            statusType: wc.status || 'active',
            description: wc.description || 'N/A',
            registrationDate: wc.created_at ? new Date(wc.created_at).toLocaleString('ko-KR') : 'N/A',
            updatedDate: wc.updated_at ? new Date(wc.updated_at).toLocaleString('ko-KR') : 'N/A'
          };
        })
      );

      console.log(`✅ 공정-제품 매핑 완료: ${processesWithProducts.length}개`);
      return { success: true, data: processesWithProducts };

    } catch (error) {
      console.error('❌ 공정 목록 조회 오류:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // 공정 추가
  create: async (processData) => {
    try {
      console.log('🔄 공정 생성 시작:', processData);
      
      // 필수 필드 검증 및 기본값 설정
      const operationName = processData.operation_name || processData.name || processData.processName || '이름 없음';
      const processCode = processData.code || processData.processCode || 'CODE-' + Date.now();
      
      // 제품 코드 처리 - Excel에서 전달받은 product_code 우선 사용
      const productCode = processData.product_code || processData.related_product_code || null;
      
      // work_centers 테이블에 삽입할 데이터 준비
      const workCenterData = {
        name: operationName, // null 방지를 위한 기본값 적용
        code: processCode, // 중복 체크 없이 바로 사용
        description: productCode || processData.description || 'N/A',
        location: processData.process_type || '',
        department: processData.client || '',
        status: processData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📤 work_centers 생성 데이터:', workCenterData);
      console.log('🔗 제품 코드:', productCode);
      
      // work_centers 테이블에 삽입
      const { data: workCenter, error: wcError } = await supabase
        .from('work_centers')
        .insert([workCenterData])
        .select();

      if (wcError) {
        console.error('❌ work_centers 생성 오류:', wcError);
        throw wcError;
      }
      
      console.log('✅ work_centers 생성 성공:', workCenter[0]);
      
      // 제품 정보가 있는 경우 process_routes와 process_steps 생성
      if (productCode && productCode !== 'N/A' && productCode !== '') {
        try {
          console.log('🔗 제품-공정 연결 생성 시도:', productCode);
          
          // 해당 제품 ID 찾기
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, product_name, product_code, client')
            .eq('product_code', productCode)
            .single();
            
          if (!productError && productData) {
            console.log('✅ 제품 정보 찾기 성공:', productData);
            
            // work_center의 description을 제품 정보로 업데이트
            const productDescription = `${productData.product_code} | ${productData.product_name}${processData.description ? ` | ${processData.description}` : ''}`;
            
            const { error: descUpdateError } = await supabase
              .from('work_centers')
              .update({ 
                description: productDescription,
                department: processData.client || productData.client || ''
              })
              .eq('id', workCenter[0].id);
              
            if (!descUpdateError) {
              console.log('✅ 제품 정보가 description에 저장됨:', productDescription);
            } else {
              console.warn('⚠️ description 업데이트 실패:', descUpdateError);
            }
            
            // process_routes 및 process_steps 생성 (optional)
            try {
              // 기본 라우트 찾기 또는 생성
              let { data: route, error: routeError } = await supabase
                .from('process_routes')
                .select('id')
                .eq('product_id', productData.id)
                .eq('is_default', true)
                .single();
                
              if (routeError || !route) {
                // 새로운 라우트 생성
                const { data: newRoute, error: newRouteError } = await supabase
                  .from('process_routes')
                  .insert([{
                    product_id: productData.id,
                    route_name: `${productData.product_code} 기본 라우트`,
                    version: '1.0',
                    is_default: true,
                    is_active: true
                  }])
                  .select();
                  
                if (!newRouteError && newRoute && newRoute.length > 0) {
                  route = newRoute[0];
                  console.log('✅ 새 라우트 생성됨:', route.id);
                }
              }
              
              if (route) {
                // process_step 생성
                const { error: stepError } = await supabase
                  .from('process_steps')
                  .insert([{
                    route_id: route.id,
                    step_number: 1,
                    work_center_id: workCenter[0].id,
                    operation_name: operationName,
                    description: productDescription,
                    run_time_minutes: 60
                  }]);
                  
                if (!stepError) {
                  console.log('✅ process_step 생성 완료');
                } else {
                  console.warn('⚠️ process_step 생성 실패:', stepError.message);
                }
              }
            } catch (routeStepError) {
              console.warn('⚠️ 라우트/스텝 생성 중 오류 (무시됨):', routeStepError.message);
            }
          } else {
            console.warn('⚠️ 제품 정보를 찾을 수 없음:', productCode, productError?.message);
          }
        } catch (productLinkError) {
          console.warn('⚠️ 제품 연결 중 오류 (무시됨):', productLinkError.message);
        }
      } else {
        console.log('ℹ️ 제품 코드가 없어서 제품 연결 업데이트를 건너뜀');
      }
      
      return { success: true, data: workCenter[0] };
    } catch (error) {
      console.error('❌ 공정 생성 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 공정 수정
  update: async (id, processData) => {
    try {
      console.log('🔄 공정 수정 시작:', id, processData);
      
      // ID에서 접두사 제거하여 실제 ID 추출
      const realId = id.toString().replace(/^(wc_|rt_)/, '');
      
      // 제품 정보가 있으면 description에 포함
      let finalDescription = processData.description || '';
      if (processData.product_code && processData.product_code !== 'N/A') {
        // 제품 정보를 description 앞쪽에 배치
        finalDescription = processData.product_code + (finalDescription ? ` | ${finalDescription}` : '');
      }
      
      // work_centers 테이블 업데이트 (코드 필드 제외 - unique constraint 문제 회피)
      const updateData = {
        name: processData.operation_name,
        // code: processData.code, // 임시로 코드 업데이트 제외
        description: finalDescription || processData.product_code || 'N/A',
        location: processData.process_type || '',
        department: processData.client || '',
        status: processData.status || 'active',
        updated_at: new Date().toISOString()
      };
      
      console.log('📤 업데이트할 데이터 (코드 제외):', updateData);
      
      const { data, error } = await supabase
        .from('work_centers')
        .update(updateData)
        .eq('id', realId)
        .select();

      if (error) {
        console.error('❌ work_centers 업데이트 오류:', error);
        throw error;
      }
      
      console.log('✅ work_centers 업데이트 성공:', data[0]);

      // 제품 연결 정보 업데이트 - 항상 시도
      if (processData.product_code && processData.product_code !== 'N/A' && processData.product_code !== '') {
        try {
          console.log('🔗 제품 연결 정보 업데이트 시도:', processData.product_code);
          
          // 해당 제품 ID 찾기
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, product_name, product_code')
            .eq('product_code', processData.product_code)
            .single();
            
          if (!productError && productData) {
            console.log('✅ 제품 정보 찾기 성공:', productData);
            
            // work_center의 description을 제품 정보로 다시 업데이트
            const productDescription = `${productData.product_code} | ${productData.product_name}${processData.description ? ` | ${processData.description}` : ''}`;
            
            const { error: descUpdateError } = await supabase
              .from('work_centers')
              .update({ 
                description: productDescription,
                department: processData.client || productData.client || ''
              })
              .eq('id', realId);
              
            if (!descUpdateError) {
              console.log('✅ 제품 정보가 description에 저장됨:', productDescription);
            } else {
              console.warn('⚠️ description 업데이트 실패:', descUpdateError);
            }
            
            // process_routes 및 process_steps 연결 시도 (optional)
            try {
              // 기존 process_steps 확인
              const { data: existingSteps } = await supabase
                .from('process_steps')
                .select('id, route_id')
                .eq('work_center_id', realId);
                
              if (existingSteps && existingSteps.length > 0) {
                console.log('✅ 기존 process_steps 발견, 업데이트 건너뜀');
              } else {
                // 새로운 연결 생성 시도
                console.log('🔗 새로운 제품-공정 연결 생성 시도...');
                
                // 기본 라우트 찾기 또는 생성
                let { data: route } = await supabase
                  .from('process_routes')
                  .select('id')
                  .eq('product_id', productData.id)
                  .eq('is_default', true)
                  .single();
                  
                if (!route) {
                  // 새로운 라우트 생성
                  const { data: newRoute } = await supabase
                    .from('process_routes')
                    .insert([{
                      product_id: productData.id,
                      route_name: `${productData.product_code} 기본 라우트`,
                      version: '1.0',
                      is_default: true,
                      is_active: true
                    }])
                    .select();
                    
                  if (newRoute && newRoute.length > 0) {
                    route = newRoute[0];
                    console.log('✅ 새 라우트 생성됨:', route.id);
                  }
                }
                
                if (route) {
                  // process_step 생성
                  const { error: stepError } = await supabase
                    .from('process_steps')
                    .insert([{
                      route_id: route.id,
                      step_number: 1,
                      work_center_id: realId,
                      operation_name: processData.operation_name,
                      description: productDescription,
                      run_time_minutes: 60
                    }]);
                    
                  if (!stepError) {
                    console.log('✅ process_step 생성 완료');
                  } else {
                    console.warn('⚠️ process_step 생성 실패:', stepError.message);
                  }
                }
              }
            } catch (routeError) {
              console.warn('⚠️ 라우트/스텝 처리 중 오류 (무시됨):', routeError.message);
            }
          } else {
            console.warn('⚠️ 제품 정보를 찾을 수 없음:', processData.product_code, productError?.message);
          }
        } catch (productUpdateError) {
          console.warn('⚠️ 제품 연결 정보 업데이트 실패 (무시됨):', productUpdateError.message);
        }
      } else {
        console.log('ℹ️ 제품 코드가 없어서 제품 연결 업데이트를 건너뜀');
      }
      
      console.log('🎉 공정 수정 완료!');
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ 공정 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 공정 삭제
  delete: async (id) => {
    try {
      const isWorkCenter = id.toString().startsWith('wc_');
      const realId = id.toString().replace(/^(wc_|rt_)/, '');
      
      if (isWorkCenter) {
        const { error } = await supabase
          .from('work_centers')
          .update({ is_active: false })
          .eq('id', realId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('process_routes')
          .update({ is_active: false })
          .eq('id', realId);

        if (error) throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('공정 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 워크센터 조회
  getWorkCenters: async () => {
    try {
      const { data, error } = await supabase
        .from('work_centers')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('워크센터 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 공정 라우팅 조회
  getRoutes: async () => {
    try {
      const { data, error } = await supabase
        .from('process_routes')
        .select(`
          *,
          products(product_code, product_name, client)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('공정 라우팅 조회 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 설비 관리 API
export const equipmentAPI = {
  // 모든 설비 조회
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          work_centers(name, location)
        `)
        .eq('is_active', true)
        .order('equipment_code');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('설비 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 설비 생성
  create: async (equipmentData) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('설비 생성 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 설비 수정
  update: async (id, equipmentData) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update(equipmentData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('설비 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 설비 삭제
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('설비 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // PLC 장비 조회
  getPLCDevices: async () => {
    try {
      const { data, error } = await supabase
        .from('plc_devices')
        .select(`
          *,
          equipment(name, equipment_code)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('PLC 장비 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // PLC 장비 수정
  updatePLC: async (id, plcData) => {
    try {
      const { data, error } = await supabase
        .from('plc_devices')
        .update({
          name: plcData.name,
          ip_address: plcData.ipAddress,
          port: plcData.port,
          protocol: plcData.protocol,
          status: plcData.status,
          description: plcData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('PLC 장비 수정 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 생산 관리 API
export const productionAPI = {
  // 작업 지시서 조회
  getWorkOrders: async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          products(product_code, product_name, client),
          customers(customer_name, company_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('작업 지시서 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 생산 실적 조회
  getProductionRecords: async () => {
    try {
      const { data, error } = await supabase
        .from('production_records')
        .select(`
          *,
          work_orders(order_number),
          equipment(name, equipment_code)
        `)
        .order('start_datetime', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('생산 실적 조회 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 품질 관리 API
export const qualityAPI = {
  // 품질 기준 조회
  getStandards: async () => {
    try {
      const { data, error } = await supabase
        .from('quality_standards')
        .select(`
          *,
          products(product_code, product_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('품질 기준 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 품질 검사 기록 조회
  getInspections: async () => {
    try {
      const { data, error } = await supabase
        .from('quality_inspections')
        .select(`
          *,
          products:product_id (
            product_code,
            product_name,
            category,
            specification,
            client
          ),
          work_orders:work_order_id (
            order_number,
            status
          ),
          user_profiles:inspector_id (
            full_name,
            email,
            department
          )
        `)
        .order('inspection_datetime', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('품질 검사 기록 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 모든 품질 데이터 조회 (QualityPage에서 사용) - 폴백 메커니즘 포함
  getAll: async () => {
    try {
      // 먼저 quality_inspections_with_product 뷰 사용 시도
      let { data, error } = await supabase
        .from('quality_inspections_with_product')
        .select('*')
        .order('inspection_datetime', { ascending: false });

      // 뷰가 없거나 권한 오류 시 직접 조인 쿼리 사용
      if (error && (error.code === '42P01' || error.code === '42501')) {
        console.log('뷰 접근 실패, 직접 조인 쿼리 사용:', error.message);
        
        // 대체 쿼리: quality_inspections 테이블에서 직접 조인
        const fallbackResult = await supabase
          .from('quality_inspections')
          .select(`
            *,
            products:product_id (
              product_code,
              product_name,
              category,
              specification,
              client
            ),
            work_orders:work_order_id (
              order_number,
              status
            ),
            user_profiles:inspector_id (
              full_name,
              email,
              department
            )
          `)
          .order('inspection_datetime', { ascending: false });
          
        if (fallbackResult.error) {
          throw fallbackResult.error;
        }
        
        // 데이터 변환 (뷰와 동일한 형태로)
        data = fallbackResult.data?.map(item => ({
          ...item,
          product_code: item.products?.product_code || '',
          product_name: item.products?.product_name || '알 수 없는 제품',
          category: item.products?.category || '',
          specification: item.products?.specification || '',
          client: item.products?.client || '',
          order_number: item.work_orders?.order_number || '',
          work_order_status: item.work_orders?.status || '',
          inspector_name: item.user_profiles?.full_name || '알 수 없음',
          inspector_email: item.user_profiles?.email || '',
          inspector_department: item.user_profiles?.department || ''
        })) || [];
        
        console.log('✅ 폴백 쿼리로 품질 데이터 로드 성공:', data.length, '개');
      } else if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('품질 데이터 조회 오류:', error);
      
      // 최종 폴백: 빈 배열 반환하여 페이지가 깨지지 않도록 함
      console.log('⚠️ 모든 품질 데이터 로드 실패, 빈 배열 반환');
      return { 
        success: false, 
        error: error.message,
        data: [] // 빈 배열로 폴백
      };
    }
  },

  // 품질 유형 관련 함수들
  // 데이터베이스 컬럼명을 프론트엔드 형식으로 변환
  transformQualityTypeData: (dbData) => {
    if (!dbData) return null;
    
    return {
      id: dbData.id,
      name: dbData.name,
      nameEn: dbData.name_en,
      description: dbData.description,
      category: dbData.category,
      severity: dbData.severity,
      isActive: dbData.is_active,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at,
      createdBy: dbData.created_by
    };
  },

  // 모든 품질 유형 조회
  getQualityTypes: async () => {
    try {
      const { data, error } = await supabase
        .from('quality_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // 데이터 변환
      const transformedData = data.map(item => qualityAPI.transformQualityTypeData(item));
      
      return { success: true, data: transformedData };
    } catch (error) {
      console.error('품질 유형 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 활성 품질 유형 조회 (검사용)
  getActiveQualityTypes: async () => {
    try {
      const { data, error } = await supabase
        .from('quality_types')
        .select('id, name, name_en, description, category, severity')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('활성 품질 유형 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 품질 유형 생성
  createQualityType: async (typeData) => {
    try {
      const { data, error } = await supabase
        .from('quality_types')
        .insert([{
          name: typeData.name,
          name_en: typeData.nameEn || null,
          description: typeData.description || null,
          category: typeData.category || 'defect',
          severity: typeData.severity || 'medium',
          is_active: typeData.isActive !== false
        }])
        .select();

      if (error) throw error;
      
      // 데이터 변환
      const transformedData = qualityAPI.transformQualityTypeData(data[0]);
      
      return { success: true, data: transformedData };
    } catch (error) {
      console.error('품질 유형 생성 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 품질 유형 수정
  updateQualityType: async (id, typeData) => {
    try {
      const { data, error } = await supabase
        .from('quality_types')
        .update({
          name: typeData.name,
          name_en: typeData.nameEn || null,
          description: typeData.description || null,
          category: typeData.category || 'defect',
          severity: typeData.severity || 'medium',
          is_active: typeData.isActive !== false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // 데이터 변환
      const transformedData = qualityAPI.transformQualityTypeData(data[0]);
      
      return { success: true, data: transformedData };
    } catch (error) {
      console.error('품질 유형 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 품질 유형 삭제
  deleteQualityType: async (id) => {
    try {
      const { error } = await supabase
        .from('quality_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('품질 유형 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

// 재고 관리 API
export const inventoryAPI = {
  // 창고 목록 조회
  getWarehouses: async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('창고 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 재고 현황 조회 (뷰 사용)
  getInventoryStatus: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_with_available')
        .select(`
          *,
          products(product_code, product_name),
          warehouses(name, code)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('재고 현황 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 재고 거래 내역 조회
  getTransactions: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory(
            products(product_code, product_name),
            warehouses(name, code)
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('재고 거래 내역 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 재고 목록 조회 (DashboardPage에서 사용)
  getInventory: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products(product_code, product_name, unit),
          warehouses(name, code)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('재고 조회 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 재고 항목 생성
  create: async (inventoryData) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([inventoryData])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('재고 생성 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 재고 항목 수정
  update: async (id, inventoryData) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(inventoryData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('재고 수정 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 재고 항목 삭제
  delete: async (id) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('재고 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
};



// =========================================
// 기존 인증 관련 함수들
// =========================================

// 이메일 인증 관련 함수들
export const authHelpers = {
  // 회원가입 및 이메일 인증 요청
  signUp: async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            department: userData.department,
            position: userData.position,
            approval_status: 'pending', // 관리자 승인 대기 상태
            role: 'operator' // 기본 역할
          },
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // 로그인
  signIn: async (email, password) => {
    try {
      console.log('🔐 로그인 시도:', { 
        email, 
        origin: window.location.origin,
        userAgent: navigator.userAgent.includes('Electron') ? 'Desktop App' : 'Web Browser'
      });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Supabase 로그인 오류:', {
          message: error.message,
          status: error.status,
          name: error.name,
          cause: error.cause
        });
        throw error;
      }

      // 이메일 인증 확인
      if (!data.user?.email_confirmed_at) {
        return { 
          success: false, 
          error: 'EMAIL_NOT_CONFIRMED',
          message: '이메일 인증이 필요합니다. 이메일을 확인해주세요.' 
        };
      }

      // user_profiles 테이블에서 실제 승인 상태 확인
      let approvalStatus = null;
      let userProfile = null;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('approval_status, role, full_name, department, position')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.warn('프로필 조회 실패:', profileError);
          // 프로필이 없는 경우 user_metadata에서 확인
          approvalStatus = data.user?.user_metadata?.approval_status;
        } else {
          userProfile = profileData;
          approvalStatus = profileData.approval_status;
        }
      } catch (profileError) {
        console.warn('프로필 조회 중 오류:', profileError);
        // 프로필 조회 실패 시 user_metadata에서 확인
        approvalStatus = data.user?.user_metadata?.approval_status;
      }

      // 승인 상태 확인
      if (approvalStatus === 'pending') {
        return { 
          success: false, 
          error: 'APPROVAL_PENDING',
          message: '관리자 승인 대기 중입니다. 승인이 완료될 때까지 기다려주세요.' 
        };
      } else if (approvalStatus === 'rejected') {
        return { 
          success: false, 
          error: 'APPROVAL_REJECTED',
          message: '계정 승인이 거부되었습니다. 관리자에게 문의하세요.' 
        };
      } else if (approvalStatus !== 'approved') {
        console.log('승인 상태 확인:', {
          approvalStatus,
          userProfile,
          userMetadata: data.user?.user_metadata
        });
        
        // 특별 케이스: 관리자 계정이거나 승인 없이 생성된 계정
        if (data.user?.email === 'admin@mes-thailand.com' || 
            data.user?.email === 'joon@vitalabcorp.com' ||
            userProfile?.role === 'admin' ||
            userProfile?.role === 'super_admin') {
          console.log('관리자 계정으로 인식, 승인 체크 생략');
        } else {
          return { 
            success: false, 
            error: 'APPROVAL_REQUIRED',
            message: '계정 승인이 필요합니다. 관리자에게 문의하세요.' 
          };
        }
      }

      console.log('✅ 로그인 성공:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        approvalStatus: approvalStatus,
        userProfile: userProfile,
        sessionExists: !!data.session
      });

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // 로그아웃
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // 현재 사용자 세션 가져오기
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return { success: true, session };
    } catch (error) {
      console.error('Get session error:', error);
      return { success: false, error: error.message };
    }
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }
      return { success: true, user };
    } catch (error) {
      console.error('Get user error:', error);
      return { success: false, error: error.message };
    }
  },

  // 이메일 재전송
  resendVerification: async (email) => {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // 비밀번호 재설정 요청
  resetPassword: async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Auth state change listener
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase; 