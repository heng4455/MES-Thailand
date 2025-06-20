import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Save,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { productsAPI, customersAPI, supabase } from '../utils/supabase';

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [highlightedProductCode, setHighlightedProductCode] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    client: '',
    quantity: '',
    unit: '개',
    orderStatus: 'pending'
  });

  // 실제 고객 데이터 로드
  const loadCustomers = async () => {
    try {
      const result = await customersAPI.getAll();
      if (result.success) {
        const formattedCustomers = result.data.map(customer => ({
          id: customer.id,
          customerName: customer.customer_name,
          companyName: customer.company_name,
          status: customer.status
        }));
        setCustomers(formattedCustomers);
      } else {
        console.error('Customer data load failed:', result.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Customer data load error:', error);
      setCustomers([]);
    }
  };

  // 실제 제품 데이터 로드
  useEffect(() => {
    loadData();
    
    // 공정 관리에서 이동해온 경우 해당 제품 하이라이트
    const highlightProduct = localStorage.getItem('highlightProduct');
    if (highlightProduct) {
      setHighlightedProductCode(highlightProduct);
      setSearchTerm(highlightProduct); // 검색어도 설정하여 해당 제품이 바로 보이도록
      
      // 토스트 메시지 표시
      setTimeout(() => {
        showToastMessage(`공정 관리에서 연결된 제품: ${highlightProduct}`, 'info');
      }, 500);
      
      // 하이라이트 제거 (일회성)
      setTimeout(() => {
        setHighlightedProductCode(null);
        localStorage.removeItem('highlightProduct');
      }, 5000); // 5초 후 하이라이트 제거
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 고객 데이터와 제품 데이터를 병렬로 로드
      await Promise.all([
        loadCustomers(),
        loadProducts()
      ]);
    } catch (error) {
      console.error('Data load error:', error);
      showToastMessage(t('common.dataLoadError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productsAPI.getAll();
      
      if (result.success) {
        // Supabase 데이터를 UI 형식으로 변환하고 연결된 공정 정보도 가져오기
        const formattedProducts = await Promise.all(result.data.map(async (product) => {
          // 해당 제품과 연결된 공정들 가져오기
          let connectedProcesses = [];
          try {
            const { data: processData } = await supabase
              .from('work_centers')
              .select('name, code')
              .ilike('description', `%${product.product_code}%`);
            
            if (processData && processData.length > 0) {
              connectedProcesses = processData.map(p => p.name || p.code).filter(Boolean);
            }
          } catch (error) {
            console.warn('공정 연결 정보 조회 실패:', error);
          }

          return {
            id: product.id,
            productCode: product.product_code,
            productName: product.product_name,
            client: product.client,
            quantity: product.quantity,
            unit: product.unit,
            orderStatus: product.order_status,
            registrationDate: product.registration_date,
            orderProgress: product.order_progress || 0,
            description: product.description,
            connectedProcesses: connectedProcesses // 연결된 공정 목록 추가
          };
        }));
        
        setProducts(formattedProducts);
      } else {
        console.error('Product data load failed:', result.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Product data load error:', error);
      showToastMessage(t('products.loadFailed'), 'error');
      setProducts([]);
    }
  };

  // 필터링된 제품 목록
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || product.orderStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'inProcess':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'inProcess':
        return t('products.inProcess');
      case 'completed':
        return t('products.completed');
      case 'pending':
        return t('products.pending');
      case 'shipped':
        return t('products.shipped');
      default:
        return status;
    }
  };

  // 액션 함수들
  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode,
      productName: product.productName,
      client: product.client,
      quantity: product.quantity,
      unit: product.unit,
      orderStatus: product.orderStatus
    });
    setShowEditModal(true);
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await productsAPI.delete(selectedProduct.id);
      if (result.success) {
        setProducts(products.filter(p => p.id !== selectedProduct.id));
        showToastMessage(t('products.productDeletedSuccess'), 'success');
      } else {
        showToastMessage(`${t('common.deleteFailed')}: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Product delete error:', error);
      showToastMessage(t('common.deleteError'), 'error');
    } finally {
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    }
  };

  const handleSave = async () => {
    try {
      const productData = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0
      };

    if (selectedProduct) {
      // 수정
        const result = await productsAPI.update(selectedProduct.id, productData);
        if (result.success) {
          // 로컬 state 업데이트
      setProducts(products.map(p => 
        p.id === selectedProduct.id 
              ? { 
                  ...p, 
                  productCode: productData.productCode,
                  productName: productData.productName,
                  client: productData.client,
                  quantity: productData.quantity,
                  unit: productData.unit,
                  orderStatus: productData.orderStatus
                }
          : p
      ));
          showToastMessage(t('modals.saveSuccess'), 'success');
      setShowEditModal(false);
        } else {
          showToastMessage(`${t('common.updateFailed')}: ${result.error}`, 'error');
          return;
        }
    } else {
      // 새 제품 추가
        const result = await productsAPI.create(productData);
        if (result.success) {
      const newProduct = {
            id: result.data.id,
            productCode: result.data.product_code,
            productName: result.data.product_name,
            client: result.data.client,
            quantity: result.data.quantity,
            unit: result.data.unit,
            orderStatus: result.data.order_status,
            registrationDate: result.data.registration_date,
            orderProgress: result.data.order_progress || 0,
            description: result.data.description
      };
      setProducts([...products, newProduct]);
          showToastMessage(t('products.productAddedSuccess'), 'success');
      setShowAddModal(false);
        } else {
          showToastMessage(`${t('common.saveFailed')}: ${result.error}`, 'error');
          return;
        }
    }
    resetForm();
    } catch (error) {
      console.error('Product save error:', error);
      showToastMessage(t('common.saveError'), 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      productCode: '',
      productName: '',
      client: '',
      quantity: '',
      unit: '개',
      orderStatus: 'pending'
    });
    setSelectedProduct(null);
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
      const exportData = products.map(product => ({
        '제품코드': product.productCode,
        '제품명': product.productName,
        '고객사': product.client,
        '수량': product.quantity,
        '단위': product.unit,
        '이관상태': getStatusText(product.orderStatus),
        '등록일': product.registrationDate
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '제품 목록');

      // 컬럼 너비 조정
      const colWidths = [
        { wch: 25 }, // 제품코드
        { wch: 30 }, // 제품명
        { wch: 15 }, // 고객사
        { wch: 10 }, // 수량
        { wch: 8 },  // 단위
        { wch: 12 }, // 이관상태
        { wch: 15 }  // 등록일
      ];
      ws['!cols'] = colWidths;

      const fileName = `제품목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToastMessage(t('products.productExported'), 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage(t('products.fileReadError'), 'error');
    }
  };

  // 가져오기 함수
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 데이터 검증 및 변환
        const importedProducts = [];
        let hasErrors = false;

        jsonData.forEach((row, index) => {
          const productCode = row['제품코드'] || row['productCode'] || '';
          const productName = row['제품명'] || row['productName'] || '';
          const client = row['고객사'] || row['client'] || '';
          const quantity = row['수량'] || row['quantity'] || 0;
          const unit = row['단위'] || row['unit'] || '개';
          const orderStatus = row['주문상태'] || row['orderStatus'] || 'pending';

          // 필수 필드 검증
          if (!productCode || !productName || !client) {
            console.warn(`행 ${index + 2}: 필수 필드가 누락되었습니다.`);
            hasErrors = true;
            return;
          }

          // 수량 검증
          const parsedQuantity = parseInt(quantity);
          if (isNaN(parsedQuantity) || parsedQuantity < 0) {
            console.warn(`행 ${index + 2}: 수량이 올바르지 않습니다.`);
            hasErrors = true;
            return;
          }

          // Supabase 저장용 데이터 구조로 변환
          const product = {
            product_code: productCode,
            product_name: productName,
            client: client,
            quantity: parsedQuantity,
            unit: unit,
            order_status: ['pending', 'inProcess', 'completed', 'shipped'].includes(orderStatus) ? orderStatus : 'pending',
            registration_date: new Date().toISOString(),
            order_progress: 0,
            description: row['설명'] || row['description'] || ''
          };

          importedProducts.push(product);
        });

        if (importedProducts.length > 0) {
          // Supabase에 각 제품 저장하고 동시에 UI용 데이터 준비
          let successCount = 0;
          let errorCount = 0;
          const newProducts = [];

          for (const product of importedProducts) {
            try {
              const result = await productsAPI.create(product);
              if (result.success) {
                successCount++;
                // 새로 생성된 제품을 UI 형식으로 변환하여 추가
                const newProduct = {
                  id: result.data.id,
                  productCode: result.data.product_code,
                  productName: result.data.product_name,
                  client: result.data.client,
                  quantity: result.data.quantity,
                  unit: result.data.unit,
                  orderStatus: result.data.order_status,
                  registrationDate: result.data.registration_date,
                  orderProgress: result.data.order_progress || 0,
                  description: result.data.description
                };
                newProducts.push(newProduct);
              } else {
                console.error('제품 저장 실패:', result.error);
                errorCount++;
              }
            } catch (error) {
              console.error('제품 저장 오류:', error);
              errorCount++;
            }
          }

          // 성공적으로 저장된 제품들을 기존 목록에 추가
          if (successCount > 0) {
            setProducts(prev => [...newProducts, ...prev]);
            
            const message = errorCount > 0 
              ? `${successCount}개 제품이 저장되었습니다. ${errorCount}개는 저장에 실패했습니다.`
              : `${successCount}개의 제품이 성공적으로 가져와졌습니다.`;
              
            showToastMessage(message, errorCount > 0 ? 'warning' : 'success');
          } else {
            showToastMessage('제품 저장에 실패했습니다.', 'error');
          }
        } else {
          showToastMessage(t('products.fileReadError'), 'error');
        }

      } catch (error) {
        console.error('Import error:', error);
        showToastMessage(t('products.fileReadError'), 'error');
      }
    };

    reader.readAsBinaryString(file);
    event.target.value = ''; // 파일 입력 초기화
  };

  // 통계 계산
  const stats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.orderStatus === 'inProcess').length,
    completed: products.filter(p => p.orderStatus === 'completed').length,
    pending: products.filter(p => p.orderStatus === 'pending').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
            <p className="text-gray-600 mt-1">{t('products.subtitle')}</p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('products.addNewProduct')}
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('products.totalProducts')}</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('products.inProcess')}</p>
                <p className="text-2xl font-bold text-green-900">{stats.inStock}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">{t('products.completed')}</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">{t('products.testResult')}</p>
                <p className="text-2xl font-bold text-orange-900">96</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('products.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('modals.allStatuses')}</option>
                <option value="inProcess">{t('products.inProcess')}</option>
                <option value="completed">{t('products.completed')}</option>
                <option value="pending">{t('products.pending')}</option>
                <option value="shipped">{t('products.shipped')}</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('products.export')}
            </button>
            <button 
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t('products.import')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* 제품 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('products.productList')}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('products.productName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('products.client')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('products.quantity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이관상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연결된 공정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  {t('products.registrationDate')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
  {t('modals.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`hover:bg-gray-50 transition-colors ${
                    highlightedProductCode === product.productCode 
                      ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md' 
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${
                        highlightedProductCode === product.productCode 
                          ? 'text-yellow-900 font-bold' 
                          : 'text-gray-900'
                      }`}>
                        {product.productCode}
                        {highlightedProductCode === product.productCode && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
                            공정 연결됨
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.productName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.client}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600 font-medium">
                      {product.quantity}{product.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.orderStatus)}`}>
                      {getStatusText(product.orderStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.connectedProcesses && product.connectedProcesses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.connectedProcesses.slice(0, 2).map((process, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {process}
                            </span>
                          ))}
                          {product.connectedProcesses.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{product.connectedProcesses.length - 2}개
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">연결된 공정 없음</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(product.registrationDate).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(product)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title={t('products.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                        title={t('products.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title={t('products.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('products.noProducts')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('products.addProduct')}</p>
          </div>
        )}
      </div>

      {/* 제품 추가/수정 모달 */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedProduct ? t('modals.editProduct') : t('modals.addNewProduct')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('products.productCode')} *
              </label>
              <input
                type="text"
                name="productCode"
                value={formData.productCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.productNameLabel')} *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.clientLabel')} *
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">{t('modals.selectClient')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.customerName}>{customer.customerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.orderStatusLabel')}
              </label>
              <select
                name="orderStatus"
                value={formData.orderStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">{t('modals.pending')}</option>
                <option value="inProcess">{t('modals.inProcess')}</option>
                <option value="completed">{t('modals.completed')}</option>
                <option value="shipped">{t('modals.shipped')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.quantityLabel')} *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.unitLabel')}
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="개">{t('products.pieces')}</option>
                <option value="kg">kg</option>
                <option value="m">m</option>
                <option value="set">set</option>
              </select>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {selectedProduct ? t('modals.save') : t('modals.add')}
            </button>
          </div>
        </div>
      </Modal>

      {/* 제품 정보 보기 모달 */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProduct(null);
        }}
        title={t('products.productDetails')}
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('products.basicInfo')}</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.productCode')}</dt>
                    <dd className="text-sm text-gray-900 font-medium">{selectedProduct.productCode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.productName')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProduct.productName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.client')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProduct.client}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.quantity')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProduct.quantity}{selectedProduct.unit}</dd>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('products.orderInfo')}</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.orderStatus')}</dt>
                    <dd className="text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProduct.orderStatus)}`}>
                        {getStatusText(selectedProduct.orderStatus)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.registrationDate')}</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(selectedProduct.registrationDate).toLocaleDateString('ko-KR')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('products.orderProgress')}</dt>
                    <dd className="text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedProduct.orderProgress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{selectedProduct.orderProgress || 0}%</span>
                      </div>
                    </dd>
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
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title={t('products.deleteConfirmTitle')}
        message={`"${selectedProduct?.productName}" ${t('modals.deleteConfirmMessage')}`}
        confirmText={t('modals.delete')}
        cancelText={t('modals.cancel')}
        type="danger"
      />
    </div>
  );
};

export default ProductsPage; 