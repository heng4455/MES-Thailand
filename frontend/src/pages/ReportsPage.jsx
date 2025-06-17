import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, TrendingUp, Download, Calendar, Filter, 
  FileText, PieChart, LineChart, Activity 
} from 'lucide-react';

const ReportsPage = () => {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState('production');

  const reportTypes = [
    {
      id: 'production',
      title: t('reports.productionReport'),
      description: t('reports.productionReportDesc'),
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'quality',
      title: t('reports.qualityReport'),
      description: t('reports.qualityReportDesc'),
      icon: PieChart,
      color: 'green'
    },
    {
      id: 'equipment',
      title: t('reports.equipmentReport'),
      description: t('reports.equipmentReportDesc'),
      icon: Activity,
      color: 'orange'
    },
    {
      id: 'efficiency',
      title: t('reports.efficiencyReport'),
      description: t('reports.efficiencyReportDesc'),
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  const recentReports = [
    {
      id: 1,
      name: t('reports.dailyProductionReport'),
      date: '2024-06-16',
      type: 'production',
      status: 'completed'
    },
    {
      id: 2,
      name: t('reports.weeklyQualityReport'),
      date: '2024-06-15',
      type: 'quality',
      status: 'completed'
    },
    {
      id: 3,
      name: t('reports.monthlyEquipmentReport'),
      date: '2024-06-14',
      type: 'equipment',
      status: 'processing'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('reports.title')}</h1>
            <p className="text-gray-600 mt-1">{t('reports.subtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>{t('reports.newReport')}</span>
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>{t('reports.exportAll')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 리포트 유형 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                selectedReport === report.id
                  ? `border-${report.color}-500 ring-2 ring-${report.color}-200`
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 bg-${report.color}-50 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${report.color}-600`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-600">{report.description}</p>
            </div>
          );
        })}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 리포트 생성 */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('reports.generateReport')}</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reports.reportType')}
                </label>
                <select 
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reports.dateRange')}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="today">{t('reports.today')}</option>
                  <option value="week">{t('reports.thisWeek')}</option>
                  <option value="month">{t('reports.thisMonth')}</option>
                  <option value="quarter">{t('reports.thisQuarter')}</option>
                  <option value="custom">{t('reports.customRange')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reports.startDate')}
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="2024-06-01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reports.endDate')}
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="2024-06-16"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reports.format')}
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="format" value="pdf" defaultChecked className="mr-2" />
                  <span className="text-sm">PDF</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="format" value="excel" className="mr-2" />
                  <span className="text-sm">Excel</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="format" value="csv" className="mr-2" />
                  <span className="text-sm">CSV</span>
                </label>
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>{t('reports.generateReport')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 최근 리포트 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('reports.recentReports')}</h2>
          
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === 'completed' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {report.status === 'completed' ? t('reports.completed') : t('reports.processing')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{report.date}</p>
                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition-colors">
                    {t('reports.view')}
                  </button>
                  <button className="flex-1 px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors">
                    {t('reports.download')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 차트 미리보기 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('reports.chartPreview')}</h2>
        
        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('reports.chartPlaceholder')}</p>
          <p className="text-gray-400 text-sm mt-2">{t('reports.selectReportType')}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 