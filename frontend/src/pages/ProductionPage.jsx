import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, StopCircle, CheckCircle, AlertTriangle, Clock, Users, Settings } from 'lucide-react';

const ProductionPage = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 실제 생산 데이터 (API에서 가져올 예정)
  const productionLines = [
    {
      id: 'LINE-001',
      name: 'Assembly Line 1',
      status: 'running',
      workOrder: 'WO-2024-0616-001',
      product: 'PCB Module A-Series',
      target: 1000,
      completed: 847,
      efficiency: 94.2,
      operators: 4,
      startTime: '06:00',
      endTime: '18:00',
      currentCycle: 3.2,
      standardCycle: 3.5,
      issues: []
    },
    {
      id: 'LINE-002', 
      name: 'Assembly Line 2',
      status: 'maintenance',
      workOrder: 'WO-2024-0616-002',
      product: 'PCB Module B-Series',
      target: 800,
      completed: 412,
      efficiency: 0,
      operators: 2,
      startTime: '08:00',
      endTime: '16:00',
      currentCycle: 0,
      standardCycle: 4.1,
      issues: [t('production.maintenanceInProgress')]
    },
    {
      id: 'LINE-003',
      name: 'Assembly Line 3',
      status: 'stopped',
      workOrder: 'WO-2024-0616-003',
      product: 'PCB Module C-Series',
      target: 600,
      completed: 156,
      efficiency: 78.5,
      operators: 3,
      startTime: '10:00',
      endTime: '22:00',
      currentCycle: 0,
      standardCycle: 5.2,
      issues: [t('production.materialShortage'), t('production.qualityIssue')]
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
              <p className="text-2xl font-bold text-blue-600">1,415 {t('quality.pieces')}</p>
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
              <p className="text-2xl font-bold text-green-600">86.4{t('quality.percent')}</p>
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
              <p className="text-2xl font-bold text-emerald-600">1 / 3</p>
              <p className="text-xs text-red-600 mt-1">2 {t('production.linesStopped')}</p>
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
              <p className="text-2xl font-bold text-purple-600">9{t('production.operators')}</p>
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
        
        {productionLines.map((line) => (
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
                  <p className="text-sm font-medium text-gray-700">{t('production.workOrder')}</p>
                  <p className="text-sm text-blue-600 font-mono">{line.workOrder}</p>
                  <p className="text-sm text-gray-600">{line.product}</p>
                </div>
              </div>

              {/* 생산 진행률 */}
              <div className="lg:col-span-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('production.progress')}</span>
                    <span className="font-medium">{((line.completed / line.target) * 100).toFixed(1)}{t('quality.percent')}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(line.efficiency)}`}
                      style={{ width: `${(line.completed / line.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {line.completed} / {line.target} {t('quality.pieces')}
                  </div>
                </div>
              </div>

              {/* 사이클 타임 */}
              <div className="lg:col-span-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">{t('production.cycleTime')}</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{line.currentCycle}s</span>
                    <span className="text-xs text-gray-500">/ {line.standardCycle}s {t('production.standardTime')}</span>
                  </div>
                  <p className="text-xs text-gray-500">{line.operators} {t('production.operators')}</p>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="lg:col-span-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{t('production.actions')}</p>
                  <div className="flex space-x-1">
                    {line.status === 'running' ? (
                      <button className="flex-1 px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 transition-colors">
                        {t('production.stopProduction')}
                      </button>
                    ) : (
                      <button className="flex-1 px-3 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200 transition-colors">
                        {t('production.startProduction')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 이슈 표시 */}
            {line.issues.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">{t('production.issues')}</p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      {line.issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 실시간 알림 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{t('production.realtimeNotifications')}</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">LIVE</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-800">LINE-001: {t('production.productionTarget')}</p>
              <p className="text-xs text-green-600 mt-1">2 {t('production.minutesAgo')}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Settings className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">LINE-002: {t('production.maintenanceInProgress')}</p>
              <p className="text-xs text-yellow-600 mt-1">15 {t('production.minutesAgo')}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">LINE-003: {t('production.materialShortage')}</p>
              <p className="text-xs text-red-600 mt-1">1 {t('production.hourAgo')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage; 