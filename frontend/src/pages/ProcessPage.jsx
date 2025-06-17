import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const ProcessPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fileInputRef = useRef(null);
  
  // 추가된 상태들
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [equipments, setEquipments] = useState([]);
  
  const [formData, setFormData] = useState({
    processName: '',
    processId: '',
    client: '',
    relatedProduct: '', // 새로 추가
    equipmentLocation: '',
    productionRequests: '',
    status: '',
    statusType: 'processing',
    capa: '' // CAPA 필드 추가
  });

  // 고객, 제품, 설비 데이터 로드
  const loadCustomers = async () => {
    const mockCustomers = [
      { id: 1, customerName: 'MOBIS', companyName: '현대모비스' },
      { id: 2, customerName: 'LG VS', companyName: 'LG전자 VS사업부' },
      { id: 3, customerName: 'HL Clemove', companyName: 'HL클레무브' },
      { id: 4, customerName: 'Samsung SDI', companyName: '삼성SDI' },
      { id: 5, customerName: 'SK Innovation', companyName: 'SK이노베이션' }
    ];
    setCustomers(mockCustomers);
  };

  const loadProducts = async () => {
    const mockProducts = [
      { id: 1, productCode: 'CMI-CDSS4018NH-4R7M', productName: 'Power Inductor 4.7μH', client: 'MOBIS' },
      { id: 2, productCode: 'CMI-CDSS4018NH-6R8M', productName: 'Power Inductor 6.8μH', client: 'MOBIS' },
      { id: 3, productCode: 'CMI-CMPP6030HL-6R8M-N', productName: 'Coupled Inductor 6.8μH', client: 'MOBIS' },
      { id: 4, productCode: 'CMI-CSSP12080NF-221M', productName: 'Shield Power Inductor 220μH', client: 'MOBIS' },
      { id: 5, productCode: 'CME-CSCF3225B-100T30-A', productName: 'Common Mode Choke 100μH', client: 'HL Clemove' },
      { id: 6, productCode: 'CMI-CMPP4020HL-1ROM', productName: 'Coupled Inductor 1.0μH', client: 'LG VS' },
      { id: 7, productCode: 'CMI-CMPP5030HL-1ROM', productName: 'Coupled Inductor 1.0μH', client: 'LG VS' },
      { id: 8, productCode: 'CMI-CMPP5030HL-220M', productName: 'Coupled Inductor 22μH', client: 'LG VS' },
      { id: 9, productCode: 'CMI-CDSS5040NH-220M', productName: 'Power Inductor 22μH', client: 'LG VS' }
    ];
    setProducts(mockProducts);
  };

  const loadEquipments = async () => {
    const mockEquipments = [
      { id: 'SMT-001', name: 'SMT 라인 #1', location: 'Floor 1, Zone A' },
      { id: 'CNC-002', name: 'CNC 머시닝센터 #2', location: 'Floor 2, Zone B' },
      { id: 'ROB-003', name: '로봇 암 #3', location: 'Floor 1, Zone C' },
      { id: 'CON-004', name: '컨베이어 시스템 #4', location: 'Floor 1, Zone D' },
      { id: 'TEST-005', name: '자동 검사 장비 #5', location: 'Floor 2, Zone A' },
      { id: 'PRESS-006', name: '프레스 장비 #6', location: 'Floor 1, Zone B' },
      { id: 'MOLDING-007', name: '몰딩 장비 #7', location: 'Floor 2, Zone C' },
      { id: 'WIND-008', name: '와인딩 장비 #8', location: 'Floor 1, Zone E' }
    ];
    setEquipments(mockEquipments);
  };

  // 샘플 공정 데이터
  const [processes] = useState([
    {
      id: 1,
      processName: 'Core Press',
      processId: '7d7e4073',
      client: 'LG VS',
      relatedProduct: 'CMI-CMPP4020HL-1ROM',
      productionRequests: '0개 요구사항',
      status: '0개 생비',
      equipmentLocation: 'SMT 라인 #1',
      registrationDate: '2025. 6. 12. 오후 11:36',
      statusType: 'processing',
      capa: '150 ea/h'
    },
    {
      id: 2,
      processName: 'Winding + Welding',
      processId: 'cfcacfea',
      client: 'LG VS',
      relatedProduct: 'CMI-CMPP5030HL-1ROM',
      productionRequests: '0개 요구사항',
      status: '0개 생비',
      equipmentLocation: 'CNC 머시닝센터 #2',
      registrationDate: '2025. 6. 12. 오후 11:36',
      statusType: 'processing',
      capa: '120 ea/h'
    },
    {
      id: 3,
      processName: 'Molding',
      processId: '2d05064d',
      client: 'LG VS',
      relatedProduct: 'CMI-CMPP5030HL-220M',
      productionRequests: '0개 요구사항',
      status: '0개 생비',
      equipmentLocation: '몰딩 장비 #7',
      registrationDate: '2025. 6. 12. 오후 11:36',
      statusType: 'processing',
      capa: '80 ea/h'
    },
    {
      id: 4,
      processName: 'Bending + Reflow',
      processId: 'a490d4bc',
      client: 'LG VS',
      relatedProduct: 'CMI-CDSS5040NH-220M',
      productionRequests: '0개 요구사항',
      status: '0개 생비',
      equipmentLocation: '와인딩 장비 #8',
      registrationDate: '2025. 6. 12. 오후 11:37',
      statusType: 'processing',
      capa: '200 ea/h'
    },
    {
      id: 5,
      processName: 'Inspec Appearnace + Reel Packing',
      processId: '6fbae315',
      client: 'LG VS',
      relatedProduct: 'CMI-CDSS4018NH-4R7M',
      productionRequests: '0개 요구사항',
      status: '0개 생비',
      equipmentLocation: '자동 검사 장비 #5',
      registrationDate: '2025. 6. 12. 오후 11:37',
      statusType: 'processing',
      capa: '100 ea/h'
    },
    {
      id: 6,
      processName: 'Reel Inspec',
      processId: '8507533a',
      client: 'LG VS',
      relatedProduct: 'CMI-CDSS4018NH-6R8M',
      productionRequests: '0개 요구사항',
      status: '0개 생비',
      equipmentLocation: '자동 검사 장비 #5',
      registrationDate: '2025. 6. 12. 오후 11:37',
      statusType: 'processing',
      capa: '90 ea/h'
    }
  ]);

  // 통계 데이터
  const stats = [
    { 
      title: t('process.totalProcesses'), 
      value: '96', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      title: t('process.relatedProducts'), 
      value: '16', 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      title: t('process.productionRequests'), 
      value: '0', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      title: t('process.testResults'), 
      value: '96', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadCustomers(),
        loadProducts(),
        loadEquipments()
      ]);
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    };

    loadData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <Play className="h-4 w-4 text-purple-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processing':
        return t('process.statusText.processing');
      case 'completed':
        return t('process.statusText.completed');
      case 'paused':
        return t('process.statusText.paused');
      case 'waiting':
        return t('process.statusText.waiting');
      default:
        return t('process.statusText.unknown');
    }
  };

  // 액션 함수들
  const handleView = (process) => {
    setSelectedProcess(process);
    setShowViewModal(true);
  };

  const handleEdit = (process) => {
    setSelectedProcess(process);
    setFormData({
      processName: process.processName,
      processId: process.processId,
      client: process.client,
      relatedProduct: process.relatedProduct,
      equipmentLocation: process.equipmentLocation,
      productionRequests: process.productionRequests,
      status: process.status,
      statusType: process.statusType,
      capa: process.capa
    });
    setShowEditModal(true);
  };

  const handleDelete = (process) => {
    setSelectedProcess(process);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    // 실제 구현에서는 API 호출
    alert(t('process.messages.processDeleted', { name: selectedProcess.processName }));
    setShowDeleteDialog(false);
    setSelectedProcess(null);
  };

  const handleSave = () => {
    // 실제 구현에서는 API 호출
    if (selectedProcess) {
      alert(t('process.messages.processUpdated', { name: formData.processName }));
      setShowEditModal(false);
    } else {
      alert(t('process.messages.processAdded', { name: formData.processName }));
      setShowAddModal(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      processName: '',
      processId: '',
      client: '',
      relatedProduct: '',
      equipmentLocation: '',
      productionRequests: '',
      status: '',
      statusType: 'processing',
      capa: ''
    });
    setSelectedProcess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 관련 제품이 변경되었을 때 자동으로 고객 설정
    if (name === 'relatedProduct') {
      const selectedProduct = products.find(product => product.productCode === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        client: selectedProduct ? selectedProduct.client : '' // 제품의 고객을 자동으로 설정
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Toast 메시지 표시 함수
  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 내보내기 함수
  const handleExport = () => {
    try {
      const exportData = processes.map(process => ({
        '공정명': process.processName,
        '공정ID': process.processId,
        '고객사': process.client,
        '관련제품': process.relatedProduct,
        '설비위치': process.equipmentLocation,
        '생산요구사항': process.productionRequests,
        '상태': process.status,
        '등록일': process.registrationDate,
        'CAPA': process.capa
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '공정 목록');

      // 컬럼 너비 조정
      const colWidths = [
        { wch: 25 }, // 공정명
        { wch: 15 }, // 공정ID
        { wch: 15 }, // 고객사
        { wch: 30 }, // 관련제품
        { wch: 20 }, // 설비위치
        { wch: 20 }, // 생산요구사항
        { wch: 15 }, // 상태
        { wch: 20 }, // 등록일
        { wch: 15 }  // CAPA
      ];
      ws['!cols'] = colWidths;

      const fileName = `공정목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToastMessage(t('process.messages.exportSuccess'), 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage(t('process.messages.exportError'), 'error');
    }
  };

  // 가져오기 함수
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 데이터 검증 및 변환
        const importedProcesses = [];
        let hasErrors = false;

        jsonData.forEach((row, index) => {
          const processName = row['공정명'] || row['processName'] || '';
          const processId = row['공정ID'] || row['processId'] || '';
          const client = row['고객사'] || row['client'] || '';
          const relatedProduct = row['관련제품'] || row['relatedProduct'] || '';
          const equipmentLocation = row['설비위치'] || row['equipmentLocation'] || '';
          const productionRequests = row['생산요구사항'] || row['productionRequests'] || '';
          const status = row['상태'] || row['status'] || '';
          const capa = row['CAPA'] || row['capa'] || '';

          // 필수 필드 검증
          if (!processName || !processId || !client) {
            console.warn(t('process.messages.requiredFieldsMissing', { row: index + 2 }));
            hasErrors = true;
            return;
          }

          const process = {
            id: Date.now() + Math.random(),
            processName,
            processId,
            client,
            relatedProduct,
            equipmentLocation,
            productionRequests,
            status,
            statusType: 'processing',
            capa,
            registrationDate: new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            })
          };

          importedProcesses.push(process);
        });

        if (importedProcesses.length > 0) {
          setProcesses(prev => [...prev, ...importedProcesses]);
          showToastMessage(
            t('process.messages.importSuccess', { 
              count: importedProcesses.length, 
              errors: hasErrors ? t('process.messages.importWarning') : '' 
            }),
            hasErrors ? 'warning' : 'success'
          );
        } else {
          showToastMessage(t('process.messages.importNoData'), 'error');
        }

      } catch (error) {
        console.error('Import error:', error);
        showToastMessage(t('process.messages.importError'), 'error');
      }
    };

    reader.readAsBinaryString(file);
    event.target.value = ''; // 파일 입력 초기화
  };

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || process.statusType === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">{t('navigation.process')}</h1>
        <p className="text-gray-600 mt-1">{t('process.processDescription')}</p>
      </motion.div>

      {/* 통계 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-lg p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* 제품 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">CMI-CMMPP4020HL-1R0M</h2>
            <p className="text-sm text-gray-500">{t('process.client')}: LG VS</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{t('process.totalProcesses')}</span>
            <span className="text-sm text-orange-500">{t('process.totalRequirements')}</span>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('modals.searchPlaceholder')}
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
              <option value="all">{t('modals.allStatuses')}</option>
              <option value="processing">{t('modals.processing')}</option>
              <option value="completed">{t('modals.completed')}</option>
              <option value="paused">{t('process.paused')}</option>
              <option value="waiting">{t('process.waiting')}</option>
            </select>
            <button 
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{t('modals.export')}</span>
            </button>
            <button 
              onClick={handleImport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>{t('modals.import')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t('modals.addNewProcess')}</span>
            </button>
          </div>
        </div>

        {/* 공정 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.order')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.processName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.processId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.client')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.equipment')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.capa')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.workStatus')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('modals.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcesses.map((process, index) => (
                <motion.tr
                  key={process.id}
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
                    <div className="text-sm font-medium text-gray-900">{process.processName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">{process.processId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{process.client}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{process.equipmentLocation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(process.statusType)}
                      <span className="text-sm text-gray-600">{getStatusText(process.statusType)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-indigo-600 font-medium">{process.capa}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      process.statusType === 'processing' ? 'bg-green-100 text-green-800' :
                      process.statusType === 'completed' ? 'bg-blue-100 text-blue-800' :
                      process.statusType === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {process.statusType === 'processing' ? t('process.statusLabel.processing') :
                       process.statusType === 'completed' ? t('process.statusLabel.completed') :
                       process.statusType === 'paused' ? t('process.statusLabel.paused') :
                       t('process.statusLabel.waiting')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleView(process)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title={t('modals.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(process)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title={t('modals.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(process)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title={t('modals.delete')}
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

        {filteredProcesses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('modals.noResultsFound')}</p>
          </div>
        )}
      </motion.div>

      {/* 공정 추가/수정 모달 */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedProcess ? t('modals.editProcess') : t('modals.addNewProcess')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.processNameLabel')} *
              </label>
              <input
                type="text"
                name="processName"
                value={formData.processName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('process.processId')} *
              </label>
              <input
                type="text"
                name="processId"
                value={formData.processId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.relatedProductLabel')} *
              </label>
              <select
                name="relatedProduct"
                value={formData.relatedProduct}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">{t('modals.selectProduct')}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.productCode}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.clientLabel')} ({t('modals.autoSetting')})
              </label>
              <input
                type="text"
                name="client"
                value={formData.client}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder={t('process.messages.autoClientPlaceholder')}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('process.equipmentLocation')}
              </label>
              <select
                name="equipmentLocation"
                value={formData.equipmentLocation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('process.selectEquipment')}</option>
                {equipments.map((equipment) => (
                  <option key={equipment.id} value={equipment.name}>{equipment.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.statusTypeLabel')}
              </label>
              <select
                name="statusType"
                value={formData.statusType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="processing">{t('modals.processing')}</option>
                <option value="completed">{t('modals.completed')}</option>
                <option value="paused">{t('process.paused')}</option>
                <option value="waiting">{t('process.waiting')}</option>
              </select>
            </div>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.productionRequestsLabel')}
              </label>
              <input
                type="text"
                name="productionRequests"
                value={formData.productionRequests}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.statusLabel')}
              </label>
              <input
                type="text"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {t('modals.cancel')}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {selectedProcess ? t('modals.save') : t('modals.add')}
            </button>
          </div>
        </div>
      </Modal>

      {/* 공정 정보 보기 모달 */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProcess(null);
        }}
        title={t('process.processDetails')}
        size="lg"
      >
        {selectedProcess && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('modals.basicInfo')}</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('modals.processNameLabel')}</dt>
                    <dd className="text-sm text-gray-900 font-medium">{selectedProcess.processName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.processId')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.processId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('modals.relatedProductLabel')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.relatedProduct}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('modals.clientLabel')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.client}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('modals.productionRequestsLabel')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.productionRequests}</dd>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('modals.statusInfo')}</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('modals.statusLabel')}</dt>
                    <dd className="text-sm flex items-center gap-2">
                      {getStatusIcon(selectedProcess.statusType)}
                      <span>{getStatusText(selectedProcess.statusType)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.equipmentLocation')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.equipmentLocation}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.registrationDate')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.registrationDate}</dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
          setSelectedProcess(null);
        }}
        onConfirm={confirmDelete}
        title={t('process.deleteConfirmTitle')}
        message={`"${selectedProcess?.processName}" ${t('modals.deleteConfirmMessage')}`}
        confirmText={t('modals.delete')}
        cancelText={t('modals.cancel')}
        type="danger"
      />
    </div>
  );
};

export default ProcessPage; 