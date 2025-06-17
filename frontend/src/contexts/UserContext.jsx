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
    console.log('UserContext: Initializing...');
    
    // 초기 세션 확인
    getSession();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user ? 'User logged in' : 'No user');
      
      if (event === 'INITIAL_SESSION') {
        console.log('Initial session check:', session ? 'Session found' : 'No session');
      }
      
      if (session?.user) {
        console.log('Setting user:', session.user.email);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        console.log('Clearing user session');
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const getSession = async () => {
    console.log('UserContext: Getting initial session...');
    setLoading(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        throw error;
      }
      
      console.log('Session retrieved:', session ? 'Valid session found' : 'No session');
      
      if (session?.user) {
        console.log('Session user:', session.user.email);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        console.log('No valid session found');
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error getting session:', error);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      // 현재 사용자 정보에서 메타데이터 추출
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      let firstName = '사용자';
      let lastName = '';
      
      if (currentUser) {
        // Supabase user metadata에서 이름 정보 추출
        if (currentUser.user_metadata?.full_name) {
          const nameParts = currentUser.user_metadata.full_name.split(' ');
          firstName = nameParts[0] || '사용자';
          lastName = nameParts.slice(1).join(' ') || '';
        } else if (currentUser.user_metadata?.firstName) {
          firstName = currentUser.user_metadata.firstName;
          lastName = currentUser.user_metadata.lastName || '';
        } else if (currentUser.user_metadata?.name) {
          const nameParts = currentUser.user_metadata.name.split(' ');
          firstName = nameParts[0] || '사용자';
          lastName = nameParts.slice(1).join(' ') || '';
        } else if (currentUser.email) {
          // 이메일에서 사용자명 추출
          firstName = currentUser.email.split('@')[0] || '사용자';
        }
      }

      // 프로필 객체 생성
      const profile = {
        id: userId,
        firstName: firstName,
        lastName: lastName,
        role: currentUser?.user_metadata?.role || ROLES.ADMIN, // 메타데이터에서 역할 가져오기 또는 기본값
        department: currentUser?.user_metadata?.department || 'IT',
        position: currentUser?.user_metadata?.position || 'Manager',
        phone: currentUser?.user_metadata?.phone || '010-0000-0000',
        avatar: currentUser?.user_metadata?.avatar_url || null,
        createdAt: currentUser?.created_at || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      console.log('로드된 사용자 프로필:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // 오류 발생 시 기본 프로필 설정
      const defaultProfile = {
        id: userId,
        firstName: '사용자',
        lastName: '',
        role: ROLES.ADMIN,
        department: 'IT',
        position: 'Manager',
        phone: '010-0000-0000',
        avatar: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      setUserProfile(defaultProfile);
    }
  };

  const hasPermission = (permission) => {
    if (!userProfile || !userProfile.role) return false;
    
    const userPermissions = rolePermissions[userProfile.role] || [];
    return userPermissions.includes(permission);
  };

  const hasRole = (role) => {
    return userProfile?.role === role;
  };

  const isAdmin = () => {
    return hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.ADMIN);
  };

  const canAccessAdminPanel = () => {
    return hasPermission(PERMISSIONS.VIEW_ADMIN_PANEL);
  };

  const signOut = async () => {
    try {
      console.log('🚪 로그아웃 시도...');
      
      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase 로그아웃 오류:', error);
        throw error;
      }
      
      // 로컬 스토리지 정리
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear(); // 모든 로컬 스토리지 정리
      
      // 상태 초기화
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      
      console.log('✅ 로그아웃 완료');
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      
      // 오류가 발생해도 강제로 로컬 상태 정리
      localStorage.clear();
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      // 실제 구현에서는 데이터베이스 업데이트
      setUserProfile(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    
    // 역할 및 권한
    ROLES,
    PERMISSIONS,
    hasPermission,
    hasRole,
    isAdmin,
    canAccessAdminPanel,
    
    // 액션
    signOut,
    updateUserProfile,
    loadUserProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 