import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiPackage, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit3, 
  FiTrash2, 
  FiDownload,
  FiUpload,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart,
  FiChevronDown
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Toast from '../components/Toast';

const InventoryPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
      if (showImportMenu && !event.target.closest('.import-dropdown')) {
        setShowImportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu, showImportMenu]);
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });
  const [formData, setFormData] = useState({
    code: '',
    nameKo: '',
    nameEn: '',
    category: 'raw_material',
    currentStock: '',
    unit: '',
    minStock: '',
    maxStock: '',
    unitPrice: '',
    location: '',
    supplier: ''
  });
  
  const [inventoryData, setInventoryData] = useState([
    {
      id: 1,
      code: 'MTL-001',
      nameKo: '스테인리스 스틸 304',
      nameEn: 'Stainless Steel 304',
      category: 'raw_material',
      currentStock: 250,
      minStock: 100,
      maxStock: 500,
      unit: 'kg',
      unitPrice: 8500,
      supplier: '한국철강',
      location: 'A-01-01',
      lastUpdated: '2024-01-15T10:30:00',
      status: 'normal'
    },
    {
      id: 2,
      code: 'CMP-002',
      nameKo: '베어링 6202',
      nameEn: 'Bearing 6202',
      category: 'component',
      currentStock: 45,
      minStock: 50,
      maxStock: 200,
      unit: 'EA',
      unitPrice: 12000,
      supplier: 'NSK Korea',
      location: 'B-02-03',
      lastUpdated: '2024-01-14T15:20:00',
      status: 'low_stock'
    },
    {
      id: 3,
      code: 'FIN-003',
      nameKo: '완성품 A타입',
      nameEn: 'Finished Product Type A',
      category: 'finished_product',
      currentStock: 120,
      minStock: 80,
      maxStock: 300,
      unit: 'EA',
      unitPrice: 75000,
      supplier: '자체생산',
      location: 'C-01-05',
      lastUpdated: '2024-01-15T09:45:00',
      status: 'normal'
    },
    {
      id: 4,
      code: 'TL-004',
      nameKo: '드릴 비트 10mm',
      nameEn: 'Drill Bit 10mm',
      category: 'tool',
      currentStock: 5,
      minStock: 20,
      maxStock: 100,
      unit: 'EA',
      unitPrice: 25000,
      supplier: '삼성도구',
      location: 'D-01-02',
      lastUpdated: '2024-01-13T14:30:00',
      status: 'critical'
    }
  ]);

  const categories = [
    { value: 'all', label: t('inventory.allCategories') },
    { value: 'raw_material', label: t('inventory.rawMaterial') },
    { value: 'component', label: t('inventory.component') },
    { value: 'finished_product', label: t('inventory.finishedProduct') },
    { value: 'tool', label: t('inventory.tool') },
    { value: 'consumable', label: t('inventory.consumable') }
  ];

  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'low_stock': return 'text-yellow-600 bg-yellow-50';
      case 'normal': return 'text-green-600 bg-green-50';
      case 'overstock': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'critical': return t('inventory.critical');
      case 'low_stock': return t('inventory.lowStock');
      case 'normal': return t('inventory.normal');
      case 'overstock': return t('inventory.overstock');
      default: return t('inventory.unknown');
    }
  };

  const getCategoryLabel = (categoryValue) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.nameKo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stockSummary = {
    total: inventoryData.length,
    critical: inventoryData.filter(item => item.status === 'critical').length,
    lowStock: inventoryData.filter(item => item.status === 'low_stock').length,
    normal: inventoryData.filter(item => item.status === 'normal').length,
    totalValue: inventoryData.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0)
  };

  const resetForm = () => {
    setFormData({
      code: '',
      nameKo: '',
      nameEn: '',
      category: 'raw_material',
      currentStock: '',
      unit: '',
      minStock: '',
      maxStock: '',
      unitPrice: '',
      location: '',
      supplier: ''
    });
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      nameKo: item.nameKo,
      nameEn: item.nameEn,
      category: item.category,
      currentStock: item.currentStock.toString(),
      unit: item.unit,
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString(),
      unitPrice: item.unitPrice.toString(),
      location: item.location,
      supplier: item.supplier
    });
    setShowAddModal(true);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm(t('inventory.confirmDelete'))) {
      setInventoryData(prev => prev.filter(item => item.id !== id));
      showToast(t('inventory.itemDeleted'), 'success');
    }
  };

  const handleSaveItem = () => {
    if (!formData.code || !formData.nameKo || !formData.currentStock) {
      showToast('필수 필드를 모두 입력해주세요.', 'error');
      return;
    }

    if (selectedItem) {
      // 수정 모드
      setInventoryData(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? {
              ...item,
              ...formData,
              currentStock: parseInt(formData.currentStock),
              minStock: parseInt(formData.minStock),
              maxStock: parseInt(formData.maxStock),
              unitPrice: parseInt(formData.unitPrice),
              lastUpdated: new Date().toISOString(),
              status: parseInt(formData.currentStock) <= parseInt(formData.minStock) / 2 ? 'critical' :
                      parseInt(formData.currentStock) <= parseInt(formData.minStock) ? 'low_stock' : 'normal'
            }
          : item
      ));
      showToast(t('inventory.itemUpdated'), 'success');
    } else {
      // 추가 모드
      const newItem = {
        id: Date.now(),
        ...formData,
        currentStock: parseInt(formData.currentStock),
        minStock: parseInt(formData.minStock),
        maxStock: parseInt(formData.maxStock),
        unitPrice: parseInt(formData.unitPrice),
        lastUpdated: new Date().toISOString(),
        status: parseInt(formData.currentStock) <= parseInt(formData.minStock) / 2 ? 'critical' :
                parseInt(formData.currentStock) <= parseInt(formData.minStock) ? 'low_stock' : 'normal'
      };
      setInventoryData(prev => [...prev, newItem]);
      showToast(t('inventory.itemAdded'), 'success');
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = (format = 'excel') => {
    try {
      // 데이터 준비
      const headers = [
        t('inventory.itemCode'),
        t('inventory.itemName') + ' (한국어)',
        t('inventory.itemName') + ' (English)',
        t('inventory.category'),
        t('inventory.currentStock'),
        t('inventory.unit'),
        t('inventory.minStock'),
        t('inventory.maxStock'),
        t('inventory.unitPrice'),
        t('inventory.location'),
        t('inventory.supplier'),
        t('inventory.status'),
        '최종 업데이트'
      ];

      const exportData = inventoryData.map(item => [
        item.code,
        item.nameKo,
        item.nameEn,
        getCategoryLabel(item.category),
        item.currentStock,
        item.unit,
        item.minStock,
        item.maxStock,
        item.unitPrice,
        item.location,
        item.supplier,
        getStatusText(item.status),
        new Date(item.lastUpdated).toLocaleDateString()
      ]);

      const allData = [headers, ...exportData];

      if (format === 'excel') {
        // Excel 형식으로 내보내기
        const worksheet = XLSX.utils.aoa_to_sheet(allData);
        const workbook = XLSX.utils.book_new();
        
        // 열 너비 자동 조정
        const colWidths = headers.map((header, index) => {
          const maxLength = Math.max(
            header.length,
            ...exportData.map(row => String(row[index] || '').length)
          );
          return { width: Math.min(maxLength + 2, 30) };
        });
        worksheet['!cols'] = colWidths;

        // 헤더 스타일링
        const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F46E5" } },
            alignment: { horizontal: "center" }
          };
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, '재고목록');
        XLSX.writeFile(workbook, `재고목록_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // CSV 형식으로 내보내기
        const csvData = allData.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // BOM 추가 (한글 깨짐 방지)
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
        
        // 파일 다운로드
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `재고목록_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      showToast(
        format === 'excel' 
          ? t('inventory.excelExportComplete')
          : t('inventory.csvExportComplete'), 
        'success'
      );
    } catch (error) {
      console.error('Export error:', error);
      showToast(t('inventory.exportError'), 'error');
    }
  };

  // 샘플 템플릿 다운로드
  const handleDownloadTemplate = () => {
    try {
      const headers = [
        t('inventory.itemCode'),
        t('inventory.itemName') + ' (한국어)',
        t('inventory.itemName') + ' (English)',
        t('inventory.category'),
        t('inventory.currentStock'),
        t('inventory.unit'),
        t('inventory.minStock'),
        t('inventory.maxStock'),
        t('inventory.unitPrice'),
        t('inventory.location'),
        t('inventory.supplier'),
        t('inventory.status'),
        '최종 업데이트'
      ];

      const sampleData = [
        [
          'SAMPLE-001',
          '샘플 품목',
          'Sample Item',
          t('inventory.rawMaterial'),
          100,
          'kg',
          50,
          200,
          5000,
          'A-01-01',
          '샘플 공급업체',
          t('inventory.normal'),
          new Date().toLocaleDateString()
        ]
      ];

      const allData = [headers, ...sampleData];
      const worksheet = XLSX.utils.aoa_to_sheet(allData);
      const workbook = XLSX.utils.book_new();
      
      // 열 너비 자동 조정
      const colWidths = headers.map(header => ({ width: Math.max(header.length + 2, 15) }));
      worksheet['!cols'] = colWidths;

      // 헤더 스타일링
      const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } },
          alignment: { horizontal: "center" }
        };
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, '재고목록');
      XLSX.writeFile(workbook, `재고목록_템플릿.xlsx`);
      
      showToast(t('inventory.templateDownloaded'), 'success');
    } catch (error) {
      console.error('Template download error:', error);
      showToast(t('inventory.templateDownloadError'), 'error');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv') {
        // CSV 파일 처리
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
              showToast(t('inventory.invalidFileFormat'), 'error');
              return;
            }

            const importedItems = parseImportData(lines.slice(1), 'csv');
            processImportedItems(importedItems);
                     } catch (error) {
             console.error('CSV Import error:', error);
             showToast(t('inventory.csvReadError'), 'error');
           }
        };
        reader.readAsText(file, 'UTF-8');
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Excel 파일 처리
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Excel을 JSON 배열로 변환 (헤더 포함)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
                         if (jsonData.length < 2) {
               showToast(t('inventory.invalidFileFormat'), 'error');
               return;
             }

            const importedItems = parseImportData(jsonData.slice(1), 'excel');
            processImportedItems(importedItems);
                     } catch (error) {
             console.error('Excel Import error:', error);
             showToast(t('inventory.excelReadError'), 'error');
           }
        };
        reader.readAsArrayBuffer(file);
             } else {
         showToast(t('inventory.unsupportedFileFormat'), 'error');
       }
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  // 가져온 데이터 파싱
  const parseImportData = (dataLines, format) => {
    const importedItems = [];

    dataLines.forEach((line, index) => {
      let columns;
      
      if (format === 'csv') {
        columns = line.split(',').map(col => col.replace(/"/g, '').trim());
      } else {
        columns = line;
      }
      
      if (columns && columns.length >= 11) {
        const newItem = {
          id: Date.now() + index,
          code: String(columns[0] || `AUTO-${Date.now() + index}`),
          nameKo: String(columns[1] || '미정'),
          nameEn: String(columns[2] || 'TBD'),
          category: getCategoryValueFromLabel(String(columns[3])) || 'raw_material',
          currentStock: parseInt(columns[4]) || 0,
          unit: String(columns[5] || 'EA'),
          minStock: parseInt(columns[6]) || 0,
          maxStock: parseInt(columns[7]) || 0,
          unitPrice: parseInt(columns[8]) || 0,
          location: String(columns[9] || ''),
          supplier: String(columns[10] || ''),
          lastUpdated: new Date().toISOString(),
          status: 'normal'
        };

        // 재고 상태 계산
        if (newItem.currentStock <= newItem.minStock / 2) {
          newItem.status = 'critical';
        } else if (newItem.currentStock <= newItem.minStock) {
          newItem.status = 'low_stock';
        } else if (newItem.currentStock >= newItem.maxStock) {
          newItem.status = 'overstock';
        }

        importedItems.push(newItem);
      }
    });

    return importedItems;
  };

  // 가져온 항목들 처리
  const processImportedItems = (importedItems) => {
    if (importedItems.length > 0) {
      // 중복 코드 확인
      const existingCodes = new Set(inventoryData.map(item => item.code));
      const duplicates = importedItems.filter(item => existingCodes.has(item.code));
      
             if (duplicates.length > 0) {
         const proceed = window.confirm(
           `${duplicates.length}${t('inventory.duplicateCodesFound')}`
         );
        
        if (proceed) {
          // 중복 코드들을 새로운 코드로 변경
          duplicates.forEach(item => {
            item.code = `${item.code}_${Date.now()}`;
          });
        } else {
          return;
        }
      }

      setInventoryData(prev => [...prev, ...importedItems]);
             showToast(
         `${importedItems.length}${t('inventory.importedItems')}${duplicates.length > 0 ? ` (${duplicates.length}${t('inventory.duplicateCodesFixed')})` : ''}`, 
         'success'
       );
         } else {
       showToast(t('inventory.noDataToImport'), 'error');
     }
  };

  // 카테고리 라벨에서 값으로 변환하는 헬퍼 함수
  const getCategoryValueFromLabel = (label) => {
    const category = categories.find(cat => cat.label === label);
    return category ? category.value : null;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-full">
      {/* Toast 컴포넌트 */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* 헤더 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiPackage className="text-3xl text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
              <p className="text-gray-600 text-sm">{t('inventory.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Import 드롭다운 메뉴 */}
            <div className="relative import-dropdown">
              <button
                onClick={() => setShowImportMenu(!showImportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <FiUpload size={16} />
                {t('inventory.import')}
                <FiChevronDown size={14} />
              </button>
              
              {showImportMenu && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                                         <button
                       onClick={() => {
                         handleImport();
                         setShowImportMenu(false);
                       }}
                       className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <FiUpload size={14} />
                       {t('inventory.importFromFile')}
                     </button>
                     <button
                       onClick={() => {
                         handleDownloadTemplate();
                         setShowImportMenu(false);
                       }}
                       className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <FiDownload size={14} />
                       {t('inventory.downloadTemplate')}
                     </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Export 드롭다운 메뉴 */}
            <div className="relative export-dropdown">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FiDownload size={16} />
                {t('inventory.export')}
                <FiChevronDown size={14} />
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                                         <button
                       onClick={() => {
                         handleExport('excel');
                         setShowExportMenu(false);
                       }}
                       className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <FiDownload size={14} />
                       {t('inventory.excelFile')}
                     </button>
                     <button
                       onClick={() => {
                         handleExport('csv');
                         setShowExportMenu(false);
                       }}
                       className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <FiDownload size={14} />
                       {t('inventory.csvFile')}
                     </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiPlus size={16} />
              {t('inventory.addItem')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* 요약 카드 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <FiBarChart className="text-2xl text-blue-600" />
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('inventory.totalItems')}</p>
              <p className="text-2xl font-bold text-gray-900">{stockSummary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-2xl text-red-600" />
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('inventory.critical')}</p>
              <p className="text-2xl font-bold text-red-600">{stockSummary.critical}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <FiTrendingDown className="text-2xl text-yellow-600" />
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('inventory.lowStock')}</p>
              <p className="text-2xl font-bold text-yellow-600">{stockSummary.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <FiTrendingUp className="text-2xl text-green-600" />
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('inventory.normal')}</p>
              <p className="text-2xl font-bold text-green-600">{stockSummary.normal}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('inventory.totalValue')}</p>
              <p className="text-2xl font-bold text-gray-900">
                ₩{stockSummary.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 검색 및 필터 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('inventory.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* 재고 목록 테이블 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.itemCode')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.itemName')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.category')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.currentStock')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.minMaxStock')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.unitPrice')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.location')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.status')}</th>
                <th className="text-left p-4 text-gray-900 font-semibold">{t('inventory.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 text-gray-600 font-mono">{item.code}</td>
                  <td className="p-4">
                    <div>
                      <div className="text-gray-900 font-medium">{item.nameKo}</div>
                      <div className="text-gray-500 text-sm">{item.nameEn}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {getCategoryLabel(item.category)}
                  </td>
                  <td className="p-4">
                    <div className="text-gray-900 font-medium">
                      {item.currentStock.toLocaleString()} {item.unit}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {item.minStock} / {item.maxStock} {item.unit}
                  </td>
                  <td className="p-4 text-gray-600">
                    ₩{item.unitPrice.toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-600">{item.location}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('inventory.editItem')}
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('inventory.deleteItem')}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <FiPackage className="text-6xl mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('inventory.noItemsFound')}</p>
          </div>
        )}
      </motion.div>

      {/* 재고 추가/편집 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {selectedItem ? t('inventory.editExistingItem') : t('inventory.addNewItem')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.itemCodeInput')}</label>
                <input
                  type="text"
                  placeholder="MTL-001"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.categorySelect')}</label>
                <select 
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.filter(cat => cat.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.itemNameKo')}</label>
                <input
                  type="text"
                  placeholder="스테인리스 스틸 304"
                  value={formData.nameKo}
                  onChange={(e) => handleInputChange('nameKo', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.itemNameEn')}</label>
                <input
                  type="text"
                  placeholder="Stainless Steel 304"
                  value={formData.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.currentStockInput')}</label>
                <input
                  type="number"
                  placeholder="250"
                  value={formData.currentStock}
                  onChange={(e) => handleInputChange('currentStock', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.unit')}</label>
                <input
                  type="text"
                  placeholder="kg, EA, L"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.minStock')}</label>
                <input
                  type="number"
                  placeholder="100"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.maxStock')}</label>
                <input
                  type="number"
                  placeholder="500"
                  value={formData.maxStock}
                  onChange={(e) => handleInputChange('maxStock', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.unitPriceInput')}</label>
                <input
                  type="number"
                  placeholder="8500"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.storageLocation')}</label>
                <input
                  type="text"
                  placeholder="A-01-01"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('inventory.supplier')}</label>
                <input
                  type="text"
                  placeholder="한국철강"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t('inventory.cancel')}
              </button>
              <button
                onClick={handleSaveItem}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {selectedItem ? t('inventory.update') : t('inventory.add')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage; 