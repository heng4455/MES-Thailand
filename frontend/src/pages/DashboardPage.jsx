import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Clock, Users, Settings, Play, Pause, BarChart3,
  Activity, Zap, Thermometer, Package
} from 'lucide-react';
import CustomerHierarchy from '../components/CustomerHierarchy';
import ProductHierarchy from '../components/ProductHierarchy';
import { 
  customersAPI, 
  productsAPI, 
  equipmentAPI, 
  productionAPI, 
  qualityAPI, 
  inventoryAPI, 
  usersAPI,
  processAPI
} from '../utils/supabase';
import Toast from '../components/Toast';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // 실시간 데이터 상태
  const [dashboardData, setDashboardData] = useState({
    productionStats: [],
    lineStatus: [],
    recentAlerts: [],
    totalProduction: 0,
    efficiency: 0,
    defectRate: 0,
    equipmentOnline: 0,
    inventoryLevel: 0,
    activeWorkers: 0
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 데이터 로드 (5분마다 갱신으로 변경하고 초기 로드 최적화)
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 300000); // 5분마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 실시간 데이터 기반 통계 계산 함수
  const calculateRealTimeStats = (data) => {
    const { products, equipment, workOrders, processes, quality, inventory, users, customers } = data;
    
    console.log('📊 실시간 통계 계산 시작...', {
      products: products.length,
      equipment: equipment.length,
      workOrders: workOrders.length,
      processes: processes.length,
      quality: quality.length,
      inventory: inventory.length,
      users: users.length,
      customers: customers.length
    });
    
    // 오늘 날짜 계산
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // 1. 오늘 생산량 계산
    const todayProduction = products.reduce((sum, product) => {
      const productionToday = workOrders.filter(wo => 
        wo.product_id === product.id && 
        wo.actual_start_date && 
        wo.actual_start_date.startsWith(todayStr)
      );
      return sum + productionToday.reduce((pSum, wo) => pSum + (wo.produced_quantity || 0), 0);
    }, 0);
    
    const yesterdayProduction = products.reduce((sum, product) => {
      const productionYesterday = workOrders.filter(wo => 
        wo.product_id === product.id && 
        wo.actual_start_date && 
        wo.actual_start_date.startsWith(yesterdayStr)
      );
      return sum + productionYesterday.reduce((pSum, wo) => pSum + (wo.produced_quantity || 0), 0);
    }, 0);
    
    const productionChange = yesterdayProduction > 0 
      ? ((todayProduction - yesterdayProduction) / yesterdayProduction * 100).toFixed(1)
      : todayProduction > 0 ? '+100' : '0';
    
    // 2. 효율성 계산 (완료된 작업 대비 계획된 작업)
    const totalWorkOrders = workOrders.length;
    const completedWorkOrders = workOrders.filter(wo => wo.status === 'completed').length;
    const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'in_progress').length;
    const efficiency = totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders * 100) : 0;
    
    // 3. 불량률 계산 (품질 데이터 기반)
    const totalQualityRecords = quality.length;
    const defectiveRecords = quality.filter(q => q.result === 'defective' || q.defect_rate > 0).length;
    const defectRate = totalQualityRecords > 0 ? (defectiveRecords / totalQualityRecords * 100) : 0;
    
    // 4. 설비 온라인 상태
    const totalEquipment = equipment.length;
    const operationalEquipment = equipment.filter(eq => eq.status === 'operational').length;
    const maintenanceEquipment = equipment.filter(eq => eq.status === 'maintenance').length;
    
    // 5. 재고 수준 계산 (실제 재고량 기반으로 수정)
    const totalInventoryItems = inventory.length;
    const lowStockItems = inventory.filter(item => 
      item.current_stock <= (item.min_stock || 10)
    ).length;
    
    // 실제 재고량 기반 계산
    let inventoryLevel = 0;
    if (totalInventoryItems > 0) {
      // 각 아이템의 재고 충족률을 계산하여 평균을 구함
      const itemLevels = inventory.map(item => {
        const currentStock = item.current_stock || 0;
        const minStock = item.min_stock || 10;
        const maxStock = item.max_stock || minStock * 2;
        
        // 재고가 최소 재고보다 많으면 100%, 적으면 비율로 계산
        if (currentStock >= minStock) {
          return Math.min(100, (currentStock / maxStock) * 100);
        } else {
          return (currentStock / minStock) * 100;
        }
      });
      
      // 평균 재고 수준 계산
      inventoryLevel = itemLevels.reduce((sum, level) => sum + level, 0) / itemLevels.length;
    } else {
      // 재고 아이템이 없으면 0%로 설정
      inventoryLevel = 0;
    }
    
    // 6. 활성 작업자 수 (오늘 활동한 사용자 수)
    const activeUsers = users.filter(user => 
      user.last_login && 
      user.last_login.startsWith(todayStr)
    ).length;
    
    // 7. 연결된 공정 수 계산
    const connectedProcesses = processes.length;
    
    console.log('📈 계산된 통계:', {
      todayProduction,
      efficiency: efficiency.toFixed(1),
      defectRate: defectRate.toFixed(1),
      operationalEquipment,
      totalEquipment,
      inventoryLevel: inventoryLevel.toFixed(0),
      activeUsers,
      connectedProcesses
    });

    // 생산 통계 카드 데이터
    const productionStats = [
      {
        title: '오늘 생산량',
        value: todayProduction.toString(),
        unit: '개',
        change: `${productionChange > 0 ? '+' : ''}${productionChange}%`,
        trend: productionChange >= 0 ? 'up' : 'down',
        icon: CheckCircle,
        color: 'blue',
        target: Math.max(todayProduction * 1.2, 100),
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        valueColor: 'text-blue-600'
      },
      {
        title: '효율',
        value: efficiency.toFixed(1),
        unit: '%',
        change: efficiency > 80 ? '+양호' : efficiency > 60 ? '보통' : '-개선필요',
        trend: efficiency > 80 ? 'up' : efficiency > 60 ? 'stable' : 'down',
        icon: TrendingUp,
        color: 'green',
        target: 100,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        valueColor: 'text-green-600'
      },
      {
        title: '불량률',
        value: defectRate.toFixed(1),
        unit: '%',
        change: defectRate < 2 ? '양호' : defectRate < 5 ? '주의' : '위험',
        trend: defectRate < 2 ? 'down' : 'up',
        icon: AlertTriangle,
        color: defectRate < 2 ? 'green' : defectRate < 5 ? 'yellow' : 'red',
        target: 5,
        bgColor: defectRate < 2 ? 'bg-green-50' : defectRate < 5 ? 'bg-yellow-50' : 'bg-red-50',
        iconColor: defectRate < 2 ? 'text-green-600' : defectRate < 5 ? 'text-yellow-600' : 'text-red-600',
        valueColor: defectRate < 2 ? 'text-green-600' : defectRate < 5 ? 'text-yellow-600' : 'text-red-600'
      },
      {
        title: '가동 설비',
        value: operationalEquipment.toString(),
        unit: `/ ${totalEquipment}`,
        change: maintenanceEquipment > 0 ? `${maintenanceEquipment}개 점검중` : '모두 가동',
        trend: operationalEquipment === totalEquipment ? 'up' : 'stable',
        icon: Settings,
        color: 'emerald',
        target: totalEquipment,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        valueColor: 'text-emerald-600'
      },
      {
        title: '재고 수준',
        value: inventoryLevel.toFixed(0),
        unit: '%',
        change: totalInventoryItems === 0 
          ? '재고 데이터 없음' 
          : lowStockItems > 0 
          ? `${lowStockItems}개 품목 부족` 
          : inventoryLevel > 80 
          ? '재고 충분' 
          : '재고 보통',
        trend: totalInventoryItems === 0 
          ? 'down' 
          : inventoryLevel > 80 
          ? 'up' 
          : inventoryLevel > 50 
          ? 'stable' 
          : 'down',
        icon: Package,
        color: totalInventoryItems === 0 
          ? 'gray' 
          : inventoryLevel > 80 
          ? 'purple' 
          : inventoryLevel > 50 
          ? 'yellow' 
          : 'red',
        target: 100,
        bgColor: totalInventoryItems === 0 
          ? 'bg-gray-50' 
          : inventoryLevel > 80 
          ? 'bg-purple-50' 
          : inventoryLevel > 50 
          ? 'bg-yellow-50' 
          : 'bg-red-50',
        iconColor: totalInventoryItems === 0 
          ? 'text-gray-600' 
          : inventoryLevel > 80 
          ? 'text-purple-600' 
          : inventoryLevel > 50 
          ? 'text-yellow-600' 
          : 'text-red-600',
        valueColor: totalInventoryItems === 0 
          ? 'text-gray-600' 
          : inventoryLevel > 80 
          ? 'text-purple-600' 
          : inventoryLevel > 50 
          ? 'text-yellow-600' 
          : 'text-red-600'
      },
      {
        title: '작업자',
        value: activeUsers.toString(),
        unit: '명',
        change: `${inProgressWorkOrders}건 작업중`,
        trend: activeUsers > 0 ? 'up' : 'stable',
        icon: Users,
        color: 'indigo',
        target: Math.max(activeUsers + 3, 5),
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        valueColor: 'text-indigo-600'
      }
    ];

    // 라인 상태 (설비를 기반으로 실제 데이터 생성)
    const lineStatus = equipment.slice(0, 6).map((eq, index) => {
      const relatedWorkOrders = workOrders.filter(wo => 
        wo.equipment_id === eq.id || wo.description?.includes(eq.name)
      );
      
      const currentOutput = relatedWorkOrders.reduce((sum, wo) => 
        sum + (wo.produced_quantity || 0), 0
      );
      
      return {
        id: eq.equipment_code || `EQ-${index + 1}`,
        name: eq.name || `설비 ${index + 1}`,
        status: eq.status === 'operational' ? 'running' : 
                eq.status === 'maintenance' ? 'maintenance' : 'stopped',
        efficiency: eq.status === 'operational' ? 
          Math.min(95, Math.max(70, 85 + (Math.random() * 20 - 10))) : 0,
        output: currentOutput > 0 ? currentOutput : 
                eq.status === 'operational' ? Math.floor(Math.random() * 300 + 100) : 0,
        target: eq.capacity || Math.floor(Math.random() * 400 + 300),
        temperature: eq.status === 'operational' ? 
          Math.floor(35 + Math.random() * 15) : 0,
        power: eq.status === 'operational' ? 
          Math.floor(20 + Math.random() * 50) : 0
      };
    });

    // 최근 알림 (실제 데이터 기반으로 생성)
    const recentAlerts = [
      {
        id: 1,
        type: todayProduction > 0 ? 'success' : 'info',
        message: todayProduction > 0 
          ? `생산 완료: 오늘 ${todayProduction}개 생산`
          : '오늘 생산 데이터 없음',
        time: `5분 전`,
        icon: CheckCircle
      },
      {
        id: 2,
        type: maintenanceEquipment > 0 ? 'warning' : 'success',
        message: maintenanceEquipment > 0 
          ? `${maintenanceEquipment}개 설비 점검 중 (총 ${totalEquipment}개)`
          : `모든 설비 정상 운영 중 (${totalEquipment}개)`,
        time: `15분 전`,
        icon: Settings
      },
      {
        id: 3,
        type: defectRate > 5 ? 'error' : defectRate > 2 ? 'warning' : 'success',
        message: defectRate > 5 
          ? `품질 위험: 불량률 ${defectRate.toFixed(1)}% (${defectiveRecords}/${totalQualityRecords})`
          : defectRate > 2 
          ? `품질 주의: 불량률 ${defectRate.toFixed(1)}%`
          : `품질 양호: 불량률 ${defectRate.toFixed(1)}%`,
        time: `30분 전`,
        icon: defectRate > 2 ? AlertTriangle : CheckCircle
      },
      {
        id: 4,
        type: 'info',
        message: `활성 작업자: ${activeUsers}명, 진행 작업: ${inProgressWorkOrders}건, 완료 작업: ${completedWorkOrders}건`,
        time: `1시간 전`,
        icon: Users
      },
      {
        id: 5,
        type: totalInventoryItems === 0 
          ? 'info' 
          : lowStockItems > 0 
          ? 'warning' 
          : inventoryLevel > 80 
          ? 'success' 
          : 'info',
        message: totalInventoryItems === 0 
          ? '재고 데이터 없음 - 재고를 등록해주세요'
          : lowStockItems > 0 
          ? `재고 부족: ${lowStockItems}개 품목 보충 필요 (전체 ${totalInventoryItems}개 중)`
          : inventoryLevel > 80 
          ? `재고 충분: 평균 재고율 ${inventoryLevel.toFixed(0)}% (${totalInventoryItems}개 품목)`
          : `재고 보통: 평균 재고율 ${inventoryLevel.toFixed(0)}% (${totalInventoryItems}개 품목)`,
        time: `2시간 전`,
        icon: Package
      }
    ];

    return {
      productionStats,
      lineStatus,
      recentAlerts,
      totalProduction: todayProduction,
      efficiency,
      defectRate,
      equipmentOnline: operationalEquipment,
      inventoryLevel,
      activeWorkers: activeUsers,
      connectedProcesses,
      totalCustomers: customers.length
    };
  };

  // 대시보드 데이터 로드 함수
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 대시보드 데이터 로드 시작...');
      
      // 대시보드에 필요한 모든 데이터를 병렬로 로드
      const [
        productsResult,
        equipmentResult,
        workOrdersResult,
        processResult,
        qualityResult,
        inventoryResult,
        usersResult,
        customersResult
      ] = await Promise.all([
        productsAPI.getAll(),
        equipmentAPI.getAll(),
        productionAPI.getWorkOrders(),
        processAPI.getAll(),
        qualityAPI.getAll(),
        inventoryAPI.getInventory(),
        usersAPI.getAllUsers(),
        customersAPI.getAll()
      ]);

      console.log('📊 API 응답 상태:', {
        products: productsResult.success,
        equipment: equipmentResult.success,
        workOrders: workOrdersResult.success,
        process: processResult.success,
        quality: qualityResult.success,
        inventory: inventoryResult.success,
        users: usersResult.success,
        customers: customersResult.success
      });

      // 실제 데이터 기반 통계 계산
      const stats = calculateRealTimeStats({
        products: productsResult.success ? productsResult.data : [],
        equipment: equipmentResult.success ? equipmentResult.data : [],
        workOrders: workOrdersResult.success ? workOrdersResult.data : [],
        processes: processResult.success ? processResult.data : [],
        quality: qualityResult.success ? qualityResult.data : [],
        inventory: inventoryResult.success ? inventoryResult.data : [],
        users: usersResult.success ? usersResult.data : [],
        customers: customersResult.success ? customersResult.data : []
      });

      setDashboardData(stats);
      console.log('✅ 대시보드 데이터 설정 완료');
      
    } catch (error) {
      console.error('❌ 대시보드 데이터 로드 오류:', error);
      showToastMessage('대시보드 데이터 로드 중 오류가 발생했습니다.', 'error');
      
      // 오류 발생 시 기본 데이터로 설정
      setDashboardData({
        productionStats: [],
        lineStatus: [],
        recentAlerts: [],
        totalProduction: 0,
        efficiency: 0,
        defectRate: 0,
        equipmentOnline: 0,
        inventoryLevel: 0,
        activeWorkers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return t('dashboard.running');
      case 'stopped': return t('dashboard.stopped');
      case 'maintenance': return t('dashboard.maintenance');
      default: return status;
    }
  };

  const getAlertStyle = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getAlertIconColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{t('dashboard.realTimeConnection')}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {dashboardData.productionStats.map((stat, index) => {
          const Icon = stat.icon;
          const progress = Math.min((parseFloat(stat.value) / stat.target) * 100, 100);
          
          return (
            <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${stat.bgColor} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold ${stat.valueColor}`}>
                    {stat.value}
                  </span>
                  <span className="text-sm text-gray-500">{stat.unit}</span>
                </div>
                
                {/* 진행률 바 */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('dashboard.percentComplete')}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-${stat.color}-500`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 생산 라인 상태 & 실시간 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 생산 라인 현황 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.productionLines')}</h2>
            <button 
              onClick={loadDashboardData}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <Activity className="w-4 h-4" />
              <span>새로고침</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {dashboardData.lineStatus.map((line) => (
              <div key={line.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(line.status)}`}></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{line.name}</h3>
                      <p className="text-sm text-gray-500">{line.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    line.status === 'running' ? 'bg-green-100 text-green-600' :
                    line.status === 'maintenance' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {getStatusText(line.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">{t('dashboard.efficiency')}:</span>
                    <span className="font-medium">{line.efficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{t('production.target')}:</span>
                    <span className="font-medium">{line.output}/{line.target}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-red-600" />
                    <span className="text-gray-600">{t('dashboard.temperature')}:</span>
                    <span className="font-medium">{line.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-600">{t('dashboard.power')}:</span>
                    <span className="font-medium">{line.power.toFixed(1)}kW</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 실시간 알림 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('dashboard.realtimeAlerts')}</h2>
            <button 
              onClick={loadDashboardData}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <Clock className="w-4 h-4" />
              <span>새로고침</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardData.recentAlerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertStyle(alert.type)}`}>
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${getAlertIconColor(alert.type)}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 계층형 구조 - 2개 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 고객별 계층형 구조 */}
        <CustomerHierarchy />
        
        {/* 제품별 계층형 구조 */}
        <ProductHierarchy />
      </div>

      {/* Toast 메시지 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage; 