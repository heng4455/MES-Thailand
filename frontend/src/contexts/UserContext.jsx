import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 역할 정의
  const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    OPERATOR: 'operator',
    VIEWER: 'viewer'
  };

  // 권한 정의
  const PERMISSIONS = {
    // 관리자 패널
    VIEW_ADMIN_PANEL: 'view_admin_panel',
    MANAGE_USERS: 'manage_users',
    MANAGE_SYSTEM: 'manage_system',
    MANAGE_API_KEYS: 'manage_api_keys',
    
    // 생산 관리
    VIEW_PRODUCTION: 'view_production',
    MANAGE_PRODUCTION: 'manage_production',
    
    // 설비 관리
    VIEW_EQUIPMENT: 'view_equipment',
    MANAGE_EQUIPMENT: 'manage_equipment',
    
    // 품질 관리
    VIEW_QUALITY: 'view_quality',
    MANAGE_QUALITY: 'manage_quality',
    
    // 재고 관리
    VIEW_INVENTORY: 'view_inventory',
    MANAGE_INVENTORY: 'manage_inventory',
    
    // 리포트
    VIEW_REPORTS: 'view_reports',
    GENERATE_REPORTS: 'generate_reports',
    EXPORT_REPORTS: 'export_reports'
  };

  // 역할별 권한 매핑
  const rolePermissions = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
    [ROLES.ADMIN]: [
      PERMISSIONS.VIEW_ADMIN_PANEL,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_SYSTEM,
      PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.MANAGE_PRODUCTION,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.MANAGE_EQUIPMENT,
      PERMISSIONS.VIEW_QUALITY,
      PERMISSIONS.MANAGE_QUALITY,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.EXPORT_REPORTS
    ],
    [ROLES.MANAGER]: [
      PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.MANAGE_PRODUCTION,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.VIEW_QUALITY,
      PERMISSIONS.MANAGE_QUALITY,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.MANAGE_INVENTORY,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.EXPORT_REPORTS
    ],
    [ROLES.OPERATOR]: [
      PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.VIEW_QUALITY,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_REPORTS
    ],
    [ROLES.VIEWER]: [
      PERMISSIONS.VIEW_PRODUCTION,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.VIEW_QUALITY,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_REPORTS
    ]
  };

  useEffect(() => {
    // 초기 세션 확인
    getSession();

    // 최대 10초 후 강제로 로딩 종료 (무한 로딩 방지)
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ 로딩 타임아웃 - 강제 종료');
        setLoading(false);
      }
    }, 10000);

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth 상태 변경:', event, session?.user?.email);
      
      if (session?.user) {
        console.log('✅ 새 세션 설정:', session.user.email);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        console.log('❌ 세션 종료');
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      subscription?.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const getSession = async () => {
    try {
      setLoading(true);
      console.log('🔄 세션 확인 시작...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ 세션 가져오기 오류:', error);
        throw error;
      }
      
      if (session?.user) {
        console.log('✅ 활성 세션 발견:', session.user.email);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        console.log('❌ 활성 세션 없음');
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('❌ 세션 확인 오류:', error);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
      console.log('✅ 세션 확인 완료');
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      console.log('🔄 사용자 프로필 로드 시작:', userId);
      
      // 현재 로그인된 사용자 정보 가져오기
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.log('❌ 현재 사용자 정보 없음');
        setUserProfile(null);
        return;
      }
      
      console.log('✅ 현재 사용자:', currentUser.email);
      
      // 데이터베이스에서 프로필 조회
      let dbProfile = null;
      try {
        console.log('🔍 DB 프로필 조회 시도:', currentUser.id);
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        if (data && !error) {
          console.log('✅ DB 프로필 발견:', {
            name: data.full_name,
            role: data.role,
            approval_status: data.approval_status,
            is_active: data.is_active
          });
          dbProfile = data;
        } else {
          console.log('❌ DB 프로필 없음:', error?.message);
          console.log('🔍 사용자 ID 확인:', currentUser.id);
          console.log('🔍 이메일 확인:', currentUser.email);
          
          // 관리자 계정의 경우 기본 프로필 생성
          if (currentUser.email === 'admin@mes-thailand.com' || 
              currentUser.email === 'joon@coilmaster.com') {
            console.log('🔧 관리자 계정 기본 프로필 생성');
            
            // joon@coilmaster.com과 admin 계정 구분
            const isJoonAccount = currentUser.email === 'joon@coilmaster.com';
            
            const adminProfile = {
              id: currentUser.id,
              firstName: isJoonAccount ? 'YongSoo' : 'Administrator',
              lastName: isJoonAccount ? 'Choi' : '',
              role: ROLES.ADMIN,
              department: isJoonAccount ? 'IT' : 'Administration',
              position: isJoonAccount ? 'Administrator' : 'System Admin',
              phone: '010-0000-0000',
              avatar: null,
              createdAt: currentUser.created_at,
              lastLoginAt: new Date().toISOString(),
              email: currentUser.email,
              approvalStatus: 'approved'
            };
            console.log('✅ 관리자 프로필 생성 완료:', adminProfile);
            setUserProfile(adminProfile);
            return;
          }
          
          // 일반 사용자인 경우 이메일로 다시 조회 시도
          console.log('🔄 이메일로 재조회 시도...');
          const { data: emailData, error: emailError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', currentUser.email)
            .single();
            
          if (emailData && !emailError) {
            console.log('✅ 이메일로 프로필 발견:', emailData);
            dbProfile = emailData;
          } else {
            console.log('❌ 이메일로도 프로필 없음:', emailError?.message);
            setUserProfile(null);
            return;
          }
        }
      } catch (dbError) {
        console.error('❌ DB 조회 오류:', dbError);
        setUserProfile(null);
        return;
      }

      // 데이터베이스 프로필이 있는 경우에만 프로필 생성
      if (dbProfile) {
        const nameParts = dbProfile.full_name ? dbProfile.full_name.split(' ') : ['사용자'];
        const firstName = nameParts[0] || '사용자';
        const lastName = nameParts.slice(1).join(' ') || '';

        const profile = {
          id: currentUser.id,
          firstName: firstName,
          lastName: lastName,
          role: dbProfile.role || ROLES.OPERATOR,
          department: dbProfile.department || '일반',
          position: dbProfile.position || 'User',
          phone: dbProfile.phone || '010-0000-0000',
          avatar: currentUser.user_metadata?.avatar_url || null,
          createdAt: dbProfile.created_at || currentUser.created_at,
          lastLoginAt: new Date().toISOString(),
          email: currentUser.email,
          approvalStatus: dbProfile.approval_status
        };
        
        console.log('✅ 프로필 설정 완료:', {
          name: profile.firstName,
          role: profile.role,
          approvalStatus: profile.approvalStatus
        });
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
    } catch (error) {
      console.error('❌ 사용자 프로필 로드 실패:', error);
      setUserProfile(null);
    }
  };

  // 권한 확인 함수
  const hasPermission = (permission) => {
    if (!userProfile) return false;
    const permissions = rolePermissions[userProfile.role] || [];
    return permissions.includes(permission);
  };

  // 역할 확인 함수
  const hasRole = (role) => {
    return userProfile?.role === role;
  };

  const isAdmin = () => {
    return userProfile?.role === ROLES.ADMIN || userProfile?.role === ROLES.SUPER_ADMIN;
  };

  const canAccessAdminPanel = () => {
    return hasPermission(PERMISSIONS.VIEW_ADMIN_PANEL);
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!userProfile) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(prev => ({ ...prev, ...updates }));
      console.log('✅ 사용자 프로필 업데이트 완료');
      return data;
    } catch (error) {
      console.error('❌ 사용자 프로필 업데이트 실패:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    
    // 역할과 권한
    ROLES,
    PERMISSIONS,
    hasPermission,
    hasRole,
    isAdmin,
    canAccessAdminPanel,
    
    // 사용자 관리
    signOut,
    updateUserProfile,
    
    // 수동 새로고침
    refreshProfile: () => loadUserProfile(user?.id)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 