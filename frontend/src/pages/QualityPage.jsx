import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, XCircle, AlertTriangle, BarChart3, 
  FileText, Calendar, User, Search, Filter, Plus, 
  ClipboardCheck, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const QualityPage = () => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('inspection');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportGenerating, setReportGenerating] = useState(false);

  // 토스트 상태
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });

  // 리포트 관련 상태
  const [reportData, setReportData] = useState({
    reportType: '',
    dateRange: 'thisWeek',
    startDate: '',
    endDate: '',
    format: 'pdf'
  });

  // 제품 및 검사자 데이터
  const [products, setProducts] = useState([]);
  const [inspectors, setInspectors] = useState([]);

  const [formData, setFormData] = useState({
    product: '',
    totalQuantity: '',
    inspectionQuantity: '',
    inspectionTypes: [],
    passedQuantity: '',
    failedQuantity: '',
    inspector: '',
    batchNo: '',
    remarks: '',
    defectTypes: [] // 불량 유형 배열 추가
  });

  // 검사 종목 옵션
  const inspectionTypeOptions = [
    { id: 'electrical', name: '전기적 특성 검사', description: '전압, 전류, 저항 등 측정' },
    { id: 'mechanical', name: '기계적 특성 검사', description: '치수, 강도, 내구성 등 측정' },
    { id: 'thermal', name: '열적 특성 검사', description: '온도 저항, 방열 특성 등 측정' },
    { id: 'visual', name: '외관 검사', description: '표면 결함, 색상, 마감 등 육안 검사' },
    { id: 'functional', name: '기능 검사', description: '작동 상태, 성능 등 확인' },
    { id: 'packaging', name: '포장 검사', description: '포장 상태, 라벨링 등 확인' }
  ];

  // 불량 유형 옵션
  const defectTypeOptions = [
    { id: 'soldering', name: '납땜 불량', description: '납땜 부족, 과다, 냉납땜 등' },
    { id: 'missing', name: '부품 누락', description: '필수 부품이 장착되지 않음' },
    { id: 'dimension', name: '치수 오차', description: '규격 치수를 벗어남' },
    { id: 'surface', name: '표면 불량', description: '스크래치, 얼룩, 변색 등' },
    { id: 'connection', name: '접속 불량', description: '전기적 접속 문제' },
    { id: 'crack', name: '크랙/파손', description: '균열, 깨짐, 파손' },
    { id: 'contamination', name: '이물질', description: '먼지, 오염물질 혼입' },
    { id: 'marking', name: '마킹 불량', description: '인쇄, 각인 문제' },
    { id: 'alignment', name: '정렬 불량', description: '부품 위치, 각도 오차' },
    { id: 'electrical', name: '전기적 불량', description: '전압, 전류, 저항값 이상' }
  ];

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

  // 검사자 데이터 로드
  const loadInspectors = async () => {
    const mockInspectors = [
      { id: 1, name: '김품질', department: '품질관리부', level: '선임검사자', certification: 'QC Level 3' },
      { id: 2, name: '박검사', department: '품질관리부', level: '검사자', certification: 'QC Level 2' },
      { id: 3, name: '이품질', department: '품질관리부', level: '주임검사자', certification: 'QC Level 3' },
      { id: 4, name: '정검증', department: '품질관리부', level: '검사자', certification: 'QC Level 2' },
      { id: 5, name: '최품관', department: '품질관리부', level: '책임검사자', certification: 'QC Level 4' },
      { id: 6, name: '윤측정', department: '품질관리부', level: '검사자', certification: 'QC Level 1' }
    ];
    setInspectors(mockInspectors);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadInspectors()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 오늘 생성된 배치 번호 개수를 추적하기 위한 상태
  const [todayBatchCount, setTodayBatchCount] = useState(0);

  // 제품 코드에서 그룹명 추출 함수
  const extractProductGroup = (productCode) => {
    if (!productCode) return 'GEN';
    
    // 제품 코드에서 "CDSS", "CMPP", "CSSP", "CSCF" 등의 패턴을 찾아서 추출
    const patterns = [
      { pattern: /CDSS/, group: 'CDSS' },
      { pattern: /CMPP/, group: 'CMPP' },
      { pattern: /CSSP/, group: 'CSSP' },
      { pattern: /CSCF/, group: 'CSCF' },
      { pattern: /CMMP/, group: 'CMMP' }
    ];
    
    for (const { pattern, group } of patterns) {
      if (pattern.test(productCode)) {
        return group;
      }
    }
    
    return 'GEN'; // 기본값
  };

  // 배치 번호 자동 생성 (CM-QC-날짜-순번-제품그룹)
  const generateBatchNo = (selectedProduct) => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2); // 년도 뒤 2자리
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // 순번 증가 (0001부터 시작)
    const newCount = todayBatchCount + 1;
    setTodayBatchCount(newCount);
    const sequenceStr = String(newCount).padStart(4, '0');
    
    // 제품 코드에서 그룹명 추출
    let productGroup = 'GEN'; // 기본값
    if (selectedProduct) {
      const productCode = selectedProduct.split(' - ')[0]; // 제품코드만 추출
      productGroup = extractProductGroup(productCode);
    }
    
    return `CM-QC-${dateStr}-${sequenceStr}-${productGroup}`;
  };

  const handleNewInspection = () => {
    setFormData({
      ...formData,
      batchNo: '' // 초기에는 빈 값으로 설정
    });
    setShowNewInspectionModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 제품이 선택되었을 때 배치 번호 자동 생성
    if (name === 'product' && value) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        batchNo: generateBatchNo(value)
      }));
    } 
    // 불합격 수량이 변경되었을 때 불량 유형 배열 초기화
    else if (name === 'failedQuantity') {
      const failedCount = parseInt(value) || 0;
      const newDefectTypes = Array(failedCount).fill(null).map((_, index) => ({
        id: index,
        type: '',
        description: ''
      }));
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        defectTypes: newDefectTypes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleInspectionTypeChange = (typeId) => {
    setFormData(prev => ({
      ...prev,
      inspectionTypes: prev.inspectionTypes.includes(typeId)
        ? prev.inspectionTypes.filter(id => id !== typeId)
        : [...prev.inspectionTypes, typeId]
    }));
  };

  // 불량 유형 변경 처리
  const handleDefectTypeChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      defectTypes: prev.defectTypes.map((defect, i) => 
        i === index ? { ...defect, [field]: value } : defect
      )
    }));
  };

  const handleSaveInspection = () => {
    // 유효성 검사
    if (!formData.product || !formData.totalQuantity || !formData.inspectionQuantity || 
        formData.inspectionTypes.length === 0 || !formData.inspector) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    const inspectionQuantity = parseInt(formData.inspectionQuantity);
    const passedQuantity = parseInt(formData.passedQuantity) || 0;
    const failedQuantity = parseInt(formData.failedQuantity) || 0;

    if (passedQuantity + failedQuantity !== inspectionQuantity) {
      alert('합격 수량과 불합격 수량의 합이 검사량과 일치하지 않습니다.');
      return;
    }

    // 불량 유형 유효성 검사
    if (failedQuantity > 0) {
      const emptyDefectTypes = formData.defectTypes.filter(defect => !defect.type);
      if (emptyDefectTypes.length > 0) {
        alert('모든 불량 유형을 선택해주세요.');
        return;
      }
    }

    // 실제 구현에서는 API 호출
    let alertMessage = `새 검사가 시작되었습니다.\n배치번호: ${formData.batchNo}`;
    if (failedQuantity > 0) {
      alertMessage += `\n불량 유형: ${formData.defectTypes.map(d => d.type).join(', ')}`;
    }
    alert(alertMessage);
    setShowNewInspectionModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      product: '',
      totalQuantity: '',
      inspectionQuantity: '',
      inspectionTypes: [],
      passedQuantity: '',
      failedQuantity: '',
      inspector: '',
      batchNo: '',
      remarks: '',
      defectTypes: []
    });
  };

  // 리포트 관련 함수
  const handleReportInputChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 토스트 표시 함수
  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const handleGenerateReport = async () => {
    if (!reportData.reportType) {
      showToast('리포트 유형을 선택해주세요.', 'warning');
      return;
    }

    // 사용자 지정 날짜 범위인 경우 시작일과 종료일 검증
    if (reportData.dateRange === 'custom' && (!reportData.startDate || !reportData.endDate)) {
      showToast('시작일과 종료일을 모두 선택해주세요.', 'warning');
      return;
    }

    try {
      // 리포트 생성 중 표시
      setReportGenerating(true);
      showToast('리포트 생성 중입니다...', 'info');
      
      // 리포트 생성 로직 (실제로는 백엔드 API 호출)
      console.log('리포트 생성 시작:', reportData);
      
      // 모의 API 호출 (실제 환경에서는 실제 API로 교체)
      const reportResult = await simulateReportGeneration(reportData);
      
      if (reportResult.success) {
        // 생성 성공 메시지
        showToast(t('quality.reportGenerated'), 'success');
        
        // 실제 리포트 다운로드 시뮬레이션
        downloadReport(reportResult.data);
        
        setShowReportModal(false);
        
        // 리포트 데이터 초기화
        setReportData({
          reportType: '',
          dateRange: 'thisWeek',
          startDate: '',
          endDate: '',
          format: 'pdf'
        });
      } else {
        showToast(t('quality.reportGenerationFailed'), 'error');
      }
    } catch (error) {
      console.error('리포트 생성 오류:', error);
      showToast(t('quality.reportGenerationFailed'), 'error');
    } finally {
      setReportGenerating(false);
    }
  };

  // 모의 리포트 생성 함수
  const simulateReportGeneration = async (data) => {
    // 실제 API 호출 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            filename: `quality_report_${data.reportType}_${Date.now()}.${data.format}`,
            content: generateReportContent(data),
            format: data.format
          }
        });
      }, 1500); // 1.5초 대기 (리포트 생성 시뮬레이션)
    });
  };

  // 리포트 내용 생성
  const generateReportContent = (data) => {
    const reportTypes = {
      inspection: '검사 리포트',
      defect: '불량 분석 리포트', 
      trend: '품질 트렌드 리포트',
      comprehensive: '종합 품질 리포트'
    };

    const content = {
      title: reportTypes[data.reportType],
      period: getDateRangeDisplay(),
      generatedAt: new Date().toLocaleString('ko-KR'),
      data: getReportData(data.reportType)
    };

    return content;
  };

  // 리포트 유형별 데이터 생성
  const getReportData = (reportType) => {
    switch (reportType) {
      case 'inspection':
        return {
          totalInspections: qualityInspections.length,
          totalInspected: totalInspected,
          passRate: passRate + '%',
          defectRate: defectRate + '%',
          inspections: qualityInspections
        };
      case 'defect':
        return {
          defectStatistics: defectStatistics,
          totalDefects: defectStatistics.reduce((sum, stat) => sum + stat.count, 0)
        };
      case 'trend':
        return {
          monthlyTrend: '품질 개선 추세 데이터',
          recommendations: '품질 개선 권고사항'
        };
      case 'comprehensive':
        return {
          summary: '종합 품질 분석 결과',
          inspectionData: qualityInspections,
          defectData: defectStatistics,
          trends: '전반적인 품질 트렌드'
        };
      default:
        return {};
    }
  };

  // 리포트 다운로드 함수
  const downloadReport = (reportData) => {
    const { filename, content, format } = reportData;
    
    let downloadContent;
    let mimeType;
    
    switch (format) {
      case 'pdf':
        // PDF 형태로 다운로드 (실제로는 PDF 라이브러리 사용)
        downloadContent = `PDF 리포트: ${JSON.stringify(content, null, 2)}`;
        mimeType = 'application/pdf';
        break;
      case 'excel':
        // Excel 형태로 다운로드 (실제로는 Excel 라이브러리 사용)
        downloadContent = `Excel 리포트: ${JSON.stringify(content, null, 2)}`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        // CSV 형태로 다운로드
        downloadContent = convertToCSV(content);
        mimeType = 'text/csv';
        break;
      default:
        downloadContent = JSON.stringify(content, null, 2);
        mimeType = 'application/json';
    }
    
    // 파일 다운로드
    const blob = new Blob([downloadContent], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // CSV 변환 함수
  const convertToCSV = (data) => {
    if (data.inspections) {
      const headers = ['검사ID', '배치번호', '제품', '검사수량', '합격', '불합격', '검사자', '날짜'];
      const rows = data.inspections.map(inspection => [
        inspection.id,
        inspection.batchNo,
        inspection.product,
        inspection.inspected,
        inspection.passed,
        inspection.failed,
        inspection.inspector,
        inspection.date
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    return JSON.stringify(data, null, 2);
  };

  const getDateRangeDisplay = () => {
    const today = new Date();
    switch (reportData.dateRange) {
      case 'today':
        return today.toLocaleDateString('ko-KR');
      case 'thisWeek':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('ko-KR')} ~ ${weekEnd.toLocaleDateString('ko-KR')}`;
      case 'thisMonth':
        return `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
      case 'custom':
        if (reportData.startDate && reportData.endDate) {
          return `${new Date(reportData.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(reportData.endDate).toLocaleDateString('ko-KR')}`;
        }
        return '사용자 지정';
      default:
        return '';
    }
  };

  // 품질 검사 데이터
  const qualityInspections = [
    {
      id: 'QC-2024-0616-001',
      batchNo: 'CM-QC-241216-0001-CDSS',
      product: 'CMI-CDSS4018NH-4R7M - Power Inductor 4.7μH',
      quantity: 500,
      inspected: 50,
      passed: 47,
      failed: 3,
      inspector: '김품질',
      date: '2024-12-16',
      time: '09:30',
      status: 'completed',
      defectTypes: [
        { type: t('quality.solderingDefect'), count: 2 },
        { type: t('quality.missingComponent'), count: 1 }
      ],
      testResults: {
        electrical: { status: 'pass', value: '95.2%' },
        mechanical: { status: 'pass', value: '98.1%' },
        thermal: { status: 'fail', value: '85.3%' },
        visual: { status: 'pass', value: '94.0%' }
      }
    },
    {
      id: 'QC-2024-0616-002',
      batchNo: 'CM-QC-241216-0002-CMPP',
      product: 'CMI-CMPP4020HL-1ROM - Coupled Inductor 1.0μH',
      quantity: 300,
      inspected: 30,
      passed: 29,
      failed: 1,
      inspector: '박검사',
      date: '2024-12-16',
      time: '11:15',
      status: 'completed',
      defectTypes: [
        { type: t('quality.dimensionError'), count: 1 }
      ],
      testResults: {
        electrical: { status: 'pass', value: '97.8%' },
        mechanical: { status: 'pass', value: '96.5%' },
        thermal: { status: 'pass', value: '92.1%' },
        visual: { status: 'pass', value: '98.2%' }
      }
    },
    {
      id: 'QC-2024-0616-003',
      batchNo: 'CM-QC-241216-0003-CSCF',
      product: 'CME-CSCF3225B-100T30-A - Common Mode Choke 100μH',
      quantity: 200,
      inspected: 20,
      passed: 18,
      failed: 2,
      inspector: '이품질',
      date: '2024-12-16',
      time: '14:45',
      status: 'in-progress',
      defectTypes: [
        { type: t('quality.surfaceDefect'), count: 1 },
        { type: t('quality.connectionDefect'), count: 1 }
      ],
      testResults: {
        electrical: { status: 'pass', value: '93.7%' },
        mechanical: { status: 'pass', value: '95.2%' },
        thermal: { status: 'pass', value: '88.9%' },
        visual: { status: 'fail', value: '89.1%' }
      }
    }
  ];

  // 불량률 통계 데이터
  const defectStatistics = [
    { category: t('quality.solderingDefect'), count: 15, percentage: 35.7 },
    { category: t('quality.missingComponent'), count: 8, percentage: 19.0 },
    { category: t('quality.dimensionError'), count: 7, percentage: 16.7 },
    { category: t('quality.surfaceDefect'), count: 6, percentage: 14.3 },
    { category: t('quality.connectionDefect'), count: 4, percentage: 9.5 },
    { category: t('quality.others'), count: 2, percentage: 4.8 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'fail': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4" />;
      case 'fail': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pass': return t('quality.passed');
      case 'fail': return t('quality.failed');
      case 'completed': return t('quality.completed');
      case 'in-progress': return t('quality.inProgress');
      default: return status;
    }
  };

  const totalInspected = qualityInspections.reduce((sum, item) => sum + item.inspected, 0);
  const totalPassed = qualityInspections.reduce((sum, item) => sum + item.passed, 0);
  const totalFailed = qualityInspections.reduce((sum, item) => sum + item.failed, 0);
  const passRate = ((totalPassed / totalInspected) * 100).toFixed(1);
  const defectRate = ((totalFailed / totalInspected) * 100).toFixed(1);

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
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('quality.title')}</h1>
            <p className="text-gray-600 mt-1">{t('quality.subtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleNewInspection}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('quality.newInspection')}</span>
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              {t('quality.generateReport')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* 품질 현황 요약 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('quality.todayInspection')}</p>
              <p className="text-2xl font-bold text-blue-600">{totalInspected}</p>
              <p className="text-xs text-green-600 mt-1">+12% {t('dashboard.vsYesterday')}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('quality.passRate')}</p>
              <p className="text-2xl font-bold text-green-600">{passRate}{t('quality.percent')}</p>
              <p className="text-xs text-green-600 mt-1">{t('quality.targetRate')}: 95{t('quality.percent')}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('quality.defectRate')}</p>
              <p className="text-2xl font-bold text-red-600">{defectRate}{t('quality.percent')}</p>
              <p className="text-xs text-red-600 mt-1">{t('quality.targetRate')}: {'<'}3{t('quality.percent')}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('quality.inProgressInspection')}</p>
              <p className="text-2xl font-bold text-yellow-600">
                {qualityInspections.filter(q => q.status === 'in-progress').length}
              </p>
              <p className="text-xs text-gray-600 mt-1">{t('quality.inspectionBatch')}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 탭 메뉴 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200"
      >
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('inspection')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'inspection'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('quality.inspectionStatus')}
            </button>
            <button
              onClick={() => setSelectedTab('statistics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('quality.defectStatistics')}
            </button>
            <button
              onClick={() => setSelectedTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('quality.reports')}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'inspection' && (
            <div className="space-y-4">
              {qualityInspections.map((inspection) => (
                <motion.div 
                  key={inspection.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{inspection.id}</h3>
                        <p className="text-sm text-gray-500">{inspection.product}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {getStatusIcon(inspection.status)}
                        <span className="ml-1">{getStatusText(inspection.status)}</span>
                      </span>
                      <button 
                        onClick={() => setSelectedBatch(inspection)}
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition-colors"
                      >
                        {t('common.details')}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('quality.batch')}:</span>
                      <span className="ml-1 font-medium">{inspection.batchNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('quality.inspectionQuantity')}:</span>
                      <span className="ml-1 font-medium">{inspection.inspected}/{inspection.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('quality.passedFailed')}:</span>
                      <span className="ml-1 font-medium text-green-600">{inspection.passed}</span>
                      <span className="mx-1">/</span>
                      <span className="font-medium text-red-600">{inspection.failed}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('quality.inspector')}:</span>
                      <span className="ml-1 font-medium">{inspection.inspector}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {selectedTab === 'statistics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('quality.defectTypeAnalysis')}</h3>
                <div className="space-y-3">
                  {defectStatistics.map((stat, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="font-medium">{stat.category}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{stat.count} {t('quality.cases')}</span>
                        <span className="font-bold text-red-600">{stat.percentage}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('quality.monthlyQualityTrend')}</h3>
                <div className="bg-gray-100 rounded-lg p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">{t('quality.monthlyQualityTrend')} {t('common.loading')}</p>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'reports' && (
            <div className="space-y-6">
              {/* 리포트 생성 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('quality.generateReport')}</h3>
                  <p className="text-sm text-gray-600 mt-1">품질 관리 데이터를 기반으로 다양한 리포트를 생성하세요</p>
        </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('quality.generateReport')}</span>
                </button>
      </div>

              {/* 리포트 유형 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">검사</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{t('quality.inspectionReport')}</h4>
                  <p className="text-sm text-gray-600">검사 결과 및 통계 분석</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-red-600 text-white rounded-lg">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-red-600 bg-red-200 px-2 py-1 rounded-full">불량</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{t('quality.defectReport')}</h4>
                  <p className="text-sm text-gray-600">불량 유형별 분석 및 원인</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-600 text-white rounded-lg">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">트렌드</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{t('quality.qualityTrendReport')}</h4>
                  <p className="text-sm text-gray-600">품질 개선 추세 및 예측</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full">종합</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{t('quality.comprehensiveReport')}</h4>
                  <p className="text-sm text-gray-600">전체 품질 관리 종합 분석</p>
                </motion.div>
              </div>

              {/* 최근 생성된 리포트 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 생성된 리포트</h3>
                <div className="space-y-3">
                  {[
                    { 
                      id: 1, 
                      name: '일일 품질 검사 리포트', 
                      type: '검사 리포트', 
                      date: '2024-01-15', 
                      format: 'PDF',
                      status: 'completed'
                    },
                    { 
                      id: 2, 
                      name: '주간 불량 분석 리포트', 
                      type: '불량 리포트', 
                      date: '2024-01-14', 
                      format: 'Excel',
                      status: 'completed'
                    },
                    { 
                      id: 3, 
                      name: '월간 품질 트렌드 리포트', 
                      type: '트렌드 리포트', 
                      date: '2024-01-12', 
                      format: 'PDF',
                      status: 'processing'
                    }
                  ].map((report) => (
                    <motion.div 
                      key={report.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{report.name}</h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>{report.type}</span>
                            <span>•</span>
                            <span>{report.date}</span>
                            <span>•</span>
                            <span>{report.format}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {report.status === 'completed' ? (
                          <>
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                              완료
                            </span>
                            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                            처리중
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 새 검사 시작 모달 */}
      <Modal
        isOpen={showNewInspectionModal}
        onClose={() => {
          setShowNewInspectionModal(false);
          resetForm();
        }}
        title="새 검사 시작"
        size="xl"
      >
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">기본 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제품 선택 *
                </label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">제품을 선택하세요</option>
                  {products.map((product) => (
                    <option key={product.id} value={`${product.productCode} - ${product.productName}`}>
                      {product.productCode} - {product.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배치 번호
                </label>
                <input
                  type="text"
                  name="batchNo"
                  value={formData.batchNo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* 수량 정보 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">수량 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 생산 수량 *
                </label>
                <input
                  type="number"
                  name="totalQuantity"
                  value={formData.totalQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 1000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검사 수량 *
                </label>
                <input
                  type="number"
                  name="inspectionQuantity"
                  value={formData.inspectionQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검사자 *
                </label>
                <select
                  name="inspector"
                  value={formData.inspector}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">검사자를 선택하세요</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.name}>
                      {inspector.name} ({inspector.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 검사 종목 선택 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">검사 종목 선택 *</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inspectionTypeOptions.map((type) => (
                <label key={type.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inspectionTypes.includes(type.id)}
                    onChange={() => handleInspectionTypeChange(type.id)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.name}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 검사 결과 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">검사 결과</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  합격 수량
                </label>
                <input
                  type="number"
                  name="passedQuantity"
                  value={formData.passedQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 95"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  불합격 수량
                </label>
                <input
                  type="number"
                  name="failedQuantity"
                  value={formData.failedQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 5"
                />
              </div>
            </div>
          </div>

          {/* 불량 유형 선택 */}
          {formData.defectTypes.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                불량 유형 ({formData.defectTypes.length}개)
              </h4>
              <div className="space-y-3">
                {formData.defectTypes.map((defect, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">불량 {index + 1}번</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          불량 유형 *
                        </label>
                        <select
                          value={defect.type}
                          onChange={(e) => handleDefectTypeChange(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">불량 유형을 선택하세요</option>
                          {defectTypeOptions.map(option => (
                            <option key={option.id} value={option.name}>
                              {option.name} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          상세 설명
                        </label>
                        <input
                          type="text"
                          value={defect.description}
                          onChange={(e) => handleDefectTypeChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="불량 상세 내용을 입력하세요"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 비고 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비고
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="추가 사항이나 특이사항을 입력하세요"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
              <button 
              onClick={() => {
                setShowNewInspectionModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSaveInspection}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              검사 시작
              </button>
            </div>
        </div>
      </Modal>

      {/* 검사 상세 모달 */}
      {selectedBatch && (
        <Modal
          isOpen={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={t('quality.inspectionDetails')}
          size="lg"
        >
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.basicInfo')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.inspectionId')}</label>
                    <p className="text-sm text-gray-900">{selectedBatch.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.batchNumber')}</label>
                    <p className="text-sm text-gray-900">{selectedBatch.batchNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('production.product')}</label>
                    <p className="text-sm text-gray-900">{selectedBatch.product}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.inspectionDate')}</label>
                    <p className="text-sm text-gray-900">{selectedBatch.date} {selectedBatch.time}</p>
                  </div>
                </div>
              </div>

              {/* 검사 결과 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.inspectionResults')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.totalQuantity')}</label>
                    <p className="text-sm text-gray-900">{selectedBatch.quantity} {t('quality.items')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.inspectedQuantity')}</label>
                    <p className="text-sm text-gray-900">{selectedBatch.inspected} {t('quality.items')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.passed')}</label>
                    <p className="text-sm text-green-600 font-medium">{selectedBatch.passed} {t('quality.items')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{t('quality.failed')}</label>
                    <p className="text-sm text-red-600 font-medium">{selectedBatch.failed} {t('quality.items')}</p>
                  </div>
                </div>
              </div>

              {/* 테스트 결과 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.testResults')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{t('quality.electrical')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{selectedBatch.testResults.electrical.value}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBatch.testResults.electrical.status)}`}>
                        {getStatusIcon(selectedBatch.testResults.electrical.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{t('quality.mechanical')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{selectedBatch.testResults.mechanical.value}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBatch.testResults.mechanical.status)}`}>
                        {getStatusIcon(selectedBatch.testResults.mechanical.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{t('quality.thermal')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{selectedBatch.testResults.thermal.value}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBatch.testResults.thermal.status)}`}>
                        {getStatusIcon(selectedBatch.testResults.thermal.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{t('quality.visual')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{selectedBatch.testResults.visual.value}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBatch.testResults.visual.status)}`}>
                        {getStatusIcon(selectedBatch.testResults.visual.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 불량 유형 */}
              {selectedBatch.defectTypes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.defectTypes')}</h4>
                  <div className="space-y-2">
                    {selectedBatch.defectTypes.map((defect, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-red-800">{defect.type}</span>
                        <span className="text-sm text-red-600">{defect.count} {t('quality.cases')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </Modal>
      )}

      {/* 리포트 생성 모달 */}
      <Modal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportData({
            reportType: '',
            dateRange: 'thisWeek',
            startDate: '',
            endDate: '',
            format: 'pdf'
          });
        }}
        title={t('quality.generateReport')}
        size="lg"
      >
        <div className="space-y-6">
          {/* 리포트 유형 선택 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.reportType')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'inspection', name: t('quality.inspectionReport'), description: '검사 결과 및 통계 분석', icon: ClipboardCheck },
                { id: 'defect', name: t('quality.defectReport'), description: '불량 유형별 분석 및 원인', icon: AlertTriangle },
                { id: 'trend', name: t('quality.qualityTrendReport'), description: '품질 개선 추세 및 예측', icon: BarChart3 },
                { id: 'comprehensive', name: t('quality.comprehensiveReport'), description: '전체 품질 관리 종합 분석', icon: FileText }
              ].map((type) => {
                const IconComponent = type.icon;
                return (
                  <label key={type.id} className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      value={type.id}
                      checked={reportData.reportType === type.id}
                      onChange={handleReportInputChange}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <IconComponent className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{type.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 기간 선택 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.dateRange')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { id: 'today', name: '오늘' },
                { id: 'thisWeek', name: '이번 주' },
                { id: 'thisMonth', name: '이번 달' },
                { id: 'custom', name: '사용자 지정' }
              ].map((range) => (
                <label key={range.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value={range.id}
                    checked={reportData.dateRange === range.id}
                    onChange={handleReportInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900">{range.name}</span>
                </label>
              ))}
            </div>

            {/* 사용자 지정 날짜 */}
            {reportData.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={reportData.startDate}
                    onChange={handleReportInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={reportData.endDate}
                    onChange={handleReportInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
          </div>
        </div>
      )}

            {/* 선택된 기간 표시 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">선택된 기간:</span>
                <span className="text-sm text-blue-600">{getDateRangeDisplay()}</span>
              </div>
            </div>
          </div>

          {/* 파일 형식 선택 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('quality.reportFormat')}</h4>
            <div className="flex space-x-4">
              {[
                { id: 'pdf', name: t('quality.pdf'), description: '문서 형태로 출력' },
                { id: 'excel', name: t('quality.excel'), description: '데이터 분석 가능' },
                { id: 'csv', name: t('quality.csv'), description: '원시 데이터 형태' }
              ].map((format) => (
                <label key={format.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={reportData.format === format.id}
                    onChange={handleReportInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{format.name}</span>
                    <p className="text-xs text-gray-500">{format.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 리포트 미리보기 */}
          {reportData.reportType && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">리포트 미리보기</h4>
              <div className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">
                  {reportData.reportType === 'inspection' && '검사 리포트'}
                  {reportData.reportType === 'defect' && '불량 분석 리포트'}
                  {reportData.reportType === 'trend' && '품질 트렌드 리포트'}
                  {reportData.reportType === 'comprehensive' && '종합 품질 리포트'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {getDateRangeDisplay()} • {reportData.format.toUpperCase()} 형식
                </p>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => {
                setShowReportModal(false);
                setReportData({
                  reportType: '',
                  dateRange: 'thisWeek',
                  startDate: '',
                  endDate: '',
                  format: 'pdf'
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={reportGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {reportGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{t('quality.generateReportBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 토스트 알림 */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
};

export default QualityPage; 