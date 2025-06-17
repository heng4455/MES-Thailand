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

const EquipmentPage = () => {
  const { t } = useTranslation();
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

  // 등록된 공정 데이터 (ProcessPage에서 가져와야 할 데이터)
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

  // 공정 데이터 로드
  const loadProcesses = async () => {
    const mockProcesses = [
      { id: 1, processName: 'Core Press', processId: '7d7e4073', client: 'LG VS' },
      { id: 2, processName: 'Winding + Welding', processId: 'cfcacfea', client: 'LG VS' },
      { id: 3, processName: 'Molding', processId: '2d05064d', client: 'LG VS' },
      { id: 4, processName: 'Bending + Reflow', processId: 'a490d4bc', client: 'LG VS' },
      { id: 5, processName: 'Inspec Appearnace + Reel Packing', processId: '6fbae315', client: 'LG VS' },
      { id: 6, processName: 'Reel Inspec', processId: '8507533a', client: 'LG VS' }
    ];
    setProcesses(mockProcesses);
  };

  // 제품 데이터 로드
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

  // 실제 설비 데이터 (수정된 구조)
  const [equipmentList, setEquipmentList] = useState([
    {
      id: 'SMT-001',
      equipmentName: 'SMT 라인 #1',
      equipmentId: 'SMT-001',
      type: 'Surface Mount Technology',
      status: 'running',
      health: 95,
      temperature: 42.5,
      vibration: 0.12,
      power: 87.3,
      efficiency: 94.2,
      lastMaintenance: '2024-06-10',
      nextMaintenance: '2024-06-25',
      operatingHours: 2847,
      equipmentLocation: 'Floor 1, Zone A',
      operator: '김철수',
      alarms: [],
      relatedProcess: 'Core Press',
      relatedProduct: 'CMI-CMPP4020HL-1ROM',
      capa: '150 ea/h',
      parameters: {
        speed: 1200,
        pressure: 2.4,
        flow: 85
      }
    },
    {
      id: 'CNC-002',
      equipmentName: 'CNC 머시닝센터 #2',
      equipmentId: 'CNC-002',
      type: 'Computer Numerical Control',
      status: 'maintenance',
      health: 78,
      temperature: 55.2,
      vibration: 0.25,
      power: 0,
      efficiency: 0,
      lastMaintenance: '2024-06-16',
      nextMaintenance: '2024-07-01',
      operatingHours: 4521,
      equipmentLocation: 'Floor 2, Zone B',
      operator: '박영희',
      alarms: [
        { type: 'warning', message: t('production.maintenanceInProgress'), time: '14:30' }
      ],
      relatedProcess: 'Winding + Welding',
      relatedProduct: 'CMI-CMPP5030HL-1ROM',
      capa: '120 ea/h',
      parameters: {
        speed: 0,
        pressure: 0,
        flow: 0
      }
    },
    {
      id: 'ROB-003',
      equipmentName: '로봇 암 #3',
      equipmentId: 'ROB-003',
      type: 'Industrial Robot',
      status: 'error',
      health: 45,
      temperature: 68.1,
      vibration: 0.45,
      power: 45.2,
      efficiency: 0,
      lastMaintenance: '2024-05-28',
      nextMaintenance: '2024-06-18',
      operatingHours: 6832,
      equipmentLocation: 'Floor 1, Zone C',
      operator: '이민수',
      alarms: [
        { type: 'error', message: '과열 감지', time: '13:45' },
        { type: 'warning', message: '진동 수치 초과', time: '13:50' }
      ],
      relatedProcess: 'Molding',
      relatedProduct: 'CMI-CMPP5030HL-220M',
      capa: '80 ea/h',
      parameters: {
        speed: 0,
        pressure: 1.2,
        flow: 32
      }
    },
    {
      id: 'CON-004',
      equipmentName: '컨베이어 시스템 #4',
      equipmentId: 'CON-004',
      type: 'Conveyor System',
      status: 'running',
      health: 88,
      temperature: 35.8,
      vibration: 0.08,
      power: 23.7,
      efficiency: 91.5,
      lastMaintenance: '2024-06-12',
      nextMaintenance: '2024-06-30',
      operatingHours: 3264,
      equipmentLocation: 'Floor 1, Zone D',
      operator: '정수민',
      alarms: [],
      relatedProcess: 'Bending + Reflow',
      relatedProduct: 'CMI-CDSS5040NH-220M',
      capa: '200 ea/h',
      parameters: {
        speed: 850,
        pressure: 1.8,
        flow: 95
      }
    },
    {
      id: 'TEST-005',
      equipmentName: '자동 검사 장비 #5',
      equipmentId: 'TEST-005',
      type: 'Automated Test Equipment',
      status: 'idle',
      health: 92,
      temperature: 28.3,
      vibration: 0.05,
      power: 12.4,
      efficiency: 0,
      lastMaintenance: '2024-06-14',
      nextMaintenance: '2024-07-05',
      operatingHours: 1847,
      equipmentLocation: 'Floor 2, Zone A',
      operator: '최혜진',
      alarms: [],
      relatedProcess: 'Inspec Appearnace + Reel Packing',
      relatedProduct: 'CMI-CDSS4018NH-4R7M',
      capa: '100 ea/h',
      parameters: {
        speed: 0,
        pressure: 0.8,
        flow: 15
      }
    },
    {
      id: 'WIND-008',
      equipmentName: '와인딩 장비 #8',
      equipmentId: 'WIND-008',
      type: 'Winding Equipment',
      status: 'running',
      health: 91,
      temperature: 31.2,
      vibration: 0.07,
      power: 45.8,
      efficiency: 89.3,
      lastMaintenance: '2024-06-08',
      nextMaintenance: '2024-06-28',
      operatingHours: 2156,
      equipmentLocation: 'Floor 1, Zone E',
      operator: '김민정',
      alarms: [],
      relatedProcess: 'Reel Inspec',
      relatedProduct: 'CMI-CDSS4018NH-6R8M',
      capa: '90 ea/h',
      parameters: {
        speed: 950,
        pressure: 2.1,
        flow: 72
      }
    }
  ]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadProcesses(),
        loadProducts()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

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

  const confirmDelete = () => {
    alert(`"${selectedEquipment.equipmentName}" 설비가 삭제되었습니다.`);
    setShowDeleteDialog(false);
    setSelectedEquipment(null);
  };

  const handleSave = () => {
    if (selectedEquipment) {
      alert(`"${formData.equipmentName}" 설비가 수정되었습니다.`);
      setShowEditModal(false);
    } else {
      alert(`"${formData.equipmentName}" 설비가 추가되었습니다.`);
      setShowAddModal(false);
    }
    resetForm();
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

  // 내보내기 함수
  const handleExport = () => {
    try {
      const exportData = equipmentList.map(equipment => ({
        '설비명': equipment.equipmentName,
        '설비ID': equipment.equipmentId,
        '타입': equipment.type,
        '상태': getStatusText(equipment.status),
        '관련공정': equipment.relatedProcess,
        '관련제품': equipment.relatedProduct,
        '설비위치': equipment.equipmentLocation,
        'CAPA': equipment.capa,
        '운전시간': equipment.operatingHours + '시간',
        '효율성': equipment.efficiency + '%',
        '온도': equipment.temperature + '°C',
        '진동': equipment.vibration + 'mm/s',
        '전력': equipment.power + 'kW',
        '담당자': equipment.operator,
        '마지막정비': equipment.lastMaintenance,
        '다음정비': equipment.nextMaintenance
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '설비 목록');

      // 컬럼 너비 조정
      const colWidths = [
        { wch: 20 }, // 설비명
        { wch: 15 }, // 설비ID
        { wch: 25 }, // 타입
        { wch: 10 }, // 상태
        { wch: 25 }, // 관련공정
        { wch: 30 }, // 관련제품
        { wch: 20 }, // 설비위치
        { wch: 15 }, // CAPA
        { wch: 15 }, // 운전시간
        { wch: 10 }, // 효율성
        { wch: 10 }, // 온도
        { wch: 10 }, // 진동
        { wch: 10 }, // 전력
        { wch: 10 }, // 담당자
        { wch: 12 }, // 마지막정비
        { wch: 12 }  // 다음정비
      ];
      ws['!cols'] = colWidths;

      const fileName = `설비목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToastMessage('설비 데이터가 성공적으로 내보내졌습니다.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage('내보내기 중 오류가 발생했습니다.', 'error');
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
        const importedEquipments = [];
        let hasErrors = false;

        jsonData.forEach((row, index) => {
          const equipmentName = row['설비명'] || row['equipmentName'] || '';
          const equipmentId = row['설비ID'] || row['equipmentId'] || '';
          const type = row['타입'] || row['type'] || 'Equipment';
          const status = row['상태'] || row['status'] || 'idle';
          const relatedProcess = row['관련공정'] || row['relatedProcess'] || '';
          const relatedProduct = row['관련제품'] || row['relatedProduct'] || '';
          const equipmentLocation = row['설비위치'] || row['equipmentLocation'] || '';
          const capa = row['CAPA'] || row['capa'] || '';
          const operator = row['담당자'] || row['operator'] || '';

          // 필수 필드 검증
          if (!equipmentName || !equipmentId) {
            console.warn(`행 ${index + 2}: 필수 필드가 누락되었습니다.`);
            hasErrors = true;
            return;
          }

          const equipment = {
            id: equipmentId,
            equipmentName,
            equipmentId,
            type,
            status: ['running', 'idle', 'maintenance', 'error'].includes(status) ? status : 'idle',
            health: Math.floor(Math.random() * 20) + 80, // 80-100 랜덤
            temperature: (Math.random() * 30 + 25).toFixed(1), // 25-55°C 랜덤
            vibration: (Math.random() * 0.4 + 0.05).toFixed(2), // 0.05-0.45 랜덤
            power: (Math.random() * 80 + 10).toFixed(1), // 10-90kW 랜덤
            efficiency: status === 'running' ? Math.floor(Math.random() * 20) + 80 : 0,
            lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            operatingHours: Math.floor(Math.random() * 5000) + 1000,
            equipmentLocation,
            operator: operator || '미지정',
            alarms: [],
            relatedProcess,
            relatedProduct,
            capa,
            parameters: {
              speed: status === 'running' ? Math.floor(Math.random() * 1000) + 500 : 0,
              pressure: (Math.random() * 2 + 0.5).toFixed(1),
              flow: status === 'running' ? Math.floor(Math.random() * 80) + 20 : 0
            }
          };

          importedEquipments.push(equipment);
        });

        if (importedEquipments.length > 0) {
          setEquipmentList(prev => [...prev, ...importedEquipments]);
          showToastMessage(
            `${importedEquipments.length}개의 설비가 성공적으로 가져와졌습니다.${hasErrors ? ' (일부 오류 있음)' : ''}`,
            hasErrors ? 'warning' : 'success'
          );
        } else {
          showToastMessage('가져올 수 있는 유효한 데이터가 없습니다.', 'error');
        }

      } catch (error) {
        console.error('Import error:', error);
        showToastMessage('파일을 읽는 중 오류가 발생했습니다.', 'error');
      }
    };

    reader.readAsBinaryString(file);
    event.target.value = ''; // 파일 입력 초기화
  };

  // 필터링된 설비 목록
  const filteredEquipments = equipmentList.filter(equipment => {
    const matchesSearch = equipment.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.relatedProcess.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || equipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-50';
      case 'idle': return 'text-blue-600 bg-blue-50';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <CheckCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  const getHealthColor = (health) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running': return t('equipment.runningStatus');
      case 'idle': return t('equipment.idleStatus');
      case 'maintenance': return t('equipment.maintenanceStatus');
      case 'error': return t('equipment.errorStatus');
      default: return t('equipment.unknownStatus');
    }
  };

  const runningCount = equipmentList.filter(eq => eq.status === 'running').length;
  const errorCount = equipmentList.filter(eq => eq.status === 'error').length;
  const maintenanceCount = equipmentList.filter(eq => eq.status === 'maintenance').length;
  const totalAlarms = equipmentList.reduce((sum, eq) => sum + eq.alarms.length, 0);

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
        <h1 className="text-2xl font-bold text-gray-900">{t('equipment.equipmentManagement')}</h1>
        <p className="text-gray-600 mt-1">{t('equipment.equipmentSubtitle')}</p>
      </motion.div>

      {/* 설비 현황 요약 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('equipment.operatingEquipmentStatus')}</p>
              <p className="text-2xl font-bold text-green-600">{runningCount}</p>
              <p className="text-xs text-gray-500 mt-1">{t('equipment.totalEquipmentCount')} {equipmentList.length}대</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('equipment.errorEquipmentStatus')}</p>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              <p className="text-xs text-red-600 mt-1">{t('equipment.immediateActionRequired')}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('equipment.maintenanceEquipmentStatus')}</p>
              <p className="text-2xl font-bold text-yellow-600">{maintenanceCount}</p>
              <p className="text-xs text-yellow-600 mt-1">{t('equipment.scheduledMaintenanceText')}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Wrench className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('equipment.activeAlarmsStatus')}</p>
              <p className="text-2xl font-bold text-orange-600">{totalAlarms}</p>
              <p className="text-xs text-orange-600 mt-1">{t('equipment.unresolvedAlarmsText')}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 설비 테이블 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('equipment.equipmentList')}</h2>
            <p className="text-sm text-gray-500">{t('equipment.equipmentListSubtitle')}</p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('equipment.equipmentSearchPlaceholder')}
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
              <option value="running">{t('equipment.runningStatus')}</option>
              <option value="idle">{t('equipment.idleStatus')}</option>
              <option value="maintenance">{t('equipment.maintenanceStatus')}</option>
              <option value="error">{t('equipment.errorStatus')}</option>
            </select>
            <button 
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{t('common.export')}</span>
            </button>
            <button 
              onClick={handleImport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>{t('common.import')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('equipment.addEquipment')}</span>
            </button>
          </div>
        </div>

        {/* 설비 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.order')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.equipmentName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.equipmentId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.relatedProcess')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.relatedProduct')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.equipmentCapa')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment.equipmentStatus')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.actions')}</th>
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">{equipment.equipmentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.relatedProcess}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{equipment.relatedProduct}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-indigo-600 font-medium">{equipment.capa}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleView(equipment)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(equipment)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(equipment)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="삭제"
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
            <p className="text-gray-500">검색 결과가 없습니다.</p>
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
        title={selectedEquipment ? '설비 수정' : '새 설비 추가'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설비명 *
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
                설비ID *
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
                관련 공정 *
              </label>
              <select
                name="relatedProcess"
                value={formData.relatedProcess}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">공정을 선택하세요</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.processName}>
                    {process.processName} ({process.processId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설비 위치
              </label>
              <input
                type="text"
                name="equipmentLocation"
                value={formData.equipmentLocation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="예: Floor 1, Zone A"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="idle">대기중</option>
                <option value="running">가동중</option>
                <option value="maintenance">점검중</option>
                <option value="error">오류</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CAPA
              </label>
              <input
                type="text"
                name="capa"
                value={formData.capa}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="예: 150 ea/h"
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
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {selectedEquipment ? '수정' : '추가'}
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
          title="설비 상세 정보"
          size="lg"
        >
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">기본 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">설비명</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.equipmentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">설비ID</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.equipmentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">관련 공정</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.relatedProcess}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">관련 제품</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.relatedProduct}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">설비 위치</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.equipmentLocation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CAPA</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.capa}</p>
                </div>
              </div>
            </div>

            {/* 운전 정보 */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">운전 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">총 운전시간</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.operatingHours} 시간</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">효율성</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.efficiency}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">마지막 정비</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.lastMaintenance}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">다음 정비</label>
                  <p className="text-sm text-gray-900">{selectedEquipment.nextMaintenance}</p>
                </div>
              </div>
            </div>

            {/* 실시간 상태 */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">실시간 상태</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Thermometer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">온도</p>
                  <p className="text-lg font-bold text-orange-600">{selectedEquipment.temperature}°C</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">진동</p>
                  <p className="text-lg font-bold text-purple-600">{selectedEquipment.vibration}mm/s</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">전력</p>
                  <p className="text-lg font-bold text-yellow-600">{selectedEquipment.power}kW</p>
                </div>
              </div>
            </div>

            {/* 알람 */}
            {selectedEquipment.alarms.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">활성 알람</h4>
                <div className="space-y-2">
                  {selectedEquipment.alarms.map((alarm, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      alarm.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          alarm.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <p className="text-sm font-medium">{alarm.message}</p>
                        <span className="text-xs text-gray-500">{alarm.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="설비 삭제"
        message={`"${selectedEquipment?.equipmentName}" 설비를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </div>
  );
};

export default EquipmentPage; 