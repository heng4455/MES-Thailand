import { supabase, authHelpers } from './supabase';

// Supabase 연결 테스트
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...');
    
    // 1. Supabase 클라이언트 상태 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('📋 현재 세션:', session);
    console.log('❌ 세션 에러:', sessionError);
    
    // 2. Supabase 프로젝트 연결 확인
    const { data, error } = await supabase.from('auth.users').select('count').limit(1);
    console.log('🗄️ 데이터베이스 연결:', error ? '실패' : '성공');
    
    // 3. Auth 설정 확인
    const authSettings = await supabase.auth.getSession();
    console.log('🔐 Auth 설정 상태:', authSettings.error ? '오류' : '정상');
    
    return {
      success: true,
      message: 'Supabase 연결 테스트 완료'
    };
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 테스트 회원가입
export const testSignUp = async () => {
  const testUser = {
    email: 'test@mesThailand.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '0123456789',
    department: 'IT',
    position: 'Developer'
  };
  
  try {
    console.log('👤 테스트 회원가입 시작...');
    const result = await authHelpers.signUp(testUser.email, testUser.password, testUser);
    
    if (result.success) {
      console.log('✅ 회원가입 성공:', result.data);
      console.log('📧 이메일 인증 메일 발송됨');
      return result;
    } else {
      console.log('❌ 회원가입 실패:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ 회원가입 테스트 실패:', error);
    return { success: false, error: error.message };
  }
};

// Auth 상태 모니터링
export const monitorAuthState = () => {
  console.log('👁️ Auth 상태 모니터링 시작...');
  
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth 상태 변경:', event);
    console.log('📋 세션 정보:', session);
    
    if (session?.user) {
      console.log('👤 사용자 정보:', {
        id: session.user.id,
        email: session.user.email,
        email_confirmed_at: session.user.email_confirmed_at,
        created_at: session.user.created_at
      });
    }
  });
};

// 수동 이메일 인증 확인
export const checkEmailVerification = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ 사용자 정보 가져오기 실패:', error);
      return { success: false, error: error.message };
    }
    
    if (user) {
      console.log('👤 현재 사용자:', {
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        confirmed: !!user.email_confirmed_at
      });
      
      return {
        success: true,
        user,
        emailConfirmed: !!user.email_confirmed_at
      };
    } else {
      console.log('👤 로그인된 사용자 없음');
      return { success: false, error: '로그인된 사용자 없음' };
    }
  } catch (error) {
    console.error('❌ 이메일 인증 확인 실패:', error);
    return { success: false, error: error.message };
  }
};

// URL 파라미터 분석 함수
export const analyzeUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  const params = {
    url: window.location.href,
    pathname: window.location.pathname,
    query: {
      code: urlParams.get('code'),
      error: urlParams.get('error'),
      error_description: urlParams.get('error_description')
    },
    hash: {
      access_token: hashParams.get('access_token'),
      refresh_token: hashParams.get('refresh_token'),
      type: hashParams.get('type'),
      error: hashParams.get('error')
    }
  };
  
  console.log('🔍 현재 URL 분석:', params);
  return params;
};

// 수동 코드 교환 테스트
export const testCodeExchange = async (code) => {
  if (!code) {
    const urlParams = new URLSearchParams(window.location.search);
    code = urlParams.get('code');
  }
  
  if (!code) {
    console.log('❌ 인증 코드가 없습니다.');
    return { success: false, error: 'No code found' };
  }
  
  try {
    console.log('🔐 코드 교환 시작:', code);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ 코드 교환 성공:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ 코드 교환 실패:', error);
    return { success: false, error };
  }
};

// 개발자 도구용 전역 함수 등록
if (typeof window !== 'undefined') {
  window.supabaseTest = {
    testConnection: testSupabaseConnection,
    testSignUp: testSignUp,
    monitorAuth: monitorAuthState,
    checkEmail: checkEmailVerification,
    analyzeUrl: analyzeUrl,
    testCodeExchange: testCodeExchange,
    supabase: supabase
  };
  
  console.log('🛠️ Supabase 테스트 도구가 등록되었습니다:');
  console.log('- window.supabaseTest.testConnection()');
  console.log('- window.supabaseTest.testSignUp()');
  console.log('- window.supabaseTest.monitorAuth()');
  console.log('- window.supabaseTest.checkEmail()');
  console.log('- window.supabaseTest.analyzeUrl()');
  console.log('- window.supabaseTest.testCodeExchange()');
} 