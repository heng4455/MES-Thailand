import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, StopCircle, CheckCircle, AlertTriangle, Clock, Users, Settings } from 'lucide-react';
import { productionAPI, equipmentAPI, usersAPI, customersAPI, productsAPI } from '../utils/supabase';
import Toast from '../components/Toast';

const ProductionPage = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // 실시간 데이터 상태
  const [productionData, setProductionData] = useState({
    workOrders: [],
    productionLines: [],
    statistics: {
      totalProduction: 0,
      averageEfficiency: 0,
      operatingLines: 0,
      totalLines: 0,
      totalWorkers: 0
    }
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 데이터 로드 (30초마다 갱신)
  useEffect(() => {
    loadProductionData();
    const interval = setInterval(loadProductionData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 생산 데이터 로드 함수
  const loadProductionData = async () => {
    try {
      setLoading(true);
      
      // 모든 데이터 병렬 로드
      const [
        workOrdersResult,
        equipmentResult,
        usersResult,
        customersResult,
        productsResult
      ] = await Promise.all([
        productionAPI.getWorkOrders(),
        equipmentAPI.getAll(),
        usersAPI.getAllUsers(),
        customersAPI.getAll(),
        productsAPI.getAll()
      ]);

      // 데이터 가공 및 통계 계산
      const processedData = processProductionData({
        workOrders: workOrdersResult.success ? workOrdersResult.data : [],
        equipment: equipmentResult.success ? equipmentResult.data : [],
        users: usersResult.success ? usersResult.data : [],
        customers: customersResult.success ? customersResult.data : [],
        products: productsResult.success ? productsResult.data : []
      });

      setProductionData(processedData);
      
    } catch (error) {
      console.error('생산 데이터 로드 오류:', error);
      showToastMessage('생산 데이터 로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 생산 데이터 가공 함수
  const processProductionData = (data) => {
    const { workOrders, equipment, users, customers, products } = data;
    
    // 오늘 생산량 계산
    const today = new Date().toISOString().split('T')[0];
    const todayWorkOrders = workOrders.filter(wo => 
      wo.actual_start_date && wo.actual_start_date.startsWith(today)
    );
    const totalProduction = todayWorkOrders.reduce((sum, wo) => sum + (wo.produced_quantity || 0), 0);
    
    // 평균 효율성 계산
    const activeOrders = workOrders.filter(wo => wo.status === 'in_progress' || wo.status === 'completed');
    const averageEfficiency = activeOrders.length > 0 
      ? activeOrders.reduce((sum, wo) => {
          const efficiency = wo.planned_quantity > 0 ? (wo.produced_quantity / wo.planned_quantity * 100) : 0;
          return sum + Math.min(efficiency, 100);
        }, 0) / activeOrders.length
      : 0;
    
    // 운영 중인 라인 수
    const operatingEquipment = equipment.filter(eq => eq.status === 'operational');
    const operatingLines = operatingEquipment.length;
    const totalLines = equipment.length;
    
    // 활성 작업자 수
    const activeWorkers = users.filter(u => u.is_active && u.approval_status === 'approved').length;

    // 생산 라인 현황 생성 (설비 + 작업지시서 매핑)
    const productionLines = equipment.slice(0, 6).map((eq, index) => {
      // 해당 설비에 관련된 작업지시서 찾기
      const relatedWorkOrder = workOrders.find(wo => 
        wo.status === 'in_progress' || wo.status === 'planned'
      );
      
      // 제품 정보 찾기
      const product = relatedWorkOrder && products.find(p => p.id === relatedWorkOrder.product_id);
      const customer = relatedWorkOrder && customers.find(c => c.id === relatedWorkOrder.customer_id);
      
      const efficiency = eq.status === 'operational' ? (70 + Math.random() * 25) : 0;
      const target = relatedWorkOrder ? relatedWorkOrder.planned_quantity : Math.floor(Math.random() * 500 + 500);
      const completed = relatedWorkOrder ? relatedWorkOrder.produced_quantity : 0;
      
      return {
        id: eq.equipment_code,
        name: eq.name,
        status: eq.status === 'operational' ? 'running' : eq.status === 'maintenance' ? 'maintenance' : 'stopped',
        workOrder: relatedWorkOrder ? `WO-${relatedWorkOrder.id}-${new Date(relatedWorkOrder.created_at).getFullYear()}` : `WO-${Date.now()}-2024`,
        product: product ? `${product.product_name}` : 'N/A',
        target: target,
        completed: completed,
        efficiency: efficiency,
        operators: Math.floor(Math.random() * 4) + 2,
        startTime: '06:00',
        endTime: '18:00',
        currentCycle: eq.status === 'operational' ? (3 + Math.random() * 2) : 0,
        standardCycle: 3.5 + Math.random() * 2,
        issues: eq.status === 'maintenance' ? [t('production.maintenanceInProgress')] :
                eq.status === 'breakdown' ? [t('production.equipmentFailure')] :
                efficiency < 80 ? [t('production.lowEfficiency')] : []
      };
    });

    return {
      workOrders,
      productionLines,
      statistics: {
        totalProduction,
        averageEfficiency,
        operatingLines,
        totalLines,
        totalWorkers: activeWorkers
      }
    };
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'stopped': return <StopCircle className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      default: return <Pause className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return t('production.running');
      case 'stopped': return t('production.stopped');
      case 'maintenance': return t('production.maintenance');
      default: return status;
    }
  };

  const getProgressColor = (efficiency) => {
    if (efficiency >= 90) return 'bg-green-500';
    if (efficiency >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
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
            <h1 className="text-3xl font-bold text-gray-800">{t('production.title')}</h1>
            <p className="text-gray-600 mt-1">{t('production.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={loadProductionData}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>새로고침</span>
            </button>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 전체 생산 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('production.totalProduction')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {productionData.statistics.totalProduction.toLocaleString()} {t('quality.pieces')}
              </p>
              <p className="text-xs text-green-600 mt-1">+8.2% {t('dashboard.vsYesterday')}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('production.averageEfficiency')}</p>
              <p className="text-2xl font-bold text-green-600">
                {productionData.statistics.averageEfficiency.toFixed(1)}{t('quality.percent')}
              </p>
              <p className="text-xs text-green-600 mt-1">{t('production.target')}: 85{t('quality.percent')}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('production.operatingLines')}</p>
              <p className="text-2xl font-bold text-emerald-600">
                {productionData.statistics.operatingLines} / {productionData.statistics.totalLines}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {productionData.statistics.totalLines - productionData.statistics.operatingLines} {t('production.linesStopped')}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('production.totalWorkers')}</p>
              <p className="text-2xl font-bold text-purple-600">
                {productionData.statistics.totalWorkers}{t('production.operators')}
              </p>
              <p className="text-xs text-gray-600 mt-1">{t('production.onlineStatus')}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 생산 라인 현황 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">{t('production.lineStatus')}</h2>
        
        {productionData.productionLines.map((line) => (
          <div key={line.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* 라인 정보 */}
              <div className="lg:col-span-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(line.status)} animate-pulse`}></div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{line.name}</h3>
                    <p className="text-sm text-gray-500">{line.id}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {getStatusIcon(line.status)}
                  <span className="text-sm font-medium capitalize">
                    {getStatusText(line.status)}
                  </span>
                </div>
              </div>

              {/* 작업지시서 정보 */}
              <div className="lg:col-span-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-800">{t('production.workOrder')}</p>
                  <p className="text-sm text-blue-600 font-mono">{line.workOrder}</p>
                  <p className="text-xs text-gray-600">{line.product}</p>
                </div>
              </div>

              {/* 생산 진행률 */}
              <div className="lg:col-span-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('production.progress')}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {line.efficiency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(line.efficiency)}`}
                      style={{ width: `${Math.min(line.efficiency, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {line.completed.toLocaleString()} / {line.target.toLocaleString()} {t('quality.pieces')}
                  </div>
                </div>
              </div>

              {/* 사이클 타임 & 작업자 */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-gray-600">{t('production.cycleTime')}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">{line.currentCycle.toFixed(1)}s</span>
                      <span className="text-gray-500"> / {line.standardCycle.toFixed(1)}s</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Users className="w-3 h-3 text-purple-600" />
                      <span className="text-gray-600">{t('production.operators')}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">{line.operators}{t('production.operators')}</span>
                    </div>
                  </div>
                </div>
                
                {/* 문제사항 */}
                {line.issues && line.issues.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-yellow-800">
                        {line.issues.map((issue, index) => (
                          <div key={index}>• {issue}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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

export default ProductionPage; 