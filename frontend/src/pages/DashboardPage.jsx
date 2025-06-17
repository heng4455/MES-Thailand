import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Clock, Users, Settings, Play, Pause, BarChart3,
  Activity, Zap, Thermometer, Package
} from 'lucide-react';
import CustomerHierarchy from '../components/CustomerHierarchy';
import ProductHierarchy from '../components/ProductHierarchy';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeData, setRealTimeData] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 생산 현황 데이터
  const productionStats = [
    {
      title: t('dashboard.todayProduction'),
      value: '2,847',
      unit: t('quality.pieces'),
      change: '+12.5%',
      trend: 'up',
      icon: CheckCircle,
      color: 'blue',
      target: 3000,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-600'
    },
    {
      title: t('dashboard.efficiency'),
      value: '94.2',
      unit: t('quality.percent'),
      change: '+3.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green',
      target: 95,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600'
    },
    {
      title: t('dashboard.defectRate'),
      value: '0.8',
      unit: t('quality.percent'),
      change: '-0.3%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'red',
      target: 1,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600'
    },
    {
      title: t('dashboard.equipmentOnline'),
      value: '15',
      unit: '/ 18',
      change: '+2',
      trend: 'up',
      icon: Settings,
      color: 'emerald',
      target: 18,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-600'
    },
    {
      title: t('dashboard.inventoryLevel'),
      value: '87',
      unit: t('quality.percent'),
      change: '-5%',
      trend: 'down',
      icon: Package,
      color: 'purple',
      target: 90,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600'
    },
    {
      title: t('dashboard.workers'),
      value: '42',
      unit: t('production.operators'),
      change: '+3',
      trend: 'up',
      icon: Users,
      color: 'indigo',
      target: 45,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-600'
    }
  ];

  // 실시간 라인 상태
  const lineStatus = [
    { 
      id: 'LINE-001', 
      name: 'Assembly Line 1', 
      status: 'running', 
      efficiency: 96.5, 
      output: 847,
      target: 1000,
      temperature: 42.5,
      power: 87.3
    },
    { 
      id: 'LINE-002', 
      name: 'Assembly Line 2', 
      status: 'maintenance', 
      efficiency: 0, 
      output: 412,
      target: 800,
      temperature: 0,
      power: 0
    },
    { 
      id: 'LINE-003', 
      name: 'Assembly Line 3', 
      status: 'stopped', 
      efficiency: 78.5, 
      output: 156,
      target: 600,
      temperature: 35.2,
      power: 23.1
    }
  ];

  // 최근 알림
  const recentAlerts = [
    { 
      id: 1, 
      type: 'success', 
      message: `LINE-001: ${t('production.productionTarget')}`, 
      time: `2 ${t('production.minutesAgo')}`,
      icon: CheckCircle
    },
    { 
      id: 2, 
      type: 'warning', 
      message: `LINE-002: ${t('production.maintenanceInProgress')}`, 
      time: `15 ${t('production.minutesAgo')}`,
      icon: Settings
    },
    { 
      id: 3, 
      type: 'error', 
      message: `LINE-003: ${t('production.materialShortage')}`, 
      time: `1 ${t('production.hourAgo')}`,
      icon: AlertTriangle
    },
    { 
      id: 4, 
      type: 'info', 
      message: `${t('production.qualityIssue')} - ${t('quality.passRate')} 98.2%`, 
      time: `2 ${t('production.hoursAgo')}`,
      icon: CheckCircle
    }
  ];

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
        {productionStats.map((stat, index) => {
          const Icon = stat.icon;
          const progress = (stat.value / stat.target) * 100;
          
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
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('common.viewAll')}
            </button>
          </div>
          
          <div className="space-y-4">
            {lineStatus.map((line) => (
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
                    <span className="font-medium">{line.efficiency}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{t('production.target')}:</span>
                    <span className="font-medium">{line.output}/{line.target}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-red-600" />
                    <span className="text-gray-600">{t('dashboard.temperature')}:</span>
                    <span className="font-medium">{line.temperature}°C</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-600">{t('dashboard.power')}:</span>
                    <span className="font-medium">{line.power}kW</span>
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
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              {t('common.viewAll')}
            </button>
          </div>
          
          <div className="space-y-3">
            {recentAlerts.map((alert) => {
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
    </div>
  );
};

export default DashboardPage; 