import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { usersAPI, supabase } from '../utils/supabase';

const AdminPanelPage = () => {
  const { t, ready, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const { user, userProfile, loading } = useUser();

  // i18n이 준비되지 않았거나 번역 파일이 로드되지 않았으면 로딩 표시
  if (!ready || !i18n.hasResourceBundle(i18n.language, 'translation')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading translations...</div>
      </div>
    );
  }

  // 현재 로그인한 사용자 정보
  const getCurrentUser = () => {
    // 로딩 중이면 null 반환
    if (loading) {
      return null;
    }

    // userProfile이 있는 경우에만 반환 (우선순위 1)
    if (userProfile) {
      const fullName = userProfile.full_name || 
        (userProfile.firstName && userProfile.lastName 
        ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
        : userProfile.firstName || userProfile.lastName || '사용자');
        
          return {
        name: fullName,
        email: userProfile.email,
        role: userProfile.role,
        avatar: userProfile.avatar || null,
        department: userProfile.department,
        position: userProfile.position
      };
    }

    // userProfile이 없으면 null 반환 (기본값 제거)
    return null;
  };

  // 상태 관리
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [teamAssignments, setTeamAssignments] = useState([]);
  const [statusDefinitions, setStatusDefinitions] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [lineSettings, setLineSettings] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [pageStatus, setPageStatus] = useState({});
  const [plcDevices, setPlcDevices] = useState([]);
  const [adminSettings, setAdminSettings] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [refreshKey, setRefreshKey] = useState(0); // 강제 재렌더링용

  // 삭제 확인 상태
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '',
    item: null,
    title: '',
    message: ''
  });

  // Toast 상태
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info'
  });

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAllData();
  }, []);

  // 사용자 업데이트 감지
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [user, userProfile, loading]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'info' });
  };

  // 모든 데이터 로드 (개선된 에러 핸들링)
  const loadAllData = async () => {
    setIsLoading(true);
    let successCount = 0;
    
    try {
      console.log('🔄 관리자 패널 데이터 로드 시작...');
      
      // 병렬로 모든 데이터 로드 시도
      const results = await Promise.allSettled([
        loadUsers(),
        loadPendingUsers(),
        loadTeamAssignments(),
        loadStatusDefinitions(),
        loadProductGroups(),
        loadLineSettings(),
        loadNotificationTemplates(),
        loadSystemStatus(),
        loadPageStatus(),
        loadPlcDevices(),
        loadAdminSettings(),
        loadUserRoles(),
        loadPermissions()
      ]);
      
      // 성공한 작업 수 계산
      const totalOperations = 13;
      successCount = results.filter(result => result.status === 'fulfilled').length;
      const failedCount = totalOperations - successCount;
      
      console.log(`📊 데이터 로드 완료: ${successCount}/${totalOperations} 성공`);
      
      if (successCount === totalOperations) {
        showToast('모든 데이터가 성공적으로 로드되었습니다.', 'success');
      } else if (successCount > 0) {
        showToast(`${successCount}/${totalOperations}개 데이터 로드 완료 (${failedCount}개 실패)`, 'warning');
      } else {
        showToast('모든 데이터 로드에 실패했습니다. 네트워크 연결을 확인해주세요.', 'error');
      }
      
      // 실패한 작업들 로그 출력
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const operationNames = [
            '사용자', '승인대기사용자', '팀배정', '상태정의', '제품그룹',
            'LINE설정', '알림템플릿', '시스템상태', '페이지상태', 'PLC장비', '관리자설정'
          ];
          console.error(`❌ ${operationNames[index]} 로드 실패:`, result.reason);
        }
      });
      
    } catch (error) {
      console.error('전체 데이터 로드 오류:', error);
      showToast(`데이터 로드 중 오류 발생: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 데이터 로드 (폴백 메커니즘 포함)
  const loadUsers = async () => {
    try {
      console.log('🔄 사용자 데이터 로드 시작...');
      
              // 캐시 무효화를 위한 타임스탬프 쿼리 파라미터 추가
        const cacheKey = Date.now();
        console.log('🔄 캐시 키:', cacheKey);
        
        // 먼저 user_approval_status 뷰 시도 (캐시 무효화)
        let { data, error } = await supabase
          .from('user_approval_status')
          .select('*')
          .eq('approval_status', 'approved')
          .eq('is_active', true)
          .order('updated_at', { ascending: false }); // 최신 업데이트 순으로 정렬

      // 뷰가 없거나 권한 오류 시 user_profiles 테이블 직접 사용
      if (error && (error.code === '42P01' || error.code === '42501')) {
        console.log('뷰 접근 실패, user_profiles 테이블 직접 사용:', error.message);
        
        const fallbackResult = await supabase
          .from('user_profiles')
          .select('*')
          .eq('approval_status', 'approved')
          .eq('is_active', true)
          .order('updated_at', { ascending: false }); // 최신 업데이트 순으로 정렬
          
        if (fallbackResult.error) {
          throw fallbackResult.error;
        }
        
        // 데이터 변환 (뷰와 동일한 형태로)
        data = fallbackResult.data?.map(user => ({
          ...user,
          status_display: user.approval_status === 'approved' ? '승인됨' : 
                         user.approval_status === 'pending' ? '승인 대기' : 
                         user.approval_status === 'rejected' ? '거부됨' : '승인 대기',
          registration_date: user.created_at
        })) || [];
      } else if (error) {
        throw error;
      }

      console.log('✅ 사용자 데이터 로드 성공:', data?.length || 0, '명');
      setUsers(data || []);
      // 성공 메시지는 제거 (너무 빈번하게 표시됨)
    } catch (error) {
      console.error('❌ 사용자 조회 오류:', error);
      setUsers([]);
      showToast(`사용자 데이터 로드 실패: ${error.message}`, 'error');
    }
  };

  // 승인 대기 사용자 로드 (폴백 메커니즘 포함)
  const loadPendingUsers = async () => {
    try {
      
      // 먼저 user_approval_status 뷰 시도
      let { data, error } = await supabase
        .from('user_approval_status')
        .select('*')
        .eq('approval_status', 'pending');

      // 뷰가 없거나 권한 오류 시 user_profiles 테이블 직접 사용
      if (error && (error.code === '42P01' || error.code === '42501')) {
        console.log('뷰 접근 실패, user_profiles 테이블 직접 사용:', error.message);
        
        const fallbackResult = await supabase
          .from('user_profiles')
          .select('*')
          .or('approval_status.eq.pending,approval_status.is.null');
          
        if (fallbackResult.error) {
          throw fallbackResult.error;
        }
        
        // 데이터 변환
        data = fallbackResult.data?.map(user => ({
          ...user,
          approval_status: user.approval_status || 'pending',
          status_display: '승인 대기',
          registration_date: user.created_at
        })) || [];
      } else if (error) {
        throw error;
      }

      setPendingUsers(data || []);
      setToast({ message: `${data?.length || 0}명의 승인 대기 사용자를 로드했습니다.`, type: 'success' });
    } catch (error) {
      console.error('승인 대기 사용자 조회 오류:', error);
      setPendingUsers([]);
      setToast({ message: '승인 대기 사용자 로드 실패: ' + error.message, type: 'error' });
    }
  };

  // 팀 배정 데이터 로드 (폴백 메커니즘 포함)
  const loadTeamAssignments = async () => {
    try {
      
      // 먼저 team_assignments_with_users 뷰 시도
      let { data, error } = await supabase
        .from('team_assignments_with_users')
        .select('*')
        .eq('is_active', true);

      // 뷰가 없거나 권한 오류 시 직접 조인 쿼리 사용
      if (error && (error.code === '42P01' || error.code === '42501')) {
        console.log('뷰 접근 실패, 직접 조인 쿼리 사용:', error.message);
        
        // team_assignments 테이블과 user_profiles 테이블을 개별 조회 후 조인
        const [teamResult, userResult] = await Promise.all([
          supabase.from('team_assignments').select('*').eq('is_active', true),
          supabase.from('user_profiles').select('*')
        ]);
        
        if (teamResult.error) throw teamResult.error;
        if (userResult.error) throw userResult.error;
        
        // 메모리에서 조인
        data = teamResult.data?.map(team => {
          const user = userResult.data?.find(u => u.id === team.user_id);
    return {
            ...team,
            full_name: user?.full_name || '',
            email: user?.email || '',
            department: user?.department || '',
            position: user?.position || '',
            phone: user?.phone || '',
            approval_status: user?.approval_status || '',
            user_is_active: user?.is_active || false
          };
        }) || [];
      } else if (error) {
        throw error;
      }

      setTeamAssignments(data || []);
      setToast({ message: `${data?.length || 0}개의 팀 배정을 로드했습니다.`, type: 'success' });
    } catch (error) {
      console.error('팀 배정 조회 오류:', error);
      setTeamAssignments([]);
      setToast({ message: '팀 배정 데이터 로드 실패: ' + error.message, type: 'error' });
    }
  };

  // 상태 정의 로드 (개선된 에러 핸들링)
  const loadStatusDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from('status_definitions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStatusDefinitions(data || []);
      setToast({ message: `${data?.length || 0}개의 상태 정의를 로드했습니다.`, type: 'success' });
    } catch (error) {
      console.error('상태 정의 조회 오류:', error);
      setStatusDefinitions([]);
      showToast(`상태 정의 로드 실패: ${error.message}`, 'error');
    }
  };

  // 제품 그룹 로드 (개선된 에러 핸들링)
  const loadProductGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProductGroups(data || []);
      setToast({ message: `${data?.length || 0}개의 제품 그룹을 로드했습니다.`, type: 'success' });
    } catch (error) {
      console.error('제품 그룹 조회 오류:', error);
      setProductGroups([]);
      showToast(`제품 그룹 로드 실패: ${error.message}`, 'error');
    }
  };

  // LINE 설정 로드 (개선된 에러 핸들링)
  const loadLineSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('line_notification_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLineSettings(data || []);
      setToast({ message: `${data?.length || 0}개의 LINE 설정을 로드했습니다.`, type: 'success' });
    } catch (error) {
      console.error('LINE 설정 조회 오류:', error);
      setLineSettings([]);
      showToast(`LINE 설정 로드 실패: ${error.message}`, 'error');
    }
  };

  // 알림 템플릿 로드 (개선된 에러 핸들링)
  const loadNotificationTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_type', { ascending: true });

      if (error) throw error;
      setNotificationTemplates(data || []);
      setToast({ message: `${data?.length || 0}개의 알림 템플릿을 로드했습니다.`, type: 'success' });
    } catch (error) {
      console.error('알림 템플릿 조회 오류:', error);
      setNotificationTemplates([]);
      showToast(`알림 템플릿 로드 실패: ${error.message}`, 'error');
    }
  };

  // 시스템 상태 로드
  const loadSystemStatus = async () => {
    try {
      const { data, error } = await supabase.from('admin_settings').select('*').limit(1);
      
      const status = {
        database: { 
          status: error ? 'error' : 'healthy', 
          latency: error ? 'N/A' : '15ms' 
        },
        api: { 
          status: 'healthy', 
          uptime: '99.9%' 
        },
        storage: { 
          status: 'warning', 
          usage: '78%' 
        },
        backup: { 
          status: 'healthy', 
          lastBackup: new Date().toISOString() 
        }
      };
      setSystemStatus(status);
    } catch (error) {
      console.error('시스템 상태 로드 오류:', error);
      setSystemStatus({
        database: { status: 'error', latency: 'N/A' },
        api: { status: 'error', uptime: 'N/A' },
        storage: { status: 'error', usage: 'N/A' },
        backup: { status: 'error', lastBackup: 'N/A' }
      });
    }
  };

  // 페이지별 상태 로드
  const loadPageStatus = async () => {
    try {
      const status = {
    dashboard: { status: 'active', users: 45, errors: 0 },
    production: { status: 'active', users: 12, errors: 1 },
    equipment: { status: 'active', users: 8, errors: 0 },
    quality: { status: 'maintenance', users: 0, errors: 0 },
    inventory: { status: 'active', users: 5, errors: 0 },
    reports: { status: 'active', users: 3, errors: 0 }
      };
      setPageStatus(status);
    } catch (error) {
      console.error('페이지 상태 로드 오류:', error);
    }
  };

  // PLC 장비 로드
  const loadPlcDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('plc_devices')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPlcDevices(data || []);
    } catch (error) {
      console.error('PLC 장비 로드 오류:', error);
      setPlcDevices([]);
    }
  };

  // 관리자 설정 로드
  const loadAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAdminSettings(data || []);
    } catch (error) {
      console.error('관리자 설정 로드 오류:', error);
      setAdminSettings([]);
    }
  };

  // 역할 데이터 로드
  const loadUserRoles = async () => {
    try {
      // 먼저 역할 목록을 가져옴
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (rolesError) throw rolesError;

      // 각 역할에 대해 권한 정보를 별도로 가져옴
      const rolesWithPermissions = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: rolePermissions, error: rpError } = await supabase
            .from('role_permissions')
            .select(`
              permission_id,
              permissions (
                id,
                permission_code,
                permission_name,
                category
              )
            `)
            .eq('role_id', role.id);

          if (rpError) {
            console.warn(`역할 ${role.id}의 권한 로드 실패:`, rpError);
            return { ...role, role_permissions: [] };
          }

          return { ...role, role_permissions: rolePermissions || [] };
        })
      );

      setUserRoles(rolesWithPermissions);
    } catch (error) {
      console.error('역할 로드 오류:', error);
      // 폴백: 기본 역할만 로드
      try {
        const { data: basicRoles, error: basicError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!basicError) {
          const rolesWithEmptyPermissions = (basicRoles || []).map(role => ({
            ...role,
            role_permissions: []
          }));
          setUserRoles(rolesWithEmptyPermissions);
        } else {
          setUserRoles([]);
        }
      } catch (fallbackError) {
        console.error('기본 역할 로드도 실패:', fallbackError);
        setUserRoles([]);
      }
    }
  };

  // 권한 데이터 로드
  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('permission_name', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('권한 로드 오류:', error);
      setPermissions([]);
    }
  };

  // 공통 CRUD 함수들
  const handleCreate = (type) => {
    setModalType(type);
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setEditingItem(item);
    
    // 역할 편집 시 권한 정보 설정
    if (type === 'role' && item.role_permissions) {
      const selectedPermissions = item.role_permissions.map(rp => rp.permission_id);
      setFormData({ ...item, selectedPermissions });
    } else if (type === 'user') {
      // 사용자 편집 시 full_name을 firstName, lastName으로 분리
      const nameParts = (item.full_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // 필요한 필드만 포함하고 first_name, last_name 등 불필요한 필드 제외
      const { first_name, last_name, ...cleanItem } = item;
      setFormData({ ...cleanItem, firstName, lastName });
    } else {
      setFormData(item);
    }
    
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const tableName = getTableName(modalType);
      const processedData = processFormData(modalType, formData);
      
      // 디버깅을 위한 로그 출력
      console.log('저장 시도:', {
        modalType,
        tableName,
        originalFormData: formData,
        processedData,
        editingItem: !!editingItem
      });
      
      // 사용자 데이터인 경우 역할 검증 및 변환
      if (modalType === 'user' && processedData.role) {
        console.log('선택된 역할:', processedData.role);
        console.log('사용 가능한 역할들:', userRoles.map(r => ({code: r.role_code, name: r.role_name})));
        
        // 임시 해결책: user_roles의 role_code를 체크 제약조건에 허용된 값으로 변환
        const roleMapping = {
          'Admin': 'admin',
          'Manager': 'manager', 
          'Users': 'operator',
          'Server Admin': 'admin'  // 서버 관리자도 admin으로 매핑
        };
        
        // 선택된 역할이 user_roles에 있는지 확인
        const validRole = userRoles.find(r => r.role_code === processedData.role);
        if (validRole) {
          // 체크 제약조건에 맞는 값으로 변환
          const mappedRole = roleMapping[processedData.role];
          if (mappedRole) {
            console.log(`역할 변환: "${processedData.role}" -> "${mappedRole}"`);
            processedData.role = mappedRole;
          }
        } else if (userRoles.length > 0) {
          throw new Error(`선택된 역할 '${processedData.role}'이 유효하지 않습니다. 사용 가능한 역할: ${userRoles.map(r => r.role_code).join(', ')}`);
        }
      }
      
      if (editingItem) {
        // 업데이트
        console.log('📝 업데이트 실행:', { table: tableName, id: editingItem.id, data: processedData });
        
        const { data: updateResult, error } = await supabase
          .from(tableName)
          .update(processedData)
          .eq('id', editingItem.id)
          .select(); // 업데이트된 데이터 반환
        
        if (error) throw error;
        
        console.log('✅ 업데이트 결과:', updateResult);

        // 역할 권한 매핑 업데이트
        if (modalType === 'role' && formData.selectedPermissions) {
          await updateRolePermissions(editingItem.id, formData.selectedPermissions);
        }

        // 로컬 상태 업데이트 제거 - 오직 DB 새로고침만 사용
        console.log('✅ DB 업데이트 완료:', updateResult);

        showToast('수정되었습니다.', 'success');
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from(tableName)
          .insert([{ ...processedData, created_by: user?.id || userProfile?.id }])
          .select();
        
        if (error) throw error;

        // 역할 권한 매핑 생성
        if (modalType === 'role' && formData.selectedPermissions && data[0]) {
          await updateRolePermissions(data[0].id, formData.selectedPermissions);
        }

        showToast('생성되었습니다.', 'success');
      }
      
      // 모달 닫기 전 잠깐 대기 (사용자가 성공 메시지를 볼 수 있도록)
      setTimeout(() => {
        setShowModal(false);
      }, 500);
      
      // 데이터 새로고침 (강제)
      console.log('데이터 새로고침 시작:', modalType);
      await loadDataByType(modalType);
      console.log('데이터 새로고침 완료:', modalType);
      
      // 강제 재렌더링
      setRefreshKey(prev => prev + 1);
      console.log('🔄 강제 재렌더링 트리거');
    } catch (error) {
      console.error('저장 오류:', error);
      showToast(`저장에 실패했습니다: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 역할 권한 매핑 업데이트
  const updateRolePermissions = async (roleId, selectedPermissions) => {
    try {
      console.log('권한 매핑 업데이트 시작:', { roleId, selectedPermissions });
      
      // 기존 권한 매핑 삭제
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) {
        console.error('기존 권한 삭제 오류:', deleteError);
        throw deleteError;
      }

      // 새로운 권한 매핑 생성
      if (selectedPermissions && selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: parseInt(roleId),
          permission_id: parseInt(permissionId),
          granted_by: user?.id || userProfile?.id || null
        }));

        console.log('삽입할 권한 매핑:', rolePermissions);

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (insertError) {
          console.error('권한 매핑 삽입 오류:', insertError);
          throw insertError;
        }
      }
      
      console.log('권한 매핑 업데이트 완료');
      } catch (error) {
      console.error('역할 권한 매핑 오류:', error);
      throw error;
    }
  };

  const handleDelete = (type, item) => {
    setDeleteConfirm({
      isOpen: true,
      type,
      item,
      title: '삭제 확인',
      message: `${getItemName(type, item)}을(를) 삭제하시겠습니까?`
    });
  };

  const confirmDelete = async () => {
    try {
      const tableName = getTableName(deleteConfirm.type);
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', deleteConfirm.item.id);
      
      if (error) throw error;
      
      showToast('삭제되었습니다.', 'success');
      setDeleteConfirm({ isOpen: false, type: '', item: null, title: '', message: '' });
      await loadDataByType(deleteConfirm.type);
    } catch (error) {
      console.error('삭제 오류:', error);
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  // 모든 역할 일괄 삭제 함수
  const handleBulkDeleteRoles = () => {
    setDeleteConfirm({
      isOpen: true,
      type: 'bulk-roles',
      item: null,
      title: '모든 역할 삭제 확인',
      message: `현재 등록된 모든 역할(${userRoles.length}개)을 삭제하시겠습니까?\n이 작업은 복구할 수 없습니다.`
    });
  };

  const confirmBulkDeleteRoles = async () => {
    try {
      setIsLoading(true);
      
      // 먼저 모든 role_permissions 삭제
      const { error: rpError } = await supabase
        .from('role_permissions')
        .delete()
        .neq('id', 0); // 모든 레코드 삭제

      if (rpError) {
        console.error('역할 권한 삭제 오류:', rpError);
        throw rpError;
      }

      // 그 다음 모든 user_roles 삭제
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .neq('id', 0); // 모든 레코드 삭제

      if (rolesError) {
        console.error('역할 삭제 오류:', rolesError);
        throw rolesError;
      }
      
      showToast(`모든 역할이 삭제되었습니다.`, 'success');
      setDeleteConfirm({ isOpen: false, type: '', item: null, title: '', message: '' });
      loadUserRoles();
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      showToast(`일괄 삭제 실패: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 유틸리티 함수들
  const getTableName = (type) => {
    const tableMap = {
      'user': 'user_profiles',
      'role': 'user_roles',
      'permission': 'permissions',
      'team': 'team_assignments',
      'status': 'status_definitions',
      'product-group': 'product_groups',
      'line-setting': 'line_notification_settings',
      'notification-template': 'notification_templates',
      'plc': 'plc_devices',
      'admin-setting': 'admin_settings'
    };
    return tableMap[type] || type;
  };

  const getModalTitle = (type) => {
    const titleMap = {
      'user': '사용자',
      'role': '역할',
      'permission': '권한',
      'team': '팀 배정',
      'status': '상태 정의',
      'product-group': '제품 그룹',
      'line-setting': 'LINE 설정',
      'notification-template': '알림 템플릿',
      'plc': 'PLC 장비',
      'admin-setting': '관리자 설정'
    };
    return titleMap[type] || type;
  };

  const renderFormFields = (type) => {
    const baseInputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    switch (type) {
      case 'user':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>이름</label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>성</label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>이메일</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={baseInputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>역할</label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className={baseInputClass}
                  required
                >
                  <option value="">-- 역할을 선택하세요 --</option>
                  {userRoles.map(role => (
                    <option key={role.id} value={role.role_code}>
                      {role.role_name} ({role.role_code})
                    </option>
                  ))}
                  {userRoles.length === 0 && (
                    <option value="operator">기본 작업자 (operator)</option>
                  )}
                </select>
                {userRoles.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ 등록된 역할이 없습니다. 먼저 역할 관리에서 역할을 생성해주세요.
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>부서</label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className={baseInputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>직책</label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className={baseInputClass}
              />
            </div>
          </>
        );

      case 'role':
        return (
          <>
            <div>
              <label className={labelClass}>역할 코드</label>
              <input
                type="text"
                value={formData.role_code || ''}
                onChange={(e) => setFormData({...formData, role_code: e.target.value})}
                className={baseInputClass}
                placeholder="예: manager, operator"
                required
              />
            </div>
            <div>
              <label className={labelClass}>역할명</label>
              <input
                type="text"
                value={formData.role_name || ''}
                onChange={(e) => setFormData({...formData, role_name: e.target.value})}
                className={baseInputClass}
                placeholder="예: 부서 관리자"
                required
              />
            </div>
            <div>
              <label className={labelClass}>역할 설명</label>
              <textarea
                value={formData.role_description || ''}
                onChange={(e) => setFormData({...formData, role_description: e.target.value})}
                className={baseInputClass}
                rows="3"
                placeholder="이 역할의 책임과 권한을 설명하세요"
              />
            </div>
            <div>
              <label className={labelClass}>표시 순서</label>
              <input
                type="number"
                value={formData.display_order || 0}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                className={baseInputClass}
                min="0"
              />
            </div>
            <div>
              <label className={labelClass}>권한 설정</label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                {Object.entries(
                  permissions.reduce((acc, permission) => {
                    if (!acc[permission.category]) acc[permission.category] = [];
                    acc[permission.category].push(permission);
                    return acc;
                  }, {})
                ).map(([category, categoryPermissions]) => (
                  <div key={category} className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {categoryPermissions.map(permission => (
                        <label key={permission.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(formData.selectedPermissions || []).includes(permission.id)}
                            onChange={(e) => {
                              const selectedPermissions = formData.selectedPermissions || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  selectedPermissions: [...selectedPermissions, permission.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedPermissions: selectedPermissions.filter(id => id !== permission.id)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">{permission.permission_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'permission':
        return (
          <>
            <div>
              <label className={labelClass}>권한 코드</label>
              <input
                type="text"
                value={formData.permission_code || ''}
                onChange={(e) => setFormData({...formData, permission_code: e.target.value})}
                className={baseInputClass}
                placeholder="예: view_users, manage_production"
                required
              />
            </div>
            <div>
              <label className={labelClass}>권한명</label>
              <input
                type="text"
                value={formData.permission_name || ''}
                onChange={(e) => setFormData({...formData, permission_name: e.target.value})}
                className={baseInputClass}
                placeholder="예: 사용자 조회"
                required
              />
            </div>
            <div>
              <label className={labelClass}>권한 설명</label>
              <textarea
                value={formData.permission_description || ''}
                onChange={(e) => setFormData({...formData, permission_description: e.target.value})}
                className={baseInputClass}
                rows="3"
                placeholder="이 권한이 허용하는 작업을 설명하세요"
              />
            </div>
            <div>
              <label className={labelClass}>카테고리</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={baseInputClass}
                required
              >
                <option value="">카테고리 선택</option>
                <option value="user">사용자 관리</option>
                <option value="production">생산 관리</option>
                <option value="quality">품질 관리</option>
                <option value="inventory">재고 관리</option>
                <option value="equipment">설비 관리</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </>
        );

      case 'team':
        return (
          <>
            <div>
              <label className={labelClass}>담당자 선택 *</label>
              <select
                value={formData.user_id || ''}
                onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                className={baseInputClass}
                required
              >
                <option value="">-- 담당자를 선택하세요 --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email.split('@')[0]} ({user.email}) - {user.department}
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ 등록된 사용자가 없습니다. 먼저 사용자를 등록해주세요.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>팀명 *</label>
              <input
                type="text"
                value={formData.team_name || ''}
                onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                className={baseInputClass}
                placeholder="예: 생산팀, 품질관리팀, 설비관리팀"
                required
              />
            </div>
            <div>
              <label className={labelClass}>팀 내 역할</label>
              <select
                value={formData.role_in_team || 'member'}
                onChange={(e) => setFormData({...formData, role_in_team: e.target.value})}
                className={baseInputClass}
              >
                <option value="member">팀원</option>
                <option value="leader">팀장</option>
                <option value="supervisor">관리자</option>
                <option value="assistant">부팀장</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>담당 업무</label>
              <textarea
                value={formData.responsibilities || ''}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                className={baseInputClass}
                placeholder="담당자의 주요 업무와 책임사항을 입력하세요..."
                rows="3"
              />
            </div>
            <div>
              <label className={labelClass}>배정일</label>
              <input
                type="date"
                value={formData.assigned_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, assigned_date: e.target.value})}
                className={baseInputClass}
              />
            </div>
          </>
        );

      case 'status':
        return (
          <>
            <div>
              <label className={labelClass}>카테고리</label>
              <select
                value={formData.category || 'production'}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={baseInputClass}
                required
              >
                <option value="customer">고객</option>
                <option value="product">제품</option>
                <option value="process">공정</option>
                <option value="production">생산</option>
                <option value="equipment">설비</option>
                <option value="inventory">재고</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>상태 키</label>
                <input
                  type="text"
                  value={formData.status_key || ''}
                  onChange={(e) => setFormData({...formData, status_key: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>상태 라벨</label>
                <input
                  type="text"
                  value={formData.status_label || ''}
                  onChange={(e) => setFormData({...formData, status_label: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>색상</label>
                <input
                  type="color"
                  value={formData.status_color || '#3B82F6'}
                  onChange={(e) => setFormData({...formData, status_color: e.target.value})}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className={labelClass}>표시 순서</label>
                <input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className={baseInputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={baseInputClass}
                rows="2"
              />
            </div>
          </>
        );

      case 'product-group':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>그룹 코드</label>
                <input
                  type="text"
                  value={formData.group_code || ''}
                  onChange={(e) => setFormData({...formData, group_code: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>그룹명</label>
                <input
                  type="text"
                  value={formData.group_name || ''}
                  onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>패턴 정규식 (선택)</label>
              <input
                type="text"
                value={formData.pattern_regex || ''}
                onChange={(e) => setFormData({...formData, pattern_regex: e.target.value})}
                className={baseInputClass}
                placeholder="예: ^CMI-.*"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>색상</label>
                <input
                  type="color"
                  value={formData.color_code || '#3B82F6'}
                  onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className={labelClass}>표시 순서</label>
                <input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className={baseInputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={baseInputClass}
                rows="2"
              />
            </div>
          </>
        );

      case 'line-setting':
        return (
          <>
            <div>
              <label className={labelClass}>설정명</label>
              <input
                type="text"
                value={formData.setting_name || ''}
                onChange={(e) => setFormData({...formData, setting_name: e.target.value})}
                className={baseInputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>채널 액세스 토큰</label>
              <input
                type="password"
                value={formData.channel_access_token || ''}
                onChange={(e) => setFormData({...formData, channel_access_token: e.target.value})}
                className={baseInputClass}
              />
            </div>
            <div>
              <label className={labelClass}>채널 시크릿</label>
              <input
                type="password"
                value={formData.channel_secret || ''}
                onChange={(e) => setFormData({...formData, channel_secret: e.target.value})}
                className={baseInputClass}
              />
            </div>
            <div>
              <label className={labelClass}>웹훅 URL</label>
              <input
                type="url"
                value={formData.webhook_url || ''}
                onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                className={baseInputClass}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_enabled"
                checked={formData.is_enabled || false}
                onChange={(e) => setFormData({...formData, is_enabled: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">활성화</label>
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={baseInputClass}
                rows="2"
              />
            </div>
          </>
        );

      case 'notification-template':
        return (
          <>
            <div>
              <label className={labelClass}>템플릿명</label>
              <input
                type="text"
                value={formData.template_name || ''}
                onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                className={baseInputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>템플릿 타입</label>
                <select
                  value={formData.template_type || 'line'}
                  onChange={(e) => setFormData({...formData, template_type: e.target.value})}
                  className={baseInputClass}
                  required
                >
                  <option value="line">LINE</option>
                  <option value="email">이메일</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>이벤트 트리거</label>
                <select
                  value={formData.event_trigger || 'production_complete'}
                  onChange={(e) => setFormData({...formData, event_trigger: e.target.value})}
                  className={baseInputClass}
                  required
                >
                  <option value="production_complete">생산 완료</option>
                  <option value="quality_fail">품질 불량</option>
                  <option value="equipment_failure">설비 고장</option>
                  <option value="inventory_low">재고 부족</option>
                  <option value="order_received">주문 접수</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>제목 (이메일/SMS)</label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className={baseInputClass}
              />
            </div>
            <div>
              <label className={labelClass}>내용</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className={baseInputClass}
                rows="4"
                required
                placeholder="{{변수명}} 형식으로 변수 사용 가능"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="template_is_active"
                checked={formData.is_active !== false}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="template_is_active" className="text-sm font-medium text-gray-700">활성화</label>
            </div>
          </>
        );

      case 'plc':
        return (
          <>
            <div>
              <label className={labelClass}>장비명</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={baseInputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>IP 주소</label>
                <input
                  type="text"
                  value={formData.ip_address || ''}
                  onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                  className={baseInputClass}
                  required
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className={labelClass}>포트</label>
                <input
                  type="number"
                  value={formData.port || 502}
                  onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                  className={baseInputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>위치</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className={baseInputClass}
              />
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={baseInputClass}
                rows="2"
              />
            </div>
          </>
        );

      case 'admin-setting':
        return (
          <>
            <div>
              <label className={labelClass}>카테고리</label>
              <select
                value={formData.category || 'general'}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className={baseInputClass}
                required
              >
                <option value="general">일반</option>
                <option value="security">보안</option>
                <option value="notification">알림</option>
                <option value="backup">백업</option>
                <option value="system">시스템</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>설정 키</label>
                <input
                  type="text"
                  value={formData.setting_key || ''}
                  onChange={(e) => setFormData({...formData, setting_key: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>설정명</label>
                <input
                  type="text"
                  value={formData.setting_name || ''}
                  onChange={(e) => setFormData({...formData, setting_name: e.target.value})}
                  className={baseInputClass}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>데이터 타입</label>
                <select
                  value={formData.data_type || 'string'}
                  onChange={(e) => setFormData({...formData, data_type: e.target.value})}
                  className={baseInputClass}
                >
                  <option value="string">문자열</option>
                  <option value="number">숫자</option>
                  <option value="boolean">불린</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>표시 순서</label>
                <input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className={baseInputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>설정 값</label>
              <input
                type={formData.is_sensitive ? 'password' : 'text'}
                value={formData.setting_value || ''}
                onChange={(e) => setFormData({...formData, setting_value: e.target.value})}
                className={baseInputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={baseInputClass}
                rows="2"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_sensitive"
                  checked={formData.is_sensitive || false}
                  onChange={(e) => setFormData({...formData, is_sensitive: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_sensitive" className="text-sm font-medium text-gray-700">민감 정보</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_restart"
                  checked={formData.requires_restart || false}
                  onChange={(e) => setFormData({...formData, requires_restart: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="requires_restart" className="text-sm font-medium text-gray-700">재시작 필요</label>
              </div>
            </div>
          </>
        );

      default:
        return (
          <div>
            <label className={labelClass}>이름</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={baseInputClass}
              required
            />
          </div>
        );
    }
  };

  const getItemName = (type, item) => {
    const nameMap = {
      'user': item.email,
      'role': `${item.role_name} (${item.role_code})`,
      'permission': `${item.permission_name} (${item.permission_code})`,
      'team': item.team_name,
      'status': item.status_label,
      'product-group': item.group_name,
      'line-setting': item.setting_name,
      'notification-template': item.template_name,
      'plc': item.name,
      'admin-setting': item.setting_name
    };
    return nameMap[type] || 'item';
  };

  const processFormData = (type, data) => {
    // 타입별로 폼 데이터를 데이터베이스 형식으로 변환
    const processed = { ...data };
    processed.updated_at = new Date().toISOString();
    
    switch (type) {
      case 'user':
        // 사용자 데이터 처리 - 데이터베이스 스키마에 맞는 필드만 유지
        const allowedUserFields = [
          'id', 'email', 'full_name', 'department', 'position', 'phone', 
          'role', 'approval_status', 'language', 'avatar_url', 'is_active', 
          'last_login', 'approved_by', 'approved_at', 'created_at', 'updated_at'
        ];
        
        // full_name 생성
        processed.full_name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        
        if (!editingItem) {
          processed.approval_status = 'approved';
          processed.is_active = true;
        }
        
        // 허용된 필드만 유지
        Object.keys(processed).forEach(key => {
          if (!allowedUserFields.includes(key)) {
            delete processed[key];
          }
        });
        break;

      case 'role':
        // 역할 데이터 처리
        if (!editingItem) {
          processed.is_active = true;
        }
        // selectedPermissions와 role_permissions는 별도 처리하므로 제거
        delete processed.selectedPermissions;
        delete processed.role_permissions;
        break;

      case 'permission':
        // 권한 데이터 처리
        if (!editingItem) {
          processed.is_active = true;
        }
        break;
        
      case 'team':
        // 팀 배정 데이터 처리
        if (!editingItem) {
          processed.assigned_date = data.assigned_date || new Date().toISOString().split('T')[0];
          processed.is_active = true;
          processed.assigned_by = user?.id || userProfile?.id;
        } else {
          // 수정 시에도 assigned_date 처리
          if (data.assigned_date) {
            processed.assigned_date = data.assigned_date;
          }
        }
        // user_id를 정수로 변환
        if (processed.user_id) {
          processed.user_id = parseInt(processed.user_id);
        }
        break;
        
      case 'status':
        // 상태 정의 데이터 처리
        if (!editingItem) {
          processed.is_active = true;
        }
        break;
        
      case 'product-group':
        // 제품 그룹 데이터 처리
        if (!editingItem) {
          processed.is_active = true;
        }
        break;
        
      case 'notification-template':
        // 알림 템플릿 데이터 처리
        if (processed.is_active === undefined) {
          processed.is_active = true;
        }
        break;
        
      case 'plc':
        // PLC 데이터 처리
        if (!editingItem) {
          processed.is_active = true;
          processed.connection_status = 'disconnected';
        }
        break;
        
      default:
        break;
    }
    
    return processed;
  };

  const loadDataByType = async (type) => {
    const loadMap = {
      'user': loadUsers,
      'role': loadUserRoles,
      'permission': loadPermissions,
      'team': loadTeamAssignments,
      'status': loadStatusDefinitions,
      'product-group': loadProductGroups,
      'line-setting': loadLineSettings,
      'notification-template': loadNotificationTemplates,
      'plc': loadPlcDevices,
      'admin-setting': loadAdminSettings
    };
    const loadFunction = loadMap[type];
    if (loadFunction) {
      console.log(`${type} 데이터 로드 시작...`);
      await loadFunction();
      console.log(`${type} 데이터 로드 완료`);
    } else {
      console.warn(`알 수 없는 데이터 타입: ${type}`);
    }
  };

  // 상태별 색상 반환
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
      case 'inactive':
        return 'text-red-400';
      case 'maintenance':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  // 역할별 색상 반환
  const getRoleColor = (roleCode) => {
    // 체크 제약조건 값을 user_roles 값으로 역변환
    const reverseRoleMapping = {
      'admin': 'Admin',
      'manager': 'Manager',
      'operator': 'Users',
      'viewer': 'Users'
    };
    
    const mappedRoleCode = reverseRoleMapping[roleCode] || roleCode;
    const role = userRoles.find(r => r.role_code === mappedRoleCode);
    
    if (role?.is_system_role) {
      switch (roleCode) {
        case 'admin':
        case 'super_admin':
          return 'bg-red-100 text-red-800';
        case 'manager':
          return 'bg-blue-100 text-blue-800';
        case 'operator':
          return 'bg-green-100 text-green-800';
        case 'viewer':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-purple-100 text-purple-800';
      }
    }
    return 'bg-indigo-100 text-indigo-800'; // 사용자 정의 역할
  };

  // 역할 코드를 역할명으로 변환
  const getRoleName = (roleCode) => {
    if (!roleCode) return '역할 없음';
    
    // 먼저 체크 제약조건 값을 user_roles 값으로 역변환
    const reverseRoleMapping = {
      'admin': 'Admin',
      'manager': 'Manager',
      'operator': 'Users',
      'viewer': 'Users'
    };
    
    // 역변환 시도
    const mappedRoleCode = reverseRoleMapping[roleCode] || roleCode;
    
    // user_roles 테이블에서 찾기
    const role = userRoles.find(r => r.role_code === mappedRoleCode);
    if (role) {
      return role.role_name;
    }
    
    // 기본 역할들의 한글명 매핑 (fallback)
    const defaultRoleNames = {
      'admin': '시스템 관리자',
      'super_admin': '최고 관리자',
      'manager': '부서 관리자',
      'operator': '작업자',
      'viewer': '조회자'
    };
    
    return defaultRoleNames[roleCode] || roleCode;
  };

  // 사용자 승인 처리 (개선된 에러 핸들링)
  const handleApproveUser = async (pendingUser) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'approved',
          is_active: true,
          approved_by: user?.id || userProfile?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingUser.id);

      if (error) throw error;

      showToast(`${pendingUser.full_name || pendingUser.email} 사용자가 승인되었습니다.`, 'success');
      await Promise.all([loadUsers(), loadPendingUsers()]);
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      showToast(`사용자 승인 실패: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 거부 처리 (개선된 에러 핸들링)
  const handleRejectUser = async (pendingUser) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          approval_status: 'rejected',
          is_active: false,
          approved_by: user?.id || userProfile?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingUser.id);

      if (error) throw error;

      showToast(`${pendingUser.full_name || pendingUser.email} 사용자가 거부되었습니다.`, 'warning');
      await loadPendingUsers();
    } catch (error) {
      console.error('사용자 거부 오류:', error);
      showToast(`사용자 거부 실패: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold mb-2">관리자 패널 로딩 중...</div>
          <div className="text-blue-200 text-sm">
            사용자, 팀 배정, 상태 정의 등 데이터를 불러오고 있습니다.
          </div>
          <div className="text-blue-300 text-xs mt-2">
            데이터베이스 연결 및 권한 확인 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('admin.title')}</h1>
            <p className="text-blue-200">시스템 관리 및 사용자 관리</p>
          </div>
          
          {/* 현재 사용자 정보 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-lg font-semibold">
                    {(currentUser?.name || '관리자').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">{currentUser?.name || '관리자'}</p>
                <p className="text-blue-200 text-sm">
                  {currentUser?.position || 'Administrator'} • {currentUser?.department || 'IT'}
                </p>
                <p className="text-blue-300 text-xs">{currentUser?.email || '사용자 정보 로딩 중...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
              {[
                { id: 'users', name: '사용자 관리', icon: '👥' },
                { id: 'roles', name: '역할 관리', icon: '🔐' },
                { id: 'managers', name: '담당자 관리', icon: '👨‍💼' },
                { id: 'status', name: '상태 관리', icon: '📊' },
                { id: 'product-groups', name: '제품 그룹', icon: '📦' },
                { id: 'line-notifications', name: 'LINE 알림', icon: '📱' },
                { id: 'system', name: '시스템 상태', icon: '🖥️' },
                { id: 'plc', name: 'PLC 관리', icon: '🔧' },
                { id: 'settings', name: '설정 관리', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg shadow-lg">
          {/* 사용자 관리 탭 */}
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">사용자 관리</h2>
                <button
                  onClick={() => handleCreate('user')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>새 사용자</span>
        </button>
      </div>

              {/* 승인 대기 사용자 */}
              {pendingUsers.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">승인 대기 사용자 ({pendingUsers.length}명)</h3>
                  <div className="space-y-2">
                    {pendingUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                         <span className="text-sm font-medium">{(user.full_name || user.email)?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                          <div>
                                                         <p className="font-medium">{user.full_name || user.email.split('@')[0]}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400">{user.department} - {user.position}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveUser(user)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectUser(user)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            거부
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 활성 사용자 목록 */}
              <div className="bg-white rounded-lg border" key={`users-list-${refreshKey}`}>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">활성 사용자 ({users.length}명)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">부서</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">마지막 로그인</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
                    <tbody className="divide-y divide-gray-200">
                                    {users.map(user => (
                        <tr key={`${user.id}-${refreshKey}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {(user.full_name || user.email)?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                      </div>
                      <div>
                                <p className="font-medium text-gray-900">{user.full_name || user.email.split('@')[0]}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{user.department}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.approval_status === 'approved' ? '승인됨' : user.approval_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm space-x-2">
                            <button
                              onClick={() => handleEdit('user', user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              수정
                      </button>
                            <button
                              onClick={() => handleDelete('user', user)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
          )}

          {/* 역할 관리 탭 */}
          {activeTab === 'roles' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">역할 관리</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleCreate('permission')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>새 권한</span>
                  </button>
                  <button
                    onClick={() => handleCreate('role')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>새 역할</span>
                  </button>
                  <button
                    onClick={() => handleBulkDeleteRoles()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                    title="모든 역할을 삭제합니다 (주의: 복구 불가능)"
                  >
                    <span>🗑️</span>
                    <span>전체 삭제</span>
                  </button>
                </div>
      </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 역할 목록 */}
                <div className="bg-white rounded-lg border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">역할 목록 ({userRoles.length}개)</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {userRoles.map(role => (
                        <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                role.is_system_role ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {role.role_code}
              </span>
                              {role.is_system_role && (
                                <span className="text-xs text-gray-500">(시스템)</span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEdit('role', role)}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete('role', role)}
                                className={`text-red-600 hover:text-red-900 text-sm ${role.is_system_role ? 'opacity-50' : ''}`}
                                title={role.is_system_role ? '시스템 역할입니다. 주의해서 삭제하세요.' : '역할 삭제'}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          <h4 className="font-medium text-gray-900">{role.role_name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{role.role_description}</p>
                          <div className="flex flex-wrap gap-1">
                            {role.role_permissions?.map(rp => (
                              <span
                                key={rp.permission_id}
                                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {rp.permissions?.permission_name}
                              </span>
                            )) || <span className="text-xs text-gray-400">권한 없음</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
            </div>
            
                {/* 권한 목록 */}
                <div className="bg-white rounded-lg border">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">권한 목록 ({permissions.length}개)</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {Object.entries(
                        permissions.reduce((acc, permission) => {
                          if (!acc[permission.category]) acc[permission.category] = [];
                          acc[permission.category].push(permission);
                          return acc;
                        }, {})
                      ).map(([category, categoryPermissions]) => (
                        <div key={category} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 capitalize">{category}</h4>
                          <div className="space-y-2">
                            {categoryPermissions.map(permission => (
                              <div key={permission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">{permission.permission_name}</span>
                                  <p className="text-xs text-gray-500">{permission.permission_code}</p>
                                  {permission.permission_description && (
                                    <p className="text-xs text-gray-600 mt-1">{permission.permission_description}</p>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleEdit('permission', permission)}
                                    className="text-blue-600 hover:text-blue-900 text-xs"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete('permission', permission)}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                  >
                                    삭제
                                  </button>
            </div>
          </div>
        ))}
      </div>
    </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 담당자 관리 탭 */}
          {activeTab === 'managers' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">담당자 관리</h2>
                <button
                  onClick={() => handleCreate('team')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>담당자 추가</span>
        </button>
      </div>

              <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">팀</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당업무</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">배정일</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teamAssignments.map(assignment => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {assignment.full_name?.charAt(0) || 'M'}
                        </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{assignment.full_name}</p>
                                <p className="text-sm text-gray-500">{assignment.email}</p>
                              </div>
                    </div>
                  </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{assignment.team_name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              assignment.role_in_team === 'leader' ? 'bg-purple-100 text-purple-800' :
                              assignment.role_in_team === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {assignment.role_in_team}
                    </span>
                  </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{assignment.responsibilities}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(assignment.assigned_date).toLocaleDateString()}
                  </td>
                          <td className="px-6 py-4 text-right text-sm space-x-2">
                            <button
                              onClick={() => handleEdit('team', assignment)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              수정
                      </button>
                            <button
                              onClick={() => handleDelete('team', assignment)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
          )}

          {/* 상태 관리 탭 */}
          {activeTab === 'status' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">상태 관리</h2>
        <button 
                  onClick={() => handleCreate('status')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
                  <span>+</span>
                  <span>새 상태</span>
        </button>
      </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  statusDefinitions.reduce((acc, status) => {
                    if (!acc[status.category]) acc[status.category] = [];
                    acc[status.category].push(status);
                    return acc;
                  }, {})
                ).map(([category, statuses]) => (
                  <div key={category} className="bg-white border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 capitalize">{category}</h3>
                    <div className="space-y-2">
                      {statuses.map(status => (
                        <div key={status.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: status.status_color }}
                            ></div>
                            <span className="text-sm font-medium">{status.status_label}</span>
            </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEdit('status', status)}
                              className="text-blue-600 hover:text-blue-900 text-xs"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete('status', status)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              삭제
                            </button>
          </div>
        </div>
                      ))}
            </div>
          </div>
                ))}
        </div>
            </div>
          )}

          {/* 제품 그룹 관리 탭 */}
          {activeTab === 'product-groups' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">제품 그룹 관리</h2>
                <button
                  onClick={() => handleCreate('product-group')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>새 그룹</span>
                </button>
      </div>

              <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">그룹 코드</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">그룹명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">패턴</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">색상</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productGroups.map(group => (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{group.group_code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{group.group_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">{group.pattern_regex}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: group.color_code }}
                              ></div>
                              <span className="text-sm text-gray-500">{group.color_code}</span>
                    </div>
                  </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{group.description}</td>
                          <td className="px-6 py-4 text-right text-sm space-x-2">
                      <button 
                              onClick={() => handleEdit('product-group', group)}
                              className="text-blue-600 hover:text-blue-900"
                      >
                              수정
                      </button>
                      <button 
                              onClick={() => handleDelete('product-group', group)}
                              className="text-red-600 hover:text-red-900"
                      >
                              삭제
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
            </div>
          )}

          {/* LINE 알림 설정 탭 */}
          {activeTab === 'line-notifications' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">LINE 알림 설정</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCreate('line-setting')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>LINE 설정</span>
                  </button>
                  <button
                    onClick={() => handleCreate('notification-template')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>알림 템플릿</span>
                  </button>
                </div>
                </div>

              {/* LINE 설정 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">LINE 설정</h3>
                <div className="bg-white rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설정명</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {lineSettings.map(setting => (
                          <tr key={setting.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{setting.setting_name}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                setting.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {setting.is_enabled ? '활성' : '비활성'}
          </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{setting.description}</td>
                            <td className="px-6 py-4 text-right text-sm space-x-2">
          <button 
                                onClick={() => handleEdit('line-setting', setting)}
                                className="text-blue-600 hover:text-blue-900"
          >
                                수정
          </button>
                              <button
                                onClick={() => handleDelete('line-setting', setting)}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
        </div>
      </div>
          </div>

              {/* 알림 템플릿 */}
          <div>
                <h3 className="text-lg font-semibold mb-4">알림 템플릿</h3>
                <div className="bg-white rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">템플릿명</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">트리거</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {notificationTemplates.map(template => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{template.template_name}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                template.template_type === 'line' ? 'bg-green-100 text-green-800' :
                                template.template_type === 'email' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {template.template_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{template.event_trigger}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {template.is_active ? '활성' : '비활성'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm space-x-2">
            <button
                                onClick={() => handleEdit('notification-template', template)}
                                className="text-blue-600 hover:text-blue-900"
            >
                                수정
            </button>
            <button
                                onClick={() => handleDelete('notification-template', template)}
                                className="text-red-600 hover:text-red-900"
            >
                                삭제
            </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </div>
          </div>
        </div>
      </div>
          )}

          {/* 시스템 상태 탭 */}
          {activeTab === 'system' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">시스템 상태</h2>
              
              {/* 시스템 상태 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Object.entries(systemStatus).map(([key, status]) => (
                  <div key={key} className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">{key}</h3>
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'healthy' ? 'bg-green-400' :
                        status.status === 'warning' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}></div>
                    </div>
                    <p className={`text-2xl font-bold mt-2 ${getStatusColor(status.status)}`}>
                      {status.status}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      {status.latency && <p>지연시간: {status.latency}</p>}
                      {status.uptime && <p>가동률: {status.uptime}</p>}
                      {status.usage && <p>사용률: {status.usage}</p>}
                      {status.lastBackup && <p>마지막 백업: {new Date(status.lastBackup).toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
        </div>
        
              {/* 페이지별 상태 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">페이지별 상태</h3>
                <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">페이지</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">접속자</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">오류</th>
              </tr>
            </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(pageStatus).map(([page, status]) => (
                          <tr key={page} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">{page}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                status.status === 'active' ? 'bg-green-100 text-green-800' :
                                status.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status.status}
                    </span>
                  </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{status.users}명</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <span className={status.errors > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                {status.errors}개
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
              </div>
            </div>
          )}

          {/* PLC 관리 탭 */}
          {activeTab === 'plc' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">PLC 관리</h2>
                <button
                  onClick={() => handleCreate('plc')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>새 PLC</span>
                </button>
          </div>

              <div className="bg-white rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">장비명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP 주소</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연결상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">마지막 통신</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {plcDevices.map(device => (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">{device.ip_address}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              device.connection_status === 'connected' ? 'bg-green-100 text-green-800' :
                              device.connection_status === 'disconnected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {device.connection_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{device.location}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {device.last_communication ? new Date(device.last_communication).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm space-x-2">
                            <button
                              onClick={() => handleEdit('plc', device)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete('plc', device)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
          </div>
        </div>
      </div>
          )}

          {/* 설정 관리 탭 */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">설정 관리</h2>
                <button
                  onClick={() => handleCreate('admin-setting')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>새 설정</span>
                </button>
    </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(
                  adminSettings.reduce((acc, setting) => {
                    if (!acc[setting.category]) acc[setting.category] = [];
                    acc[setting.category].push(setting);
                    return acc;
                  }, {})
                ).map(([category, settings]) => (
                  <div key={category} className="bg-white border rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{category}</h3>
            </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {settings.map(setting => (
                          <div key={setting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{setting.setting_name}</p>
                              <p className="text-sm text-gray-500">{setting.description}</p>
                              <div className="mt-1">
                                {setting.is_sensitive ? (
                                  <span className="text-xs text-gray-400">••••••••</span>
                                ) : (
                                  <span className="text-sm text-gray-700">{setting.setting_value}</span>
                                )}
              </div>
              </div>
                            <div className="flex space-x-1 ml-4">
                              <button
                                onClick={() => handleEdit('admin-setting', setting)}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDelete('admin-setting', setting)}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                삭제
                              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
          </div>
                ))}
          </div>
                  </div>
                )}
                </div>
              </div>
              
      {/* 모달 */}
      <Modal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? '수정' : '새로 만들기'} - ${getModalTitle(modalType)}`}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-4">
            {renderFormFields(modalType)}
            <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
                </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? '수정' : '생성'}
              </button>
      </div>
          </div>
        </form>
      </Modal>

      {/* 삭제 확인 대화상자 */}
      {deleteConfirm.isOpen && (
        <ConfirmDialog
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={deleteConfirm.type === 'bulk-roles' ? confirmBulkDeleteRoles : confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, type: '', item: null, title: '', message: '' })}
        />
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default AdminPanelPage; 