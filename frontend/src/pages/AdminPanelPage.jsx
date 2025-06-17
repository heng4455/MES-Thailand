import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiUsers, 
  FiSettings, 
  FiKey, 
  FiMonitor, 
  FiActivity,
  FiShield,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiCpu,
  FiWifi,
  FiWifiOff,
  FiDatabase,
  FiMessageSquare,
  FiSend,
  FiCheck,
  FiX,
  FiPackage,
  FiToggleLeft,
  FiSave
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';

const AdminPanelPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const { user, userProfile, loading } = useUser();

  // 현재 로그인한 사용자 정보를 UserContext에서 가져오기
  const getCurrentUser = () => {
    if (loading) {
      return {
        name: t('admin.loading'),
        email: '',
        role: 'admin',
        avatar: null
      };
    }

    if (user && userProfile) {
      return {
        name: `${userProfile.firstName} ${userProfile.lastName}`,
        email: user.email,
        role: userProfile.role || 'admin',
        avatar: userProfile.avatar || null,
        department: userProfile.department || 'IT',
        position: userProfile.position || 'Administrator'
      };
    }

    if (user) {
      // userProfile이 없는 경우 user 정보만 사용
      const emailName = user.email?.split('@')[0] || '사용자';
      return {
        name: user.user_metadata?.full_name || user.user_metadata?.name || emailName,
        email: user.email,
        role: 'admin',
        avatar: user.user_metadata?.avatar_url || null,
        department: 'IT',
        position: 'Administrator'
      };
    }

    return {
              name: t('admin.administrator'),
      email: 'admin@mes-thailand.com',
      role: 'admin',
      avatar: null,
      department: 'IT',
      position: 'Administrator'
    };
  };

  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // 사용자 관리 상태
  const [users, setUsers] = useState([
    {
      id: 1,
      email: 'admin@mesThailand.com',
      firstName: '관리자',
      lastName: '김',
      role: 'admin',
      department: 'IT',
      position: 'Administrator',
      status: 'active',
      lastLogin: '2024-06-16T10:30:00'
    },
    {
      id: 2,
      email: 'manager@mesThailand.com',
      firstName: '매니저',
      lastName: '이',
      role: 'manager',
      department: 'Production',
      position: 'Production Manager',
      status: 'active',
      lastLogin: '2024-06-15T16:45:00'
    }
  ]);

  // API 키 관리 상태
  const [apiKeys] = useState([
    {
      id: 1,
      name: 'Production Line API',
      key: 'pk_prod_1234567890abcdef',
      service: 'production',
      status: 'active',
      lastUsed: '2024-06-16T08:30:00',
      permissions: ['read', 'write']
    },
    {
      id: 2,
      name: 'Equipment Monitoring',
      key: 'pk_equip_abcdef1234567890',
      service: 'equipment',
      status: 'active',
      lastUsed: '2024-06-16T10:15:00',
      permissions: ['read']
    }
  ]);

  // 시스템 상태
  const [systemStatus] = useState({
    database: { status: 'healthy', latency: '15ms' },
    api: { status: 'healthy', uptime: '99.9%' },
    storage: { status: 'warning', usage: '78%' },
    backup: { status: 'healthy', lastBackup: '2024-06-16T02:00:00' }
  });

  // 페이지별 상태
  const [pageStatus] = useState({
    dashboard: { status: 'active', users: 45, errors: 0 },
    production: { status: 'active', users: 12, errors: 1 },
    equipment: { status: 'active', users: 8, errors: 0 },
    quality: { status: 'maintenance', users: 0, errors: 0 },
    inventory: { status: 'active', users: 5, errors: 0 },
    reports: { status: 'active', users: 3, errors: 0 }
  });

  // 제품 그룹 관리 상태
  const [productGroups, setProductGroups] = useState([
    {
      id: 1,
      code: 'CDSS',
      name: 'Power Inductor',
      description: '전력 인덕터 제품 그룹',
      pattern: '/CDSS/',
      createdAt: '2024-01-15T09:00:00',
      active: true
    },
    {
      id: 2,
      code: 'CMPP',
      name: 'Coupled Inductor',
      description: '결합 인덕터 제품 그룹',
      pattern: '/CMPP/',
      createdAt: '2024-01-15T09:00:00',
      active: true
    },
    {
      id: 3,
      code: 'CSSP',
      name: 'Shield Power Inductor',
      description: '차폐 전력 인덕터 제품 그룹',
      pattern: '/CSSP/',
      createdAt: '2024-01-15T09:00:00',
      active: true
    },
    {
      id: 4,
      code: 'CSCF',
      name: 'Common Mode Choke',
      description: '공통 모드 초크 제품 그룹',
      pattern: '/CSCF/',
      createdAt: '2024-01-15T09:00:00',
      active: true
    },
    {
      id: 5,
      code: 'CMMP',
      name: 'Magnetic Component',
      description: '자성 부품 제품 그룹',
      pattern: '/CMMP/',
      createdAt: '2024-01-15T09:00:00',
      active: true
    }
  ]);

  const [showProductGroupModal, setShowProductGroupModal] = useState(false);
  const [editingProductGroup, setEditingProductGroup] = useState(null);
  const [productGroupForm, setProductGroupForm] = useState({
    code: '',
    name: '',
    description: '',
    pattern: '',
    active: true
  });

  // 상태 관리 상태
  const [pageStatuses, setPageStatuses] = useState({
    production: [
      { id: 1, name: 'planned', label: '계획됨', color: '#6B7280', description: '생산 계획 수립됨' },
      { id: 2, name: 'in_progress', label: '진행중', color: '#3B82F6', description: '생산 진행중' },
      { id: 3, name: 'completed', label: '완료됨', color: '#10B981', description: '생산 완료됨' },
      { id: 4, name: 'cancelled', label: '취소됨', color: '#EF4444', description: '생산 취소됨' }
    ],
    quality: [
      { id: 1, name: 'pass', label: '합격', color: '#10B981', description: '품질 검사 합격' },
      { id: 2, name: 'fail', label: '불합격', color: '#EF4444', description: '품질 검사 불합격' },
      { id: 3, name: 'in-progress', label: '검사중', color: '#F59E0B', description: '품질 검사 진행중' },
      { id: 4, name: 'completed', label: '완료', color: '#3B82F6', description: '검사 완료' }
    ],
    inventory: [
      { id: 1, name: 'normal', label: '정상', color: '#10B981', description: '정상 재고 수준' },
      { id: 2, name: 'critical', label: '긴급', color: '#EF4444', description: '긴급 보충 필요' },
      { id: 3, name: 'low_stock', label: '부족', color: '#F59E0B', description: '재고 부족' },
      { id: 4, name: 'overstock', label: '과재고', color: '#8B5CF6', description: '재고 과다' }
    ],
    equipment: [
      { id: 1, name: 'running', label: '가동중', color: '#10B981', description: '설비 정상 가동' },
      { id: 2, name: 'idle', label: '대기', color: '#6B7280', description: '설비 대기중' },
      { id: 3, name: 'maintenance', label: '보전중', color: '#F59E0B', description: '설비 보전중' },
      { id: 4, name: 'error', label: '오류', color: '#EF4444', description: '설비 오류 발생' }
    ]
  });

  const [selectedStatusPage, setSelectedStatusPage] = useState('production');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusForm, setStatusForm] = useState({
    name: '',
    label: '',
    color: '#3B82F6',
    description: ''
  });

  // PLC 연결 상태
  const [plcConnections, setPlcConnections] = useState([]);
  
  // PLC 데이터 포인트
  const [plcDataPoints, setPlcDataPoints] = useState([]);
  
  // PLC 데이터 로딩 중
  const [plcLoading, setPlcLoading] = useState(true);

  // LINE 알림 설정
  const [lineConfig, setLineConfig] = useState({
    channelAccessToken: '',
    channelSecret: '',
    groupId: '',
    isEnabled: false,
    lastTestTime: null,
    lastTestResult: null
  });

  // LINE 알림 기록
  const [lineNotifications] = useState([
    {
      id: 1,
      type: 'system_alert',
      title: 'PLC 연결 오류',
      message: 'Production Line 1 PLC 연결이 끊어졌습니다.',
      timestamp: '2024-06-16T10:30:00',
      status: 'sent',
      recipients: 3
    },
    {
      id: 2,
      type: 'production_alert',
      title: '생산 목표 달성',
      message: '오늘 생산 목표 100% 달성하였습니다.',
      timestamp: '2024-06-16T09:15:00',
      status: 'sent',
      recipients: 5
    },
    {
      id: 3,
      type: 'quality_alert',
      title: '품질 이슈 발생',
      message: 'Batch #2024-001에서 불량률 5% 초과',
      timestamp: '2024-06-16T08:45:00',
      status: 'failed',
      recipients: 0
    }
  ]);

  // LINE 알림 테스트
  const [lineTestLoading, setLineTestLoading] = useState(false);

  // 사용자 정보가 변경될 때마다 currentUser 업데이트
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [user, userProfile, loading]);

  // 현재 사용자 정보가 변경되면 사용자 목록 업데이트
  useEffect(() => {
    console.log('📊 사용자 목록 업데이트 트리거:', currentUser);
    if (currentUser.email && currentUser.email !== 'admin@mes-thailand.com') {
      setUsers(prevUsers => {
        // 현재 사용자가 이미 목록에 있는지 확인
        const existingUserIndex = prevUsers.findIndex(user => user.email === currentUser.email);
        
        if (existingUserIndex >= 0) {
          // 기존 사용자 정보 업데이트
          const updatedUsers = [...prevUsers];
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            email: currentUser.email,
            firstName: currentUser.name.split(' ')[0] || currentUser.name,
            lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
            role: currentUser.role,
            status: 'active',
            lastLogin: new Date().toISOString()
          };
          return updatedUsers;
        } else {
          // 새 사용자 추가
          const newUser = {
            id: prevUsers.length + 1,
            email: currentUser.email,
            firstName: currentUser.name.split(' ')[0] || currentUser.name,
            lastName: currentUser.name.split(' ').slice(1).join(' ') || '',
            role: currentUser.role,
            department: currentUser.role === 'admin' ? 'IT' : 'General',
            position: currentUser.role === 'admin' ? 'System Administrator' : 
                     currentUser.role === 'manager' ? 'Manager' : 'Operator',
            status: 'active',
            lastLogin: new Date().toISOString()
          };
          return [newUser, ...prevUsers];
        }
      });
    }
  }, [currentUser]);

  // PLC 데이터 로드
  useEffect(() => {
    const loadPlcData = async () => {
      try {
        // Supabase 세션에서 토큰 추출
        const supabaseSession = localStorage.getItem('supabase_session');
        if (!supabaseSession) return;
        
        const session = JSON.parse(supabaseSession);
        const token = session?.access_token;
        if (!token) return;

        // PLC 연결 상태 조회
        const connectionsResponse = await fetch('http://localhost:3001/api/plc/connections', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          setPlcConnections(connectionsData.data);
        }

        // PLC 데이터 포인트 조회
        const dataPointsResponse = await fetch('http://localhost:3001/api/plc/datapoints', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (dataPointsResponse.ok) {
          const dataPointsData = await dataPointsResponse.json();
          setPlcDataPoints(dataPointsData.data);
        }
      } catch (error) {
        console.error('Error loading PLC data:', error);
        toast.error('PLC 데이터를 불러오는데 실패했습니다.');
      } finally {
        setPlcLoading(false);
      }
    };

    if (activeTab === 'plc') {
      loadPlcData();
    }
  }, [activeTab]);

  // PLC 새로고침
  const handlePlcRefresh = async () => {
    setPlcLoading(true);
    try {
      // Supabase 세션에서 토큰 추출
      const supabaseSession = localStorage.getItem('supabase_session');
      if (!supabaseSession) {
        toast.error('로그인이 필요합니다.');
        return;
      }
      
      const session = JSON.parse(supabaseSession);
      const token = session?.access_token;
      if (!token) {
        toast.error('유효한 토큰이 없습니다.');
        return;
      }
      
      // PLC 연결 상태 조회
      const connectionsResponse = await fetch('http://localhost:3001/api/plc/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setPlcConnections(connectionsData.data);
      }

      // PLC 데이터 포인트 조회
      const dataPointsResponse = await fetch('http://localhost:3001/api/plc/datapoints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (dataPointsResponse.ok) {
        const dataPointsData = await dataPointsResponse.json();
        setPlcDataPoints(dataPointsData.data);
      }
      
      toast.success('PLC 연결 상태를 새로고침했습니다.');
    } catch (error) {
      console.error('Error refreshing PLC data:', error);
      toast.error('PLC 데이터 새로고침에 실패했습니다.');
    } finally {
      setPlcLoading(false);
    }
  };

  const tabs = [
    { id: 'users', label: t('admin.userManagement'), icon: FiUsers },
    { id: 'system', label: t('admin.systemStatus'), icon: FiMonitor },
    { id: 'pages', label: t('admin.pageStatus'), icon: FiActivity },
    { id: 'product-groups', label: t('admin.productGroups'), icon: FiPackage },
    { id: 'status-management', label: t('admin.statusManagement'), icon: FiToggleLeft },
    { id: 'plc', label: t('admin.plcData'), icon: FiCpu },
    { id: 'line', label: t('admin.lineNotifications'), icon: FiMessageSquare },
    { id: 'apikeys', label: t('admin.apiKeys'), icon: FiKey },
    { id: 'settings', label: t('admin.systemSettings'), icon: FiSettings }
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-500/20';
      case 'manager': return 'text-blue-400 bg-blue-500/20';
      case 'operator': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
      case 'connected': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error':
      case 'inactive':
      case 'disconnected': return 'text-red-400 bg-red-500/20';
      case 'maintenance': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPlcStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <FiWifi className="text-green-400" />;
      case 'disconnected': return <FiWifiOff className="text-red-400" />;
      case 'warning': return <FiWifi className="text-yellow-400" />;
      default: return <FiWifiOff className="text-gray-400" />;
    }
  };

  const getPlcStatusText = (status) => {
    switch (status) {
      case 'connected': return '연결됨';
      case 'disconnected': return '연결 끊김';
      case 'warning': return '경고';
      default: return '알 수 없음';
    }
  };

  // LINE 설정 저장
  const handleSaveLineConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/line/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lineConfig)
      });

      if (response.ok) {
        toast.success('LINE 설정이 저장되었습니다.');
      } else {
        throw new Error('설정 저장 실패');
      }
    } catch (error) {
      toast.error('설정 저장에 실패했습니다.');
      console.error('LINE config save error:', error);
    }
  };

  // LINE 연결 테스트
  const handleTestLineConnection = async () => {
    setLineTestLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/line/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelAccessToken: lineConfig.channelAccessToken,
          channelSecret: lineConfig.channelSecret,
          groupId: lineConfig.groupId
        })
      });

      const result = await response.json();
      
      setLineConfig(prev => ({
        ...prev,
        lastTestTime: new Date().toISOString(),
        lastTestResult: result.success
      }));

      if (result.success) {
        toast.success('LINE 연결 테스트 성공!');
      } else {
        toast.error(`연결 테스트 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      toast.error('연결 테스트에 실패했습니다.');
      console.error('LINE test error:', error);
      setLineConfig(prev => ({
        ...prev,
        lastTestTime: new Date().toISOString(),
        lastTestResult: false
      }));
    }
    setLineTestLoading(false);
  };

  // 테스트 알림 전송
  const handleSendTestNotification = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/line/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('테스트 알림이 전송되었습니다.');
      } else {
        throw new Error('알림 전송 실패');
      }
    } catch (error) {
      toast.error('테스트 알림 전송에 실패했습니다.');
      console.error('LINE test notification error:', error);
    }
  };

  // 제품 그룹 관리 함수들
  const handleAddProductGroup = () => {
    setEditingProductGroup(null);
    setProductGroupForm({
      code: '',
      name: '',
      description: '',
      pattern: '',
      active: true
    });
    setShowProductGroupModal(true);
  };

  const handleEditProductGroup = (group) => {
    setEditingProductGroup(group);
    setProductGroupForm({
      code: group.code,
      name: group.name,
      description: group.description,
      pattern: group.pattern,
      active: group.active
    });
    setShowProductGroupModal(true);
  };

  const handleSaveProductGroup = () => {
    if (!productGroupForm.code || !productGroupForm.name) {
      toast.error(t('admin.productGroupRequired'));
      return;
    }

    if (editingProductGroup) {
      // 수정
      setProductGroups(prev => prev.map(group => 
        group.id === editingProductGroup.id 
          ? { 
              ...group, 
              ...productGroupForm,
              pattern: productGroupForm.pattern || `/${productGroupForm.code}/`
            }
          : group
      ));
      toast.success(t('admin.productGroupUpdated'));
    } else {
      // 추가
      const newGroup = {
        id: Math.max(...productGroups.map(g => g.id)) + 1,
        ...productGroupForm,
        pattern: productGroupForm.pattern || `/${productGroupForm.code}/`,
        createdAt: new Date().toISOString()
      };
      setProductGroups(prev => [...prev, newGroup]);
      toast.success(t('admin.productGroupAdded'));
    }

    setShowProductGroupModal(false);
  };

  const handleDeleteProductGroup = (group) => {
    if (window.confirm(t('admin.confirmDeleteGroup', { name: group.name, code: group.code }))) {
      setProductGroups(prev => prev.filter(g => g.id !== group.id));
      toast.success(t('admin.productGroupDeleted'));
    }
  };

  const handleToggleProductGroupStatus = (group) => {
    setProductGroups(prev => prev.map(g => 
      g.id === group.id ? { ...g, active: !g.active } : g
    ));
    toast.success(group.active ? t('admin.groupDeactivated') : t('admin.groupActivated'));
  };

  // 상태 관리 함수들
  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusForm({
      name: '',
      label: '',
      color: '#3B82F6',
      description: ''
    });
    setShowStatusModal(true);
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusForm({
      name: status.name,
      label: status.label,
      color: status.color,
      description: status.description
    });
    setShowStatusModal(true);
  };

  const handleSaveStatus = () => {
    if (!statusForm.name || !statusForm.label) {
      toast.error(t('admin.statusRequired'));
      return;
    }

    if (editingStatus) {
      // 수정
      setPageStatuses(prev => ({
        ...prev,
        [selectedStatusPage]: prev[selectedStatusPage].map(status =>
          status.id === editingStatus.id ? { ...status, ...statusForm } : status
        )
      }));
      toast.success(t('admin.statusUpdated'));
    } else {
      // 추가
      const newStatus = {
        id: Math.max(...pageStatuses[selectedStatusPage].map(s => s.id)) + 1,
        ...statusForm
      };
      setPageStatuses(prev => ({
        ...prev,
        [selectedStatusPage]: [...prev[selectedStatusPage], newStatus]
      }));
      toast.success(t('admin.statusAdded'));
    }

    setShowStatusModal(false);
  };

  const handleDeleteStatus = (status) => {
    if (window.confirm(t('admin.confirmDeleteStatus', { label: status.label }))) {
      setPageStatuses(prev => ({
        ...prev,
        [selectedStatusPage]: prev[selectedStatusPage].filter(s => s.id !== status.id)
      }));
      toast.success(t('admin.statusDeleted'));
    }
  };

  // 알림 타입별 한글 변환
  const getNotificationTypeText = (type) => {
    const types = {
      system_alert: '시스템 알림',
      production_alert: '생산 알림',
      quality_alert: '품질 알림',
      maintenance_alert: '유지보수 알림'
    };
    return types[type] || type;
  };

  // 알림 상태별 색상
  const getNotificationStatusColor = (status) => {
    const colors = {
      sent: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      pending: 'text-yellow-600 bg-yellow-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('admin.userManagement')}</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <FiPlus size={16} />
          {t('admin.addUser')}
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white font-medium">{t('admin.user')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.email')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.role')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.department')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.status')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.lastLogin')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user.firstName[0]}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-white/60 text-sm">{user.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white/80">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-white/80">{user.department}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-white/80">
                    {new Date(user.lastLogin).toLocaleString('ko-KR')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                        <FiEdit3 size={16} />
                      </button>
                      <button className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                        <FiEye size={16} />
                      </button>
                      <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('admin.systemStatus')}</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
          <FiRefreshCw size={16} />
          {t('admin.refreshStatus')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(systemStatus).map(([key, status]) => (
          <div key={key} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white capitalize">{key}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                {status.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-white/80">
              {status.latency && <div>지연시간: {status.latency}</div>}
              {status.uptime && <div>가동률: {status.uptime}</div>}
              {status.usage && <div>사용률: {status.usage}</div>}
              {status.lastBackup && <div>마지막 백업: {new Date(status.lastBackup).toLocaleString('ko-KR')}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">API 키 관리</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <FiPlus size={16} />
          API 키 추가
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white font-medium">이름</th>
                <th className="text-left p-4 text-white font-medium">키</th>
                <th className="text-left p-4 text-white font-medium">서비스</th>
                <th className="text-left p-4 text-white font-medium">권한</th>
                <th className="text-left p-4 text-white font-medium">상태</th>
                <th className="text-left p-4 text-white font-medium">마지막 사용</th>
                <th className="text-left p-4 text-white font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map(apiKey => (
                <tr key={apiKey.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{apiKey.name}</td>
                  <td className="p-4">
                    <code className="text-white/80 font-mono text-sm bg-white/10 px-2 py-1 rounded">
                      {apiKey.key.substring(0, 20)}...
                    </code>
                  </td>
                  <td className="p-4 text-white/80 capitalize">{apiKey.service}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {apiKey.permissions.map(perm => (
                        <span key={perm} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(apiKey.status)}`}>
                      {apiKey.status}
                    </span>
                  </td>
                  <td className="p-4 text-white/80">
                    {new Date(apiKey.lastUsed).toLocaleString('ko-KR')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-400 hover:text-blue-300 transition-colors">
                        <FiEdit3 size={16} />
                      </button>
                      <button className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors">
                        <FiEye size={16} />
                      </button>
                      <button className="p-1 text-red-400 hover:text-red-300 transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlcTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">PLC 데이터 관리</h2>
        <button 
          onClick={handlePlcRefresh}
          disabled={plcLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <FiRefreshCw size={16} className={plcLoading ? 'animate-spin' : ''} />
          {plcLoading ? '로딩 중...' : '새로고침'}
        </button>
      </div>

      {/* PLC 연결 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <FiCpu className="text-2xl text-blue-400" />
            <div>
              <p className="text-white/60 text-sm">총 PLC</p>
              <p className="text-xl font-bold text-white">{plcConnections.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <FiWifi className="text-2xl text-green-400" />
            <div>
              <p className="text-white/60 text-sm">연결됨</p>
              <p className="text-xl font-bold text-green-400">
                {plcConnections.filter(plc => plc.status === 'connected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <FiWifiOff className="text-2xl text-red-400" />
            <div>
              <p className="text-white/60 text-sm">연결 끊김</p>
              <p className="text-xl font-bold text-red-400">
                {plcConnections.filter(plc => plc.status === 'disconnected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <FiDatabase className="text-2xl text-purple-400" />
            <div>
              <p className="text-white/60 text-sm">총 데이터포인트</p>
              <p className="text-xl font-bold text-white">
                {plcConnections.reduce((sum, plc) => sum + plc.dataPoints, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PLC 연결 목록 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white font-medium">PLC 이름</th>
                <th className="text-left p-4 text-white font-medium">연결 정보</th>
                <th className="text-left p-4 text-white font-medium">프로토콜</th>
                <th className="text-left p-4 text-white font-medium">상태</th>
                <th className="text-left p-4 text-white font-medium">데이터포인트</th>
                <th className="text-left p-4 text-white font-medium">오류 수</th>
                <th className="text-left p-4 text-white font-medium">마지막 업데이트</th>
                <th className="text-left p-4 text-white font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {plcConnections.map(plc => (
                <tr key={plc.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {getPlcStatusIcon(plc.status)}
                      <div>
                        <div className="text-white font-medium">{plc.name}</div>
                        <div className="text-white/60 text-sm">ID: {plc.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white/80">
                      <div>{plc.ipAddress}:{plc.port}</div>
                    </div>
                  </td>
                  <td className="p-4 text-white/80">{plc.protocol}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(plc.status)}`}>
                      {getPlcStatusText(plc.status)}
                    </span>
                  </td>
                  <td className="p-4 text-white font-medium">{plc.dataPoints}</td>
                  <td className="p-4">
                    <span className={`font-medium ${plc.errorCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {plc.errorCount}
                    </span>
                  </td>
                  <td className="p-4 text-white/80 text-sm">
                    {new Date(plc.lastUpdate).toLocaleString('ko-KR')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toast.success(`${plc.name} 설정을 편집합니다.`)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button 
                        onClick={() => toast.success(`${plc.name} 상세 정보를 확인합니다.`)}
                        className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        <FiEye size={16} />
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            // Supabase 세션에서 토큰 추출
                            const supabaseSession = localStorage.getItem('supabase_session');
                            if (!supabaseSession) {
                              toast.error('로그인이 필요합니다.');
                              return;
                            }
                            
                            const session = JSON.parse(supabaseSession);
                            const token = session?.access_token;
                            if (!token) {
                              toast.error('유효한 토큰이 없습니다.');
                              return;
                            }
                            const response = await fetch(`http://localhost:3001/api/plc/connections/${plc.id}/restart`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            
                            if (response.ok) {
                              toast.success(`${plc.name} 연결을 재시작했습니다.`);
                              handlePlcRefresh();
                            } else {
                              toast.error('PLC 연결 재시작에 실패했습니다.');
                            }
                          } catch (error) {
                            console.error('Error restarting PLC:', error);
                            toast.error('PLC 연결 재시작에 실패했습니다.');
                          }
                        }}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                      >
                        <FiRefreshCw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 실시간 데이터 포인트 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">실시간 데이터 포인트</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plcDataPoints.map(dataPoint => {
            const plc = plcConnections.find(p => p.id === dataPoint.plcId);
            return (
              <div key={dataPoint.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium text-sm">{dataPoint.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    dataPoint.type === 'analog' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {dataPoint.type}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {dataPoint.type === 'digital' ? (dataPoint.value ? 'ON' : 'OFF') : dataPoint.value}
                  {dataPoint.unit && <span className="text-sm text-white/60 ml-1">{dataPoint.unit}</span>}
                </div>
                <div className="text-xs text-white/60">
                  <div>PLC: {plc?.name}</div>
                  <div>주소: {dataPoint.address}</div>
                  <div>업데이트: {new Date(dataPoint.lastUpdate).toLocaleTimeString('ko-KR')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderLineTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">LINE 알림 설정</h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            lineConfig.isEnabled ? 'text-green-400 bg-green-500/20' : 'text-gray-400 bg-gray-500/20'
          }`}>
                              {lineConfig.isEnabled ? t('admin.active') : t('admin.inactive')}
          </span>
          <button 
            onClick={handleSendTestNotification}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FiSend size={16} />
            테스트 알림 전송
          </button>
        </div>
      </div>

      {/* LINE Bot 설정 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiMessageSquare />
          LINE Bot 설정
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 mb-2">Channel Access Token *</label>
            <input
              type="password"
              value={lineConfig.channelAccessToken}
              onChange={(e) => setLineConfig(prev => ({ ...prev, channelAccessToken: e.target.value }))}
              placeholder="LINE Developers에서 발급받은 Channel Access Token을 입력하세요"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
            <p className="text-white/60 text-sm mt-1">LINE Developers에서 발급받은 Channel Access Token을 입력하세요.</p>
          </div>

          <div>
            <label className="block text-white/80 mb-2">Channel Secret *</label>
            <input
              type="password"
              value={lineConfig.channelSecret}
              onChange={(e) => setLineConfig(prev => ({ ...prev, channelSecret: e.target.value }))}
              placeholder="Channel Secret을 입력하세요"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2">그룹 ID (선택)</label>
            <input
              type="text"
              value={lineConfig.groupId}
              onChange={(e) => setLineConfig(prev => ({ ...prev, groupId: e.target.value }))}
              placeholder="Ce966c1c8e8edb38428cf94c5657a89c5"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
            <p className="text-white/60 text-sm mt-1">LINE 그룹에 봇을 추가한 후, 그룹 ID를 입력하세요. 빈 값이면 개별 사용자에게 전송됩니다.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-white/80">
              <input
                type="checkbox"
                checked={lineConfig.isEnabled}
                onChange={(e) => setLineConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              LINE 알림 활성화
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/20">
            <button
              onClick={handleTestLineConnection}
              disabled={lineTestLoading || !lineConfig.channelAccessToken}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {lineTestLoading ? <FiRefreshCw className="animate-spin" size={16} /> : <FiCheck size={16} />}
              {lineTestLoading ? '테스트 중...' : '연결 테스트'}
            </button>
            
            <button
              onClick={handleSaveLineConfig}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiDatabase size={16} />
              설정 저장
            </button>

            {lineConfig.lastTestTime && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>마지막 테스트:</span>
                <span>{new Date(lineConfig.lastTestTime).toLocaleString('ko-KR')}</span>
                {lineConfig.lastTestResult !== null && (
                  lineConfig.lastTestResult ? 
                    <FiCheck className="text-green-400" size={14} /> : 
                    <FiX className="text-red-400" size={14} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 알림 기록 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">최근 알림 기록</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white font-medium">타입</th>
                <th className="text-left p-4 text-white font-medium">제목</th>
                <th className="text-left p-4 text-white font-medium">메시지</th>
                <th className="text-left p-4 text-white font-medium">전송 시간</th>
                <th className="text-left p-4 text-white font-medium">상태</th>
                <th className="text-left p-4 text-white font-medium">수신자</th>
              </tr>
            </thead>
            <tbody>
              {lineNotifications.map(notification => (
                <tr key={notification.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                      {getNotificationTypeText(notification.type)}
                    </span>
                  </td>
                  <td className="p-4 text-white font-medium">{notification.title}</td>
                  <td className="p-4 text-white/80 max-w-xs truncate">{notification.message}</td>
                  <td className="p-4 text-white/80">
                    {new Date(notification.timestamp).toLocaleString('ko-KR')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getNotificationStatusColor(notification.status)}`}>
                      {notification.status === 'sent' ? '전송됨' : notification.status === 'failed' ? '실패' : '대기중'}
                    </span>
                  </td>
                  <td className="p-4 text-white/80">{notification.recipients}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">알림 설정</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-white font-medium">시스템 알림</h4>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 text-blue-600" />
              PLC 연결 상태 변경
            </label>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 text-blue-600" />
              시스템 오류 발생
            </label>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" className="rounded border-white/20 bg-white/10 text-blue-600" />
              데이터베이스 연결 오류
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-medium">생산 알림</h4>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 text-blue-600" />
              생산 목표 달성
            </label>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/10 text-blue-600" />
              품질 이슈 발생
            </label>
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" className="rounded border-white/20 bg-white/10 text-blue-600" />
              설비 유지보수 필요
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPagesTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">페이지별 상태</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(pageStatus).map(([page, status]) => (
          <div key={page} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white capitalize">{page}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                {status.status}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">활성 사용자</span>
                <span className="text-white font-medium">{status.users}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">오류 수</span>
                <span className={`font-medium ${status.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {status.errors}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductGroupsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('admin.productGroupManagement')}</h2>
        <button 
          onClick={handleAddProductGroup}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiPlus size={16} />
          {t('admin.addProductGroup')}
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white font-medium">{t('admin.groupCode')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.groupName')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.description')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.pattern')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.status')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.createdDate')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {productGroups.map(group => (
                <tr key={group.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="text-white font-mono font-medium">{group.code}</span>
                  </td>
                  <td className="p-4 text-white">{group.name}</td>
                  <td className="p-4 text-white/80 text-sm">{group.description}</td>
                  <td className="p-4">
                    <code className="px-2 py-1 bg-white/10 rounded text-white/80 text-sm">{group.pattern}</code>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleProductGroupStatus(group)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        group.active 
                          ? 'text-green-400 bg-green-500/20 hover:bg-green-500/30' 
                          : 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                      }`}
                    >
                      {group.active ? t('admin.active') : t('admin.inactive')}
                    </button>
                  </td>
                  <td className="p-4 text-white/80 text-sm">
                    {new Date(group.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditProductGroup(group)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="수정"
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProductGroup(group)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="삭제"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 제품 그룹 추가/수정 모달 */}
      {showProductGroupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingProductGroup ? t('admin.editExistingGroup') : t('admin.newProductGroup')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">{t('admin.groupCode')}</label>
                <input
                  type="text"
                  value={productGroupForm.code}
                  onChange={(e) => setProductGroupForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.groupCodePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.groupName')}</label>
                <input
                  type="text"
                  value={productGroupForm.name}
                  onChange={(e) => setProductGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.groupNamePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.description')}</label>
                <textarea
                  value={productGroupForm.description}
                  onChange={(e) => setProductGroupForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
                  rows="3"
                  placeholder={t('admin.descriptionPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.pattern')}</label>
                <input
                  type="text"
                  value={productGroupForm.pattern}
                  onChange={(e) => setProductGroupForm(prev => ({ ...prev, pattern: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.patternPlaceholder')}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={productGroupForm.active}
                  onChange={(e) => setProductGroupForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-white/20 bg-white/10 text-blue-600"
                />
                <label htmlFor="active" className="text-white/80">{t('admin.activeStatus')}</label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProductGroupModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveProductGroup}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FiSave size={16} />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatusManagementTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('admin.statusManagementTitle')}</h2>
        <button 
          onClick={handleAddStatus}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiPlus size={16} />
          {t('admin.addStatus')}
        </button>
      </div>

      {/* 페이지 선택 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
        <label className="block text-white/80 mb-2">{t('admin.selectPage')}</label>
        <select 
          value={selectedStatusPage}
          onChange={(e) => setSelectedStatusPage(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
        >
          <option value="production" className="bg-gray-800">{t('admin.productionManagement')}</option>
          <option value="quality" className="bg-gray-800">{t('admin.qualityManagement')}</option>
          <option value="inventory" className="bg-gray-800">{t('admin.inventoryManagement')}</option>
          <option value="equipment" className="bg-gray-800">{t('admin.equipmentManagement')}</option>
        </select>
      </div>

      {/* 상태 목록 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">
            {selectedStatusPage === 'production' && t('admin.productionStatuses')}
            {selectedStatusPage === 'quality' && t('admin.qualityStatuses')}
            {selectedStatusPage === 'inventory' && t('admin.inventoryStatuses')}
            {selectedStatusPage === 'equipment' && t('admin.equipmentStatuses')}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white font-medium">{t('admin.statusName')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.statusLabel')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.color')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.description')}</th>
                <th className="text-left p-4 text-white font-medium">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageStatuses[selectedStatusPage]?.map(status => (
                <tr key={status.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <code className="px-2 py-1 bg-white/10 rounded text-white font-mono text-sm">{status.name}</code>
                  </td>
                  <td className="p-4 text-white">{status.label}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <code className="text-white/80 text-sm">{status.color}</code>
                    </div>
                  </td>
                  <td className="p-4 text-white/80 text-sm">{status.description}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditStatus(status)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="수정"
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStatus(status)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="삭제"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상태 추가/수정 모달 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingStatus ? t('admin.editExistingStatus') : t('admin.newStatus')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">{t('admin.statusName')}</label>
                <input
                  type="text"
                  value={statusForm.name}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.statusNamePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.statusLabel')}</label>
                <input
                  type="text"
                  value={statusForm.label}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.statusLabelPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.color')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 bg-white/10 border border-white/20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={statusForm.color}
                    onChange={(e) => setStatusForm(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.description')}</label>
                <textarea
                  value={statusForm.description}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
                  rows="3"
                  placeholder={t('admin.statusDescriptionPlaceholder')}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveStatus}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FiSave size={16} />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">{t('admin.systemSettings')}</h2>
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 mb-2">{t('admin.systemName')}</label>
            <input
              type="text"
              defaultValue="MES Thailand"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-white/80 mb-2">{t('admin.defaultLanguage')}</label>
            <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400">
              <option value="ko" className="bg-gray-800">{t('admin.korean')}</option>
              <option value="en" className="bg-gray-800">{t('admin.english')}</option>
              <option value="th" className="bg-gray-800">{t('admin.thai')}</option>
              <option value="zh" className="bg-gray-800">{t('admin.chinese')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FiShield className="text-3xl text-red-400" />
              <h1 className="text-3xl font-bold text-white">{t('admin.title')}</h1>
            </div>
            
            {/* 현재 사용자 정보 */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 px-4 py-2">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <div className="text-white font-medium text-sm">{currentUser.name}</div>
                  <div className="text-white/60 text-xs">{currentUser.email}</div>
                </div>
              </div>
              
              <div className="ml-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(currentUser.role)}`}>
                  {currentUser.role === 'admin' ? t('admin.admin') : 
                   currentUser.role === 'manager' ? t('admin.manager') : 
                   currentUser.role === 'operator' ? t('admin.operator') : currentUser.role}
                </span>
              </div>
            </div>
          </div>
          <p className="text-white/70">{t('admin.subtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          key={activeTab}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'system' && renderSystemTab()}
          {activeTab === 'pages' && renderPagesTab()}
          {activeTab === 'product-groups' && renderProductGroupsTab()}
          {activeTab === 'status-management' && renderStatusManagementTab()}
          {activeTab === 'plc' && renderPlcTab()}
          {activeTab === 'line' && renderLineTab()}
          {activeTab === 'apikeys' && renderApiKeysTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanelPage; 