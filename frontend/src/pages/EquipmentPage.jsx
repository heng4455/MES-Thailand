import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, Wifi, WifiOff, AlertTriangle, CheckCircle, XCircle, 
  Wrench, Calendar, Clock, Thermometer, Zap, Activity,
  Plus, Search, Filter, Download, Upload, Eye, Edit, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { equipmentAPI, processAPI, productsAPI } from '../utils/supabase';

const EquipmentPage = () => {
  const { t, i18n } = useTranslation();
  
  // 번역 디버깅
  console.log('Current language:', i18n.language);
  console.log('equipmentNameRequired translation:', t('equipment.equipmentNameRequired'));
  console.log('equipmentIdRequired translation:', t('equipment.equipmentIdRequired')); 
  console.log('relatedProcessRequired translation:', t('equipment.relatedProcessRequired'));
  
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fileInputRef = useRef(null);

  // 등록된 공정 데이터와 제품 데이터
  const [processes, setProcesses] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    equipmentName: '',
    equipmentId: '',
    relatedProcess: '',
    equipmentLocation: '',
    status: 'idle',
    capa: ''
  });

  // 실제 공정 데이터 로드
  const loadProcesses = async () => {
    try {
      console.log('🔄 설비 페이지 - 공정 데이터 로딩 시작...');
      const result = await processAPI.getAll();
      console.log('📊 공정 API 결과:', result);
      
      if (result.success) {
        console.log('✅ 공정 데이터 로드 성공:', result.data.length, '개');
        
        // ProcessPage와 동일한 데이터 구조 사용
        const formattedProcesses = result.data.map(process => ({
          id: process.id,
          processName: process.processName || '이름 없음',
          processCode: process.processCode || `P${process.id}`,
          processType: process.processType || '일반',
          customer: process.customer || 'N/A',
          relatedProduct: process.relatedProduct || 'N/A',
          relatedProductName: process.relatedProductName || 'N/A',
          statusType: process.statusType || 'active',
          description: process.description || '',
          // 설비 페이지 표시용 정보
          displayName: process.processName 
            ? `${process.processName} (${process.processCode || process.id})`
            : `공정 ${process.id}`,
          fullInfo: process.customer && process.customer !== 'N/A'
            ? `${process.processName} (${process.processCode || process.id}) - ${process.customer}`
            : `${process.processName} (${process.processCode || process.id})`
        }));
        
        console.log('🎯 변환된 공정 데이터 (설비용):', formattedProcesses);
        setProcesses(formattedProcesses);
        
        if (formattedProcesses.length === 0) {
          console.warn('⚠️ 등록된 공정이 없습니다.');
          showToastMessage('등록된 공정이 없습니다. 공정 관리에서 공정을 먼저 등록해주세요.', 'warning');
        } else {
          console.log(`✅ 공정 로드 완료: ${formattedProcesses.length}개`);
        }
      } else {
        console.error('❌ 공정 데이터 로드 실패:', result.error);
        showToastMessage('공정 데이터 로드에 실패했습니다: ' + result.error, 'error');
        setProcesses([]);
      }
    } catch (error) {
      console.error('❌ 공정 데이터 로드 오류:', error);
      showToastMessage('공정 데이터 로드 중 오류가 발생했습니다: ' + error.message, 'error');
      setProcesses([]);
    }
  };

  // 제품 데이터 로드
  const loadProducts = async () => {
    try {
      const result = await productsAPI.getAll();
      if (result.success) {
        const formattedProducts = result.data.map(product => ({
          id: product.id,
          productCode: product.product_code,
          productName: product.product_name,
          client: product.client
        }));
        setProducts(formattedProducts);
      } else {
        console.error('제품 데이터 로드 실패:', result.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('제품 데이터 로드 오류:', error);
      setProducts([]);
    }
  };

  // 실제 설비 데이터
  const [equipmentList, setEquipmentList] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadProcesses(),
        loadProducts(),
        loadEquipment()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 실제 설비 데이터 로드
  const loadEquipment = async () => {
    try {
      console.log('Loading equipment data...');
      const result = await equipmentAPI.getAll();
      console.log('equipmentAPI.getAll() result:', result);
      
      if (result.success) {
        console.log('Raw equipment data:', result.data);
        // 실제 equipment 테이블 데이터를 UI 형식으로 변환
        const formattedEquipment = result.data.map(equipment => {
          // specifications에서 추가 정보 파싱
          let specifications = {};
          try {
            specifications = equipment.specifications ? JSON.parse(equipment.specifications) : {};
          } catch (e) {
            specifications = {};
          }

          return {
            id: equipment.id,
            equipmentName: equipment.name,
            equipmentId: equipment.equipment_code,
            type: specifications.type || 'Equipment',
            status: equipment.status === 'operational' ? 'idle' : equipment.status,
            health: 100, // 기본값
            temperature: 25, // 기본값
            vibration: 0, // 기본값
            power: 0, // 기본값
            efficiency: equipment.status === 'operational' ? 95 : 0,
            lastMaintenance: equipment.updated_at,
            nextMaintenance: null,
            operatingHours: Math.floor(Math.random() * 1000) + 500, // 임시값
            equipmentLocation: equipment.location,
            operator: 'N/A',
            relatedProcess: specifications.relatedProcess || 'N/A',
            relatedProduct: 'N/A',
            capa: specifications.capacity || 'N/A',
            alarms: [],
            parameters: {}
          };
        });
        console.log('Formatted equipment data:', formattedEquipment);
        setEquipmentList(formattedEquipment);
        console.log('Equipment data loaded successfully, total', formattedEquipment.length, 'equipment');
      } else {
        console.error('Equipment data load failed:', result.error);
        setEquipmentList([]);
      }
    } catch (error) {
      console.error('Equipment data load error:', error);
      setEquipmentList([]);
    }
  };

  // 이벤트 핸들러들
  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleView = (equipment) => {
    setSelectedEquipment(equipment);
    setShowViewModal(true);
  };

  const handleEdit = (equipment) => {
    setSelectedEquipment(equipment);
    setFormData({
      equipmentName: equipment.equipmentName,
      equipmentId: equipment.equipmentId,
      relatedProcess: equipment.relatedProcess,
      equipmentLocation: equipment.equipmentLocation,
      status: equipment.status,
      capa: equipment.capa
    });
    setShowEditModal(true);
  };

  const handleDelete = (equipment) => {
    setSelectedEquipment(equipment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await equipmentAPI.delete(selectedEquipment.id);
      if (result.success) {
        showToastMessage(t('equipment.equipmentDeletedSuccess'));
        await loadEquipment();
      } else {
        showToastMessage(t('equipment.deleteFailed'), 'error');
      }
    } catch (error) {
      console.error('Equipment delete error:', error);
      showToastMessage(t('common.deleteError'), 'error');
    }
    setShowDeleteDialog(false);
    setSelectedEquipment(null);
  };

  const handleSave = async () => {
    if (!formData.equipmentName || !formData.equipmentId) {
      showToastMessage(t('common.fillAllFields'), 'error');
      return;
    }

    try {
      console.log('Equipment save start:', { formData, selectedEquipment });
      
      // 실제 equipment 테이블 스키마에 맞는 데이터 구조로 변환
      const equipmentData = {
        equipment_code: formData.equipmentId,
        name: formData.equipmentName,
        location: formData.equipmentLocation,
        status: formData.status,
        specifications: JSON.stringify({
          relatedProcess: formData.relatedProcess,
          capacity: formData.capa,
          type: 'Manufacturing Equipment'
        })
      };

      console.log('Equipment data to send:', equipmentData);

      let result;
      if (selectedEquipment) {
        console.log('Equipment edit mode:', selectedEquipment.id);
        result = await equipmentAPI.update(selectedEquipment.id, equipmentData);
      } else {
        console.log('Equipment add mode');
        result = await equipmentAPI.create(equipmentData);
      }

      if (result.success) {
        console.log('Equipment save success:', result);
        showToastMessage(
          selectedEquipment ? t('equipment.equipmentUpdatedSuccess') : t('equipment.equipmentAddedSuccess')
        );
        await loadEquipment();
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
      } else {
        console.error('Equipment save failed:', result.error);
        showToastMessage(
          selectedEquipment ? t('equipment.updateFailed') : t('equipment.addFailed'), 
          'error'
        );
      }
    } catch (error) {
      console.error('Equipment save error:', error);
      showToastMessage(t('common.saveError'), 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      equipmentName: '',
      equipmentId: '',
      relatedProcess: '',
      equipmentLocation: '',
      status: 'idle',
      capa: ''
    });
    setSelectedEquipment(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toast 메시지 표시 함수
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExport = () => {
    const exportData = equipmentList.map((equipment, index) => ({
      [t('equipment.order')]: index + 1,
      [t('equipment.equipmentName')]: equipment.equipmentName,
      [t('equipment.equipmentId')]: equipment.equipmentId,
      [t('equipment.relatedProcess')]: equipment.relatedProcess,
      [t('equipment.location')]: equipment.equipmentLocation,
      [t('equipment.status')]: getStatusText(equipment.status),
      [t('equipment.efficiency')]: `${equipment.efficiency}%`,
      [t('equipment.capacity')]: equipment.capa,
      [t('equipment.temperature')]: `${equipment.temperature}°C`,
      [t('equipment.operatingTime')]: `${equipment.operatingHours}h`
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('equipment.title'));
    
    // 컬럼 너비 설정
    const colWidths = [
      {wch: 8}, {wch: 20}, {wch: 15}, {wch: 20}, 
      {wch: 15}, {wch: 10}, {wch: 10}, {wch: 15}, {wch: 12}, {wch: 15}
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `${t('equipment.title')}_${new Date().toLocaleDateString('ko-KR')}.xlsx`);
    showToastMessage(t('equipment.equipmentExported'), 'success');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Equipment import data:', jsonData);
        showToastMessage(`${jsonData.length}${t('equipment.importedDataCount')}`, 'success');
      } catch (error) {
        console.error('Equipment file reading error:', error);
        showToastMessage(t('equipment.fileReadError'), 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // 상태별 설비 수 계산
  const totalEquipment = equipmentList.length;
  const runningEquipment = equipmentList.filter(eq => eq.status === 'running').length;
  const idleEquipment = equipmentList.filter(eq => eq.status === 'idle').length;
  const maintenanceEquipment = equipmentList.filter(eq => eq.status === 'maintenance').length;
  const errorEquipment = equipmentList.filter(eq => eq.status === 'error').length;

  const averageEfficiency = equipmentList.length > 0 
    ? Math.round(equipmentList.reduce((sum, eq) => sum + eq.efficiency, 0) / equipmentList.length)
    : 0;

  const averageTemperature = equipmentList.length > 0
    ? Math.round(equipmentList.reduce((sum, eq) => sum + eq.temperature, 0) / equipmentList.length)
    : 25;

  const totalOperatingHours = equipmentList.reduce((acc, eq) => acc + eq.operatingHours, 0);

  // 필터링된 설비들
  const filteredEquipments = equipmentList.filter(equipment => {
    const matchesSearch = equipment.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.relatedProcess.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.equipmentLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || equipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'idle': return 'text-blue-600';
      case 'maintenance': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'idle': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return t('equipment.running');
      case 'idle': return t('equipment.idle');
      case 'maintenance': return t('equipment.maintenance');
      case 'error': return t('common.error');
      default: return t('common.unknown');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 숨겨진 파일 입력 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
      />

      {/* 스마트팩토리 대시보드 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 전체 설비 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('equipment.totalEquipment')}</p>
              <p className="text-3xl font-bold">{totalEquipment}</p>
            </div>
            <Cpu className="h-8 w-8 text-blue-200" />
          </div>
        </motion.div>

        {/* 가동중 설비 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('equipment.running')}</p>
              <p className="text-3xl font-bold">{runningEquipment}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </motion.div>

        {/* 평균 효율 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">{t('equipment.efficiency')}</p>
              <p className="text-3xl font-bold">{averageEfficiency}%</p>
            </div>
            <Activity className="h-8 w-8 text-purple-200" />
          </div>
        </motion.div>

        {/* 평균 온도 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">{t('equipment.temperature')}</p>
              <p className="text-3xl font-bold">{averageTemperature}°C</p>
            </div>
            <Thermometer className="h-8 w-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* 설비 목록 테이블 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">{t('equipment.title')}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('common.export')}</span>
                </button>
                <button
                  onClick={handleImport}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center space-x-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>{t('common.import')}</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{t('equipment.totalEquipmentCount')}: </span>
              <span className="text-sm font-medium text-blue-600">{filteredEquipments.length}{t('equipment.equipmentCountSuffix')}</span>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('equipment.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('equipment.allStatuses')}</option>
              <option value="running">{t('equipment.running')}</option>
              <option value="idle">{t('equipment.idle')}</option>
              <option value="maintenance">{t('equipment.maintenance')}</option>
              <option value="error">{t('common.error')}</option>
            </select>
            <button 
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('equipment.addNewEquipment')}</span>
            </button>
          </div>
        </div>

        {/* 설비 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.number')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.equipmentName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.equipmentId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.relatedProcess')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.efficiency')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.capacity')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEquipments.map((equipment, index) => (
                <motion.tr
                  key={equipment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{equipment.equipmentName}</div>
                    <div className="text-xs text-gray-500">{equipment.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">{equipment.equipmentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.relatedProcess}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.equipmentLocation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      equipment.status === 'running' ? 'bg-green-100 text-green-800' :
                      equipment.status === 'idle' ? 'bg-blue-100 text-blue-800' :
                      equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStatusText(equipment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getHealthColor(equipment.efficiency)}`}>
                      {equipment.efficiency}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.capa}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleView(equipment)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title={t('common.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(equipment)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title={t('common.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(equipment)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEquipments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('equipment.noEquipment')}</p>
          </div>
        )}
      </motion.div>

      {/* 설비 추가/수정 모달 */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedEquipment ? t('equipment.editEquipment') : t('equipment.addNewEquipment')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('equipment.equipmentNameRequired')}
              </label>
              <input
                type="text"
                name="equipmentName"
                value={formData.equipmentName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('equipment.equipmentIdRequired')}
              </label>
              <input
                type="text"
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('equipment.relatedProcessRequired')}
              </label>
              <select
                name="relatedProcess"
                value={formData.relatedProcess}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">{t('equipment.processSelectPlaceholder')}</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.processName}>
                    {process.fullInfo}
                  </option>
                ))}
              </select>
              {processes.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  공정 관리에서 공정을 먼저 등록해주세요.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('equipment.location')}
              </label>
              <input
                type="text"
                name="equipmentLocation"
                value={formData.equipmentLocation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('equipment.locationPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.status')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="idle">{t('equipment.idle')}</option>
                <option value="running">{t('equipment.running')}</option>
                <option value="maintenance">{t('equipment.maintenance')}</option>
                <option value="error">{t('common.error')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('equipment.capacity')}
              </label>
              <input
                type="text"
                name="capa"
                value={formData.capa}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('equipment.capacityPlaceholder')}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {selectedEquipment ? t('common.edit') : t('common.add')}
            </button>
          </div>
        </div>
      </Modal>

      {/* 설비 상세 보기 모달 */}
      {showViewModal && selectedEquipment && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedEquipment(null);
          }}
          title={t('equipment.equipmentDetails')}
          size="lg"
        >
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('equipment.basicInfo')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <label className="text-sm font-medium text-gray-600">{t('equipment.equipmentName')}</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.equipmentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('equipment.equipmentId')}</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.equipmentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('equipment.relatedProcess')}</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.relatedProcess}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('equipment.location')}</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.equipmentLocation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('common.status')}</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedEquipment.status)}
                    <span className={`text-sm font-medium ${getStatusColor(selectedEquipment.status)}`}>
                      {getStatusText(selectedEquipment.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t('equipment.capacity')}</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.capa}</p>
                </div>
                </div>
              </div>

              {/* 성능 정보 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('equipment.performanceInfo')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedEquipment.efficiency}%</p>
                    <p className="text-sm text-gray-600">{t('equipment.efficiency')}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{selectedEquipment.temperature}°C</p>
                    <p className="text-sm text-gray-600">{t('equipment.temperature')}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedEquipment.operatingHours}h</p>
                    <p className="text-sm text-gray-600">{t('equipment.operatingTime')}</p>
                  </div>
                </div>
              </div>

              {/* 유지보수 정보 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('equipment.maintenanceInfo')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('equipment.lastMaintenance')}</label>
                    <p className="text-sm text-gray-900">
                      {selectedEquipment.lastMaintenance 
                        ? new Date(selectedEquipment.lastMaintenance).toLocaleDateString('ko-KR')
                        : t('equipment.noRecord')
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('equipment.nextMaintenance')}</label>
                    <p className="text-sm text-gray-900">
                      {selectedEquipment.nextMaintenance 
                        ? new Date(selectedEquipment.nextMaintenance).toLocaleDateString('ko-KR')
                        : t('equipment.noSchedule')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* Toast 메시지 */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedEquipment(null);
        }}
        onConfirm={confirmDelete}
        title={t('equipment.deleteConfirmation')}
        message={t('equipment.deleteConfirmMessage', { name: selectedEquipment?.equipmentName })}
      />
    </div>
  );
};

export default EquipmentPage; 