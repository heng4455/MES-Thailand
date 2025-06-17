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
            position: userData.position
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

      console.log('✅ 로그인 성공:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
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
  },

  // 새 비밀번호 설정
  updatePassword: async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  }
};

// 인증 상태 변경 리스너
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

export default supabase; 