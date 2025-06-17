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

      // 관리자 승인 상태 확인
      const approvalStatus = data.user?.user_metadata?.approval_status;
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
        return { 
          success: false, 
          error: 'APPROVAL_REQUIRED',
          message: '계정 승인이 필요합니다. 관리자에게 문의하세요.' 
        };
      }

      console.log('✅ 로그인 성공:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        approvalStatus: approvalStatus,
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
  },

  // 관리자 기능: 사용자 승인 상태 업데이트
  updateUserApprovalStatus: async (userId, status, adminUser) => {
    try {
      // 관리자 권한 확인
      if (!adminUser || !['admin', 'super_admin'].includes(adminUser.user_metadata?.role)) {
        throw new Error('관리자 권한이 필요합니다.');
      }

      // 사용자 메타데이터 업데이트
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          approval_status: status, // 'pending', 'approved', 'rejected'
          approved_by: adminUser.id,
          approved_at: new Date().toISOString()
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update user approval status error:', error);
      return { success: false, error: error.message };
    }
  },

  // 승인 대기 중인 사용자 목록 조회
  getPendingUsers: async () => {
    try {
      // 이 기능은 실제로는 데이터베이스에서 조회해야 합니다
      // 여기서는 시뮬레이션된 데이터를 반환합니다
      const pendingUsers = [
        {
          id: 'pending-user-1',
          email: 'newuser@example.com',
          user_metadata: {
            first_name: '홍',
            last_name: '길동',
            department: 'production',
            position: 'operator',
            approval_status: 'pending'
          },
          created_at: new Date().toISOString()
        }
      ];

      return { success: true, data: pendingUsers };
    } catch (error) {
      console.error('Get pending users error:', error);
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