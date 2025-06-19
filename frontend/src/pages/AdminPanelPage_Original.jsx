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
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';
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

  // 상태 관리
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [pageStatus, setPageStatus] = useState({});
  const [productGroups, setProductGroups] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [plcDevices, setPlcDevices] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 모든 데이터 로드
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadPendingUsers(),
        loadSystemStatus(),
        loadPageStatus(),
        loadProductGroups(),
        loadStatusManagement(),
        loadPlcDevices(),
        loadApiKeys()
      ]);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      toast.error('일부 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      const result = await usersAPI.getAllUsers();
      if (result.success) {
        const formattedUsers = result.data.map(user => {
          const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
          return {
            id: user.id,
            email: user.email,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            role: user.role,
            department: user.department,
            position: user.position,
            status: user.is_active ? 'active' : 'inactive',
            lastLogin: user.last_login || user.updated_at
          };
        });
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('사용자 로드 오류:', error);
    }
  };

  // 승인 대기 사용자 로드
  const loadPendingUsers = async () => {
    try {
      const result = await usersAPI.getPendingUsers();
      if (result.success) {
        setPendingUsers(result.data);
      }
    } catch (error) {
      console.error('승인 대기 사용자 로드 오류:', error);
    }
  };

  // 시스템 상태 로드
  const loadSystemStatus = async () => {
    try {
      const start = Date.now();
      const { data: dbTest, error: dbError } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });
      const latency = Date.now() - start;

      setSystemStatus({
        database: { 
          status: dbError ? 'error' : 'healthy', 
          latency: `${latency}ms`,
          records: dbTest?.count || 0
        },
        api: { 
          status: dbError ? 'error' : 'healthy', 
          uptime: '99.9%',
          responseTime: `${latency}ms`
        },
        storage: { 
          status: 'healthy', 
          usage: '45%'
        },
        backup: { 
          status: 'healthy', 
          lastBackup: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('시스템 상태 로드 오류:', error);
    }
  };

  // 페이지별 상태 로드
  const loadPageStatus = async () => {
    try {
      const [products, customers, equipment] = await Promise.all([
        supabase.from('products').select('count', { count: 'exact', head: true }),
        supabase.from('customers').select('count', { count: 'exact', head: true }),
        supabase.from('equipment').select('count', { count: 'exact', head: true })
      ]);

      setPageStatus({
        dashboard: { status: 'active', users: Math.floor(Math.random() * 50) + 10, errors: 0 },
        production: { status: 'active', users: Math.floor(Math.random() * 15) + 5, errors: 0 },
        equipment: { status: equipment.error ? 'error' : 'active', users: Math.floor(Math.random() * 10) + 3, errors: equipment.error ? 1 : 0 },
        quality: { status: 'active', users: Math.floor(Math.random() * 8) + 2, errors: 0 },
        inventory: { status: 'active', users: Math.floor(Math.random() * 12) + 3, errors: 0 },
        reports: { status: 'active', users: Math.floor(Math.random() * 6) + 1, errors: 0 }
      });
    } catch (error) {
      console.error('페이지 상태 로드 오류:', error);
    }
  };

  // 제품 그룹 로드
  const loadProductGroups = async () => {
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select('client, product_code')
        .not('client', 'is', null);

      if (error) throw error;

      const clientGroups = {};
      productData.forEach(product => {
        if (!clientGroups[product.client]) {
          clientGroups[product.client] = { products: [], codes: new Set() };
        }
        clientGroups[product.client].products.push(product);
        
        const codeMatch = product.product_code.match(/([A-Z]+)/g);
        if (codeMatch && codeMatch.length > 1) {
          clientGroups[product.client].codes.add(codeMatch[1]);
        }
      });

      const groups = Object.entries(clientGroups).map(([client, data], index) => ({
        id: index + 1,
        name: client,
        code: Array.from(data.codes).join('/') || 'MIX',
        description: `${client}용 제품 그룹 (${data.products.length}개 제품)`,
        productCount: data.products.length,
        status: 'active',
        createdAt: new Date().toISOString()
      }));

      setProductGroups(groups);
    } catch (error) {
      console.error('제품 그룹 로드 오류:', error);
      setProductGroups([]);
    }
  };

  // 상태 관리 로드
  const loadStatusManagement = async () => {
    try {
      const [products, orders, equipment] = await Promise.all([
        supabase.from('products').select('order_status'),
        supabase.from('work_orders').select('status'),
        supabase.from('equipment').select('status')
      ]);

      const statuses = [];
      
      if (products.data) {
        const uniqueStatuses = [...new Set(products.data.map(p => p.order_status).filter(Boolean))];
        uniqueStatuses.forEach((status, index) => {
          statuses.push({
            id: `product_${index}`,
            type: 'product',
            name: status,
            displayName: getStatusDisplayName(status),
            color: getStatusColor(status),
            description: `제품 ${getStatusDisplayName(status)} 상태`,
            isActive: true
          });
        });
      }

      setStatusList(statuses);
    } catch (error) {
      console.error('상태 관리 로드 오류:', error);
      setStatusList([]);
    }
  };

  // PLC 장치 로드
  const loadPlcDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('plc_devices')
        .select('*')
        .order('device_name');

      if (error) throw error;

      const formattedDevices = data.map(device => ({
        id: device.id,
        name: device.device_name,
        ip: device.ip_address,
        port: device.port,
        type: device.device_type,
        status: device.is_connected ? 'connected' : 'disconnected',
        lastUpdate: device.last_communication || device.updated_at,
        protocol: device.protocol_type,
        tags: device.tag_count || 0,
        description: device.description || '설명 없음'
      }));

      setPlcDevices(formattedDevices);
    } catch (error) {
      console.error('PLC 장치 로드 오류:', error);
      setPlcDevices([]);
    }
  };

  // API 키 로드
  const loadApiKeys = async () => {
    try {
      const keys = [
        {
          id: 1,
          name: 'Supabase Database API',
          key: process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...' || 'Hidden',
          service: 'database',
          status: 'active',
          lastUsed: new Date().toISOString(),
          permissions: ['read', 'write'],
          description: 'Main database access'
        },
        {
          id: 2,
          name: 'Production Monitoring API',
          key: 'pk_prod_' + Math.random().toString(36).substring(2, 15) + '...',
          service: 'production',
          status: 'active',
          lastUsed: new Date(Date.now() - 3600000).toISOString(),
          permissions: ['read'],
          description: 'Production line data access'
        }
      ];

      setApiKeys(keys);
    } catch (error) {
      console.error('API 키 로드 오류:', error);
      setApiKeys([]);
    }
  };

  // 헬퍼 함수들
  const getStatusDisplayName = (status) => {
    const statusMap = {
      'inProcess': '진행중',
      'completed': '완료',
      'pending': '대기',
      'cancelled': '취소',
      'active': '활성',
      'inactive': '비활성',
      'maintenance': '점검중',
      'error': '오류',
      'in_progress': '진행중',
      'planned': '계획됨'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'inProcess': '#3B82F6',
      'in_progress': '#3B82F6',
      'completed': '#10B981',
      'pending': '#F59E0B',
      'cancelled': '#EF4444',
      'active': '#10B981',
      'inactive': '#6B7280',
      'maintenance': '#F59E0B',
      'error': '#EF4444',
      'planned': '#8B5CF6'
    };
    return colorMap[status] || '#6B7280';
  };

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

  // 사용자 관리 상태
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'operator',
    department: '',
    position: '',
    status: 'active'
  });

  // 승인 대기 중인 사용자들
  const [pendingUsers, setPendingUsers] = useState([]);

  // 삭제 확인 대화상자 상태
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '', // 'user', 'group', 'status'
    item: null,
    title: '',
    message: ''
  });

  // PLC 편집 모달 상태
  const [showPlcModal, setShowPlcModal] = useState(false);
  const [editingPlc, setEditingPlc] = useState(null);
  const [plcForm, setPlcForm] = useState({
    name: '',
    ipAddress: '',
    port: 502,
    protocol: 'Modbus TCP',
    status: 'disconnected'
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
  const [plcConnections, setPlcConnections] = useState([
    {
      id: 1,
      name: 'Production Line 1',
      ipAddress: '192.168.1.100',
      port: 502,
      protocol: 'Modbus TCP',
      status: 'connected',
      dataPoints: 25,
      errorCount: 0,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Production Line 2', 
      ipAddress: '192.168.1.101',
      port: 502,
      protocol: 'Modbus TCP',
      status: 'disconnected',
      dataPoints: 0,
      errorCount: 3,
      lastUpdate: new Date(Date.now() - 300000).toISOString()
    }
  ]);

  // PLC 데이터 포인트
  const [plcDataPoints, setPlcDataPoints] = useState([
    {
      id: 1,
      plcId: 1,
      address: 'D100',
      type: 'analog',
      value: 125.4,
      unit: 'V',
      lastUpdate: new Date().toISOString()
    },
    {
      id: 2,
      plcId: 1,
      address: 'M10',
      type: 'digital',
      value: true,
      unit: '',
      lastUpdate: new Date().toISOString()
    }
  ]);
  
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

  const tabs = useMemo(() => {
    // i18n이 완전히 준비되었는지 확인
    if (!ready || !i18n.hasResourceBundle(i18n.language, 'translation')) {
      return [];
    }
    
    return [
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
  }, [t, ready, i18n]);

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

  // PLC 관리 함수들
  const handleEditPlc = (plc) => {
    setEditingPlc(plc);
    setPlcForm({
      name: plc.name,
      ipAddress: plc.ipAddress,
      port: plc.port,
      protocol: plc.protocol,
      status: plc.status
    });
    setShowPlcModal(true);
  };

  const handleSavePlc = () => {
    if (!plcForm.name || !plcForm.ipAddress) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    // PLC 연결 정보 업데이트
    const updatedConnections = plcConnections.map(plc => 
      plc.id === editingPlc.id 
        ? {
            ...plc,
            name: plcForm.name,
            ipAddress: plcForm.ipAddress,
            port: plcForm.port,
            protocol: plcForm.protocol,
            status: plcForm.status
          }
        : plc
    );
    setPlcConnections(updatedConnections);
    
    setShowPlcModal(false);
    setEditingPlc(null);
    toast.success(t('admin.plcUpdated'));
  };

  const handleCancelPlcEdit = () => {
    setShowPlcModal(false);
    setEditingPlc(null);
    setPlcForm({
      name: '',
      ipAddress: '',
      port: 502,
      protocol: 'Modbus TCP',
      status: 'disconnected'
    });
  };

  const handleViewPlcDetails = (plc) => {
    // PLC 상세 정보를 보여주는 토스트 메시지
    const details = `
      PLC 이름: ${plc.name}
      IP 주소: ${plc.ipAddress}:${plc.port}
      프로토콜: ${plc.protocol}
      상태: ${getPlcStatusText(plc.status)}
      데이터포인트: ${plc.dataPoints}개
      오류 수: ${plc.errorCount}
      마지막 업데이트: ${new Date(plc.lastUpdate).toLocaleString('ko-KR')}
    `;
    
    // 더 상세한 정보 표시
    if (window.confirm(`${plc.name} PLC 상세 정보:\n${details}\n\n상세 로그를 콘솔에서 확인하시겠습니까?`)) {
      console.log('PLC 상세 정보:', plc);
      toast.success('PLC 상세 정보가 콘솔에 출력되었습니다.');
    }
  };

  // 사용자 관리 함수들
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'operator',
      department: '',
      position: '',
      status: 'active'
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleViewUser = (user) => {
    toast.success(`${user.firstName} ${user.lastName}의 상세 정보를 확인합니다.`);
  };

  const handleDeleteUser = (user) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'user',
      item: user,
      title: t('admin.confirmDeleteUserTitle'),
      message: t('admin.confirmDeleteUser', { name: `${user.firstName} ${user.lastName}` })
    });
  };

  const handleSaveUser = async () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email) {
      toast.error(t('admin.userRequired'));
      return;
    }

    try {
      if (editingUser) {
        // 수정 - Supabase에 저장
        const result = await usersAPI.update(editingUser.id, userForm);
        if (result.success) {
          // 로컬 state 업데이트
          setUsers(prev => prev.map(user => 
            user.id === editingUser.id 
              ? { 
                  ...user, 
                  firstName: userForm.firstName,
                  lastName: userForm.lastName,
                  email: userForm.email,
                  role: userForm.role,
                  department: userForm.department,
                  position: userForm.position,
                  status: userForm.status
                }
              : user
          ));
          toast.success(t('admin.userUpdated'));
        } else {
          toast.error(`사용자 수정 실패: ${result.error}`);
          return;
        }
      } else {
        // 추가 - Supabase에 저장
        const result = await usersAPI.create(userForm);
        if (result.success) {
          // 로컬 state 업데이트
          const nameParts = result.data.full_name ? result.data.full_name.split(' ') : ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          const newUser = {
            id: result.data.id,
            firstName: firstName,
            lastName: lastName,
            email: result.data.email,
            role: result.data.role,
            department: result.data.department,
            position: result.data.position,
            status: result.data.is_active ? 'active' : 'inactive',
            lastLogin: null
          };
          setUsers(prev => [...prev, newUser]);
          toast.success(t('admin.userAdded'));
        } else {
          toast.error(`사용자 추가 실패: ${result.error}`);
          return;
        }
      }

      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('사용자 저장 오류:', error);
      toast.error('사용자 저장 중 오류가 발생했습니다.');
    }
  };

  // 사용자 승인/거부 함수들
  const handleApproveUser = async (pendingUser) => {
    try {
      // Supabase에서 사용자 승인
      const result = await usersAPI.approveUser(pendingUser.id);
      
      if (result.success) {
        // 승인된 사용자를 기존 사용자 목록에 추가
        const nameParts = result.data.full_name ? result.data.full_name.split(' ') : ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const newUser = {
          id: result.data.id,
          firstName: firstName,
          lastName: lastName,
          email: result.data.email,
          role: result.data.role,
          department: result.data.department,
          position: result.data.position,
          status: result.data.is_active ? 'active' : 'inactive',
          lastLogin: null,
          approvedAt: result.data.approved_at
        };

        setUsers(prev => [...prev, newUser]);
        setPendingUsers(prev => prev.filter(user => user.id !== pendingUser.id));
        
        const userName = pendingUser.user_metadata?.first_name && pendingUser.user_metadata?.last_name 
          ? `${pendingUser.user_metadata.first_name} ${pendingUser.user_metadata.last_name}`
          : pendingUser.email;
        
        toast.success(`${userName}님의 계정이 승인되었습니다.`);
      } else {
        toast.error(`사용자 승인 실패: ${result.error}`);
      }
      
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      toast.error('사용자 승인 중 오류가 발생했습니다.');
    }
  };

  const handleRejectUser = async (pendingUser) => {
    try {
      // Supabase에서 사용자 거부
      const result = await usersAPI.rejectUser(pendingUser.id);
      
      if (result.success) {
        setPendingUsers(prev => prev.filter(user => user.id !== pendingUser.id));
        
        const userName = pendingUser.user_metadata?.first_name && pendingUser.user_metadata?.last_name 
          ? `${pendingUser.user_metadata.first_name} ${pendingUser.user_metadata.last_name}`
          : pendingUser.email;
        
        toast.success(`${userName}님의 계정이 거부되었습니다.`);
      } else {
        toast.error(`사용자 거부 실패: ${result.error}`);
      }
      
    } catch (error) {
      console.error('사용자 거부 오류:', error);
      toast.error('사용자 거부 중 오류가 발생했습니다.');
    }
  };

  const getDepartmentText = (department) => {
    const departments = {
      'production': '생산부',
      'quality': '품질관리부',
      'maintenance': '설비보전부',
      'planning': '생산계획부',
      'engineering': '기술부',
      'management': '경영진'
    };
    return departments[department] || department;
  };

  const getPositionText = (position) => {
    const positions = {
      'operator': '작업자',
      'technician': '기술자',
      'supervisor': '팀장',
      'manager': '부장',
      'director': '이사'
    };
    return positions[position] || position;
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
    setDeleteConfirm({
      isOpen: true,
      type: 'group',
      item: group,
      title: t('admin.confirmDeleteGroupTitle'),
      message: t('admin.confirmDeleteGroup', { name: group.name, code: group.code })
    });
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
    setDeleteConfirm({
      isOpen: true,
      type: 'status',
      item: status,
      title: t('admin.confirmDeleteStatusTitle'),
      message: t('admin.confirmDeleteStatus', { label: status.label })
    });
  };

  // 삭제 확인 처리
  const handleConfirmDelete = async () => {
    const { type, item } = deleteConfirm;
    
    try {
      switch (type) {
        case 'user':
          // Supabase에서 사용자 삭제
          const userResult = await usersAPI.delete(item.id);
          if (userResult.success) {
            setUsers(prev => prev.filter(u => u.id !== item.id));
            toast.success(t('admin.userDeleted'));
          } else {
            toast.error(`${t('admin.userDeleteFailed')}: ${userResult.error}`);
            return;
          }
          break;
        case 'group':
          setProductGroups(prev => prev.filter(g => g.id !== item.id));
          toast.success(t('admin.productGroupDeleted'));
          break;
        case 'status':
          setPageStatuses(prev => ({
            ...prev,
            [selectedStatusPage]: prev[selectedStatusPage].filter(s => s.id !== item.id)
          }));
          toast.success(t('admin.statusDeleted'));
          break;
        default:
          break;
      }
      
      setDeleteConfirm({ isOpen: false, type: '', item: null, title: '', message: '' });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('common.deleteError'));
    }
  };

  // 삭제 취소 처리
  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, type: '', item: null, title: '', message: '' });
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
      {/* 승인 대기 중인 사용자들 */}
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">승인 대기 중인 사용자 ({pendingUsers.length})</h2>
            <div className="flex items-center gap-2 text-yellow-400">
              <FiClock size={16} />
              <span className="text-sm">관리자 승인 필요</span>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 backdrop-blur-lg rounded-xl border border-yellow-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-500/10">
                  <tr>
                    <th className="text-left p-4 text-white font-medium">사용자</th>
                    <th className="text-left p-4 text-white font-medium">이메일</th>
                    <th className="text-left p-4 text-white font-medium">부서/직책</th>
                    <th className="text-left p-4 text-white font-medium">가입일</th>
                    <th className="text-left p-4 text-white font-medium">이메일 인증</th>
                    <th className="text-left p-4 text-white font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="border-t border-yellow-500/20 hover:bg-yellow-500/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-medium">
                            {user.user_metadata.first_name?.[0] || '?'}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {user.user_metadata.first_name} {user.user_metadata.last_name}
                            </div>
                            <div className="text-white/60 text-sm">
                              {getPositionText(user.user_metadata.position)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-white/80">{user.email}</td>
                      <td className="p-4 text-white/80">
                        <div>{getDepartmentText(user.user_metadata.department)}</div>
                        <div className="text-sm text-white/60">
                          {getPositionText(user.user_metadata.position)}
                        </div>
                      </td>
                      <td className="p-4 text-white/80">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        <div className="text-sm text-white/60">
                          {Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))}일 전
                        </div>
                      </td>
                      <td className="p-4">
                        {user.email_confirmed_at ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <FiCheckCircle size={14} />
                            인증 완료
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400 text-sm">
                            <FiClock size={14} />
                            인증 대기
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleApproveUser(user)}
                            disabled={!user.email_confirmed_at}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              user.email_confirmed_at 
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                            title={user.email_confirmed_at ? '사용자 승인' : '이메일 인증 후 승인 가능'}
                          >
                            ✓ 승인
                          </button>
                          <button 
                            onClick={() => handleRejectUser(user)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                            title="사용자 거부"
                          >
                            ✗ 거부
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
      )}

      {/* 기존 사용자 관리 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('admin.userManagement')}</h2>
        <button 
          onClick={handleAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
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
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title={t('admin.editUser')}
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                        title={t('admin.viewUser')}
                      >
                        <FiEye size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title={t('admin.deleteUser')}
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
                        onClick={() => handleEditPlc(plc)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="PLC 설정 편집"
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleViewPlcDetails(plc)}
                        className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="PLC 상세 정보 보기"
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
                  <h4 className="text-white font-medium text-sm">{dataPoint.address}</h4>
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

      {/* 사용자 관리 모달 */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingUser ? t('admin.editUser') : t('admin.addUser')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">{t('admin.firstName')}</label>
                <input
                  type="text"
                  value={userForm.firstName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.firstNamePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.lastName')}</label>
                <input
                  type="text"
                  value={userForm.lastName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.lastNamePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.email')}</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.emailPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.role')}</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="admin" className="bg-gray-800">{t('admin.admin')}</option>
                  <option value="manager" className="bg-gray-800">{t('admin.manager')}</option>
                  <option value="operator" className="bg-gray-800">{t('admin.operator')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.department')}</label>
                <input
                  type="text"
                  value={userForm.department}
                  onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.departmentPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.position')}</label>
                <input
                  type="text"
                  value={userForm.position}
                  onChange={(e) => setUserForm(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.positionPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.status')}</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="active" className="bg-gray-800">{t('admin.active')}</option>
                  <option value="inactive" className="bg-gray-800">{t('admin.inactive')}</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FiSave size={16} />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLC 편집 모달 */}
      {showPlcModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t('admin.editPlc')} - {editingPlc?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">{t('admin.plcName')}</label>
                <input
                  type="text"
                  value={plcForm.name}
                  onChange={(e) => setPlcForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder={t('admin.plcNamePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.ipAddress')}</label>
                <input
                  type="text"
                  value={plcForm.ipAddress}
                  onChange={(e) => setPlcForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder="192.168.1.100"
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.port')}</label>
                <input
                  type="number"
                  value={plcForm.port}
                  onChange={(e) => setPlcForm(prev => ({ ...prev, port: parseInt(e.target.value) || 502 }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  placeholder="502"
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.protocol')}</label>
                <select
                  value={plcForm.protocol}
                  onChange={(e) => setPlcForm(prev => ({ ...prev, protocol: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="Modbus TCP" className="bg-gray-800">Modbus TCP</option>
                  <option value="Ethernet/IP" className="bg-gray-800">Ethernet/IP</option>
                  <option value="OPC UA" className="bg-gray-800">OPC UA</option>
                  <option value="Profinet" className="bg-gray-800">Profinet</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">{t('admin.connectionStatus')}</label>
                <select
                  value={plcForm.status}
                  onChange={(e) => setPlcForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="connected" className="bg-gray-800">{t('admin.connected')}</option>
                  <option value="disconnected" className="bg-gray-800">{t('admin.disconnected')}</option>
                  <option value="warning" className="bg-gray-800">{t('admin.warning')}</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelPlcEdit}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSavePlc}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FiSave size={16} />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 대화상자 */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText={t('admin.deleteButton')}
        cancelText={t('admin.cancelButton')}
        type="danger"
      />
    </div>
  );
};

export default AdminPanelPage; 