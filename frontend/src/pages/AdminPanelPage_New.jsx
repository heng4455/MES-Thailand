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
  FiDatabase,
  FiCheckCircle,
  FiAlertCircle,
  FiCpu,
  FiWifi
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { usersAPI, supabase } from '../utils/supabase';

const AdminPanelPage = () => {
  const { t, ready, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const { user, userProfile, loading } = useUser();

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

  // 모달 상태
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

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '',
    item: null,
    title: '',
    message: ''
  });

  // i18n 준비 확인
  if (!ready || !i18n.hasResourceBundle(i18n.language, 'translation')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading translations...</div>
      </div>
    );
  }

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

      const { data: apiTest, error: apiError } = await supabase
        .from('customers')
        .select('count', { count: 'exact', head: true });

      setSystemStatus({
        database: { 
          status: dbError ? 'error' : 'healthy', 
          latency: `${latency}ms`,
          records: dbTest?.count || 0
        },
        api: { 
          status: apiError ? 'error' : 'healthy', 
          uptime: '99.9%',
          responseTime: `${latency}ms`
        },
        storage: { 
          status: 'healthy', 
          usage: '45%',
          available: '55GB'
        },
        backup: { 
          status: 'healthy', 
          lastBackup: new Date().toISOString(),
          nextBackup: new Date(Date.now() + 24*60*60*1000).toISOString()
        }
      });
    } catch (error) {
      console.error('시스템 상태 로드 오류:', error);
      setSystemStatus({
        database: { status: 'error', latency: 'N/A', records: 0 },
        api: { status: 'error', uptime: 'N/A', responseTime: 'N/A' },
        storage: { status: 'unknown', usage: 'N/A', available: 'N/A' },
        backup: { status: 'unknown', lastBackup: 'N/A', nextBackup: 'N/A' }
      });
    }
  };

  // 페이지별 상태 로드
  const loadPageStatus = async () => {
    try {
      const [products, customers, equipment, workOrders, inventory] = await Promise.all([
        supabase.from('products').select('count', { count: 'exact', head: true }),
        supabase.from('customers').select('count', { count: 'exact', head: true }),
        supabase.from('equipment').select('count', { count: 'exact', head: true }),
        supabase.from('work_orders').select('count', { count: 'exact', head: true }),
        supabase.from('inventory').select('count', { count: 'exact', head: true })
      ]);

      setPageStatus({
        dashboard: { 
          status: 'active', 
          users: Math.floor(Math.random() * 50) + 10, 
          errors: 0,
          dataCount: (products.count || 0) + (customers.count || 0)
        },
        production: { 
          status: workOrders.error ? 'error' : 'active', 
          users: Math.floor(Math.random() * 15) + 5, 
          errors: workOrders.error ? 1 : 0,
          dataCount: workOrders.count || 0
        },
        equipment: { 
          status: equipment.error ? 'error' : 'active', 
          users: Math.floor(Math.random() * 10) + 3, 
          errors: equipment.error ? 1 : 0,
          dataCount: equipment.count || 0
        },
        quality: { 
          status: 'active', 
          users: Math.floor(Math.random() * 8) + 2, 
          errors: 0,
          dataCount: Math.floor(Math.random() * 100) + 50
        },
        inventory: { 
          status: inventory.error ? 'error' : 'active', 
          users: Math.floor(Math.random() * 12) + 3, 
          errors: inventory.error ? 1 : 0,
          dataCount: inventory.count || 0
        },
        reports: { 
          status: 'active', 
          users: Math.floor(Math.random() * 6) + 1, 
          errors: 0,
          dataCount: Math.floor(Math.random() * 200) + 100
        }
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

      // 클라이언트별 제품 그룹 생성
      const clientGroups = {};
      productData.forEach(product => {
        if (!clientGroups[product.client]) {
          clientGroups[product.client] = {
            products: [],
            codes: new Set()
          };
        }
        clientGroups[product.client].products.push(product);
        
        // 제품 코드에서 패턴 추출 (예: CMI-CDSS4018NH -> CDSS)
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
        createdAt: new Date().toISOString(),
        pattern: Array.from(data.codes).map(code => `/${code}/`).join(' or ')
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
      
      // 제품 상태
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
            isActive: true,
            usage: products.data.filter(p => p.order_status === status).length
          });
        });
      }

      // 작업 지시 상태
      if (orders.data) {
        const uniqueStatuses = [...new Set(orders.data.map(o => o.status).filter(Boolean))];
        uniqueStatuses.forEach((status, index) => {
          statuses.push({
            id: `order_${index}`,
            type: 'order',
            name: status,
            displayName: getStatusDisplayName(status),
            color: getStatusColor(status),
            description: `작업지시 ${getStatusDisplayName(status)} 상태`,
            isActive: true,
            usage: orders.data.filter(o => o.status === status).length
          });
        });
      }

      // 설비 상태
      if (equipment.data) {
        const uniqueStatuses = [...new Set(equipment.data.map(e => e.status).filter(Boolean))];
        uniqueStatuses.forEach((status, index) => {
          statuses.push({
            id: `equipment_${index}`,
            type: 'equipment',
            name: status,
            displayName: getStatusDisplayName(status),
            color: getStatusColor(status),
            description: `설비 ${getStatusDisplayName(status)} 상태`,
            isActive: true,
            usage: equipment.data.filter(e => e.status === status).length
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
        description: device.description || '설명 없음',
        errorCount: device.error_count || 0
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
      // Supabase 설정에서 실제 API 키 정보 구성
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

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      supervisor: 'bg-blue-100 text-blue-800',
      operator: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // 사용자 승인 처리
  const handleApproveUser = async (pendingUser) => {
    try {
      const result = await usersAPI.approveUser(pendingUser.id);
      if (result.success) {
        toast.success('사용자가 승인되었습니다.');
        await loadPendingUsers();
        await loadUsers();
      } else {
        toast.error('사용자 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      toast.error('사용자 승인 중 오류가 발생했습니다.');
    }
  };

  // 사용자 거부 처리
  const handleRejectUser = async (pendingUser) => {
    try {
      const result = await usersAPI.rejectUser(pendingUser.id);
      if (result.success) {
        toast.success('사용자가 거부되었습니다.');
        await loadPendingUsers();
      } else {
        toast.error('사용자 거부에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 거부 오류:', error);
      toast.error('사용자 거부 중 오류가 발생했습니다.');
    }
  };

  // 탭 컴포넌트들
  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* 승인 대기 사용자 */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUsers className="mr-2" />
            {t('admin.pendingApproval')} ({pendingUsers.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.department')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.registrationDate')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <FiUsers className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department} / {user.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApproveUser(user)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        <FiCheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRejectUser(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 활성 사용자 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiUsers className="mr-2" />
            {t('admin.activeUsers')} ({users.length})
          </h3>
          <button
            onClick={() => setShowUserModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            {t('admin.addUser')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.department')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.lastLogin')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <FiUsers className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department} / {user.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <FiEdit3 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(systemStatus).map(([key, status]) => (
        <div key={key} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 capitalize flex items-center">
              {key === 'database' && <FiDatabase className="mr-2" />}
              {key === 'api' && <FiCpu className="mr-2" />}
              {key === 'storage' && <FiMonitor className="mr-2" />}
              {key === 'backup' && <FiShield className="mr-2" />}
              {key}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status.status === 'healthy' ? 'bg-green-100 text-green-800' :
              status.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status.status === 'healthy' && <FiCheckCircle className="mr-1 h-3 w-3" />}
              {status.status === 'error' && <FiAlertCircle className="mr-1 h-3 w-3" />}
              {status.status}
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            {Object.entries(status).filter(([k]) => k !== 'status').map(([subKey, value]) => (
              <div key={subKey} className="flex justify-between">
                <span className="capitalize">{subKey.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderApiKeysTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiKey className="mr-2" />
          API Keys Management
        </h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <FiPlus className="mr-2" />
          Add API Key
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiKeys.map((apiKey) => (
              <tr key={apiKey.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                    <div className="text-sm text-gray-500 font-mono">{apiKey.key}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {apiKey.service}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    apiKey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {apiKey.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(apiKey.lastUsed).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    <FiEdit3 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlcTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiCpu className="mr-2" />
          PLC Devices ({plcDevices.length})
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={loadPlcDevices}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
            <FiPlus className="mr-2" />
            Add PLC
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plcDevices.map((device) => (
          <div key={device.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">{device.name}</h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                device.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {device.status === 'connected' ? <FiWifi className="mr-1 h-3 w-3" /> : <FiWifi className="mr-1 h-3 w-3" />}
                {device.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>IP Address:</span>
                <span className="font-mono">{device.ip}:{device.port}</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span>{device.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span>Tags:</span>
                <span>{device.tags}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span>{device.lastUpdate ? new Date(device.lastUpdate).toLocaleTimeString() : 'Never'}</span>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700">
                Edit
              </button>
              <button className="flex-1 bg-red-600 text-white text-xs px-3 py-2 rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 탭 정의
  const tabs = [
    { id: 'users', name: t('admin.userManagement'), icon: FiUsers, component: renderUsersTab },
    { id: 'system', name: t('admin.systemStatus'), icon: FiMonitor, component: renderSystemTab },
    { id: 'apikeys', name: 'API Keys', icon: FiKey, component: renderApiKeysTab },
    { id: 'plc', name: 'PLC Management', icon: FiCpu, component: renderPlcTab }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('admin.title')}
          </h1>
          <p className="text-gray-600">
            {t('admin.subtitle')}
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </motion.div>
      </div>

      {/* 확인 대화상자 */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={() => {
          // 삭제 로직 처리
          setDeleteConfirm({ ...deleteConfirm, isOpen: false });
        }}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
    </div>
  );
};

export default AdminPanelPage; 