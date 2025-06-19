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
import { processAPI, customersAPI, productsAPI, productGroupsAPI, supabase } from '../utils/supabase';

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
  
  // 데이터 상태들
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [stats, setStats] = useState([
    { 
      title: t('process.totalProcesses'), 
      value: '0', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      title: t('process.productionProcesses'), 
      value: '0', 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      title: t('process.qualityProcesses'), 
      value: '0', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      title: t('process.activeProcesses'), 
      value: '0', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]);
  
  const [formData, setFormData] = useState({
    processName: '',
    processCode: '',
    relatedProduct: '',
    customer: '',
    processType: '',
    statusType: 'active',
    description: ''
  });

  // 실제 Supabase 데이터 로드 함수들
  const loadCustomers = async () => {
    try {
      const result = await customersAPI.getAll();
      if (result.success) {
        const formattedCustomers = result.data.map(customer => ({
          id: customer.id,
          customerName: customer.customer_name,
          companyName: customer.company_name
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
      }
    } catch (error) {
      console.error('제품 데이터 로드 오류:', error);
    }
  };

  const loadProductGroups = async () => {
    try {
      const result = await productGroupsAPI.getAll();
      if (result.success) {
        setProductGroups(result.data);
      } else {
        console.error('제품 그룹 데이터 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('제품 그룹 데이터 로드 오류:', error);
    }
  };

  const loadProcesses = async () => {
    try {
      console.log('🔄 공정 데이터 로딩 시작...');
      const result = await processAPI.getAll();
      console.log('📊 processAPI.getAll() 결과:', result);
      
      if (result.success) {
        console.log('✅ 공정 데이터 로드 성공, 원본 데이터:', result.data);
        console.log('📈 원본 데이터 개수:', result.data.length);
        
        if (result.data.length > 0) {
          console.log('🔍 첫 번째 데이터 샘플:', result.data[0]);
        }
        
        // 새로운 API 응답 구조에 맞게 직접 사용
        const formattedProcesses = result.data.map(process => ({
          id: process.id,
          processName: process.processName,
          processCode: process.processCode,
          relatedProduct: process.relatedProductDisplay || process.relatedProduct || 'N/A',
          relatedProductCode: process.relatedProduct, // 제품 코드만
          relatedProductName: process.relatedProductName, // 제품명만
          customer: process.customer,
          processType: process.processType,
          description: process.description,
          registrationDate: process.registrationDate,
          statusType: process.statusType,
          updatedDate: process.updatedDate,
          // 제품 관리 연동을 위한 추가 정보
          hasValidProduct: process.relatedProduct !== 'N/A' && process.relatedProductName !== 'N/A'
        }));
        
        console.log('🎯 변환된 공정 데이터:', formattedProcesses);
        setProcesses(formattedProcesses);
        
        // 통계 업데이트
        updateStats(formattedProcesses);
        
        const linkedCount = formattedProcesses.filter(p => p.hasValidProduct).length;
        console.log(`✅ 공정 로드 완료: ${formattedProcesses.length}개 (제품 연결: ${linkedCount}개)`);
        
        if (formattedProcesses.length === 0) {
          console.warn('⚠️ 공정 데이터가 비어있습니다. 데이터베이스에 데이터가 있는지 확인하세요.');
          showToastMessage('공정 데이터가 없습니다. 데이터를 추가하거나 가져오기를 시도해주세요.', 'warning');
        }
      } else {
        console.error('❌ 공정 데이터 로드 실패:', result.error);
        showToastMessage(t('process.loadFailed') + ': ' + result.error, 'error');
        setProcesses([]); // 실패 시 빈 배열로 설정
      }
    } catch (error) {
      console.error('❌ 공정 데이터 로드 오류:', error);
      showToastMessage(t('common.loadError') + ': ' + error.message, 'error');
      setProcesses([]); // 오류 시 빈 배열로 설정
    }
  };

  const updateStats = (processesData) => {
    const totalProcesses = processesData.length;
    const productionProcesses = processesData.filter(p => p.processType?.includes('생산')).length;
    const qcProcesses = processesData.filter(p => p.processType?.includes('품질')).length;
    const activeProcesses = processesData.filter(p => p.statusType === 'active').length;

    setStats([
      { 
        title: t('process.totalProcesses'), 
        value: totalProcesses.toString(), 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      { 
        title: t('process.productionProcesses'), 
        value: productionProcesses.toString(), 
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      { 
        title: t('process.qualityProcesses'), 
        value: qcProcesses.toString(), 
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      { 
        title: t('process.activeProcesses'), 
        value: activeProcesses.toString(), 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    ]);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadCustomers(),
        loadProducts(),
        loadProductGroups(),
        loadProcesses()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // 필터링된 공정들
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = searchTerm === '' || 
      process.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.processCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.relatedProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || process.statusType === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'maintenance':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return t('process.active');
      case 'maintenance':
        return t('process.maintenance');
      case 'inactive':
        return t('process.inactive');
      default:
        return t('common.unknown');
    }
  };

  const handleView = (process) => {
    setSelectedProcess(process);
    setShowViewModal(true);
  };

  const handleEdit = (process) => {
    setSelectedProcess(process);
    setFormData({
      processName: process.processName,
      processCode: process.processCode,
      relatedProduct: process.relatedProduct,
      customer: process.customer,
      processType: process.processType,
      statusType: process.statusType,
      description: process.description
    });
    setShowEditModal(true);
  };

  const handleDelete = (process) => {
    setSelectedProcess(process);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await processAPI.delete(selectedProcess.id);
      if (result.success) {
        showToastMessage(t('process.processDeletedSuccess'), 'success');
        await loadProcesses();
      } else {
        showToastMessage(t('process.deleteFailed'), 'error');
      }
    } catch (error) {
      console.error('Process delete error:', error);
      showToastMessage(t('common.deleteError'), 'error');
    }
    setShowDeleteDialog(false);
    setSelectedProcess(null);
  };

  const handleSave = async () => {
    try {
      console.log('💾 공정 저장 시작...', formData);
      
      const processData = {
        operation_name: formData.processName,
        code: formData.processCode,
        product_code: formData.relatedProduct,
        client: formData.customer,
        process_type: formData.processType,
        status: formData.statusType,
        description: formData.description
      };

      console.log('📤 서버로 전송할 데이터:', processData);

      let result;
      if (selectedProcess) {
        console.log('🔄 기존 공정 수정:', selectedProcess.id);
        result = await processAPI.update(selectedProcess.id, processData);
      } else {
        console.log('➕ 새 공정 추가');
        result = await processAPI.create(processData);
      }

      console.log('📊 서버 응답:', result);

      if (result.success) {
        console.log('✅ 저장 성공, 데이터 다시 로드 시작...');
        
        // 성공 메시지 표시
        showToastMessage(
          selectedProcess ? '공정이 성공적으로 수정되었습니다!' : '새 공정이 성공적으로 추가되었습니다!'
        );
        
        // 데이터 다시 로드
        await loadProcesses();
        
        // 모달 닫기 및 폼 초기화
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        
        console.log('🎉 저장 완료 및 모달 닫기');
        
        // 추가적인 성공 피드백 (수정의 경우)
        if (selectedProcess) {
          setTimeout(() => {
            showToastMessage('관련 제품 정보가 업데이트되었습니다.', 'success');
          }, 1000);
        }
      } else {
        console.error('❌ 저장 실패:', result.error);
        showToastMessage(
          selectedProcess ? '공정 수정에 실패했습니다.' : '공정 추가에 실패했습니다.',
          'error'
        );
      }
    } catch (error) {
      console.error('❌ Process save error:', error);
      showToastMessage(t('common.saveError'), 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      processName: '',
      processCode: '',
      relatedProduct: '',
      customer: '',
      processType: '',
      statusType: 'active',
      description: ''
    });
    setSelectedProcess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    console.log('Input changed:', name, value); // 모든 입력 변경 로그
    
    // 관련 제품이 변경된 경우 자동으로 고객 정보 설정
    if (name === 'relatedProduct' && value) {
      console.log('제품 선택됨:', value);
      console.log('사용 가능한 제품 목록:', products);
      
      // 드롭다운의 value는 productCode 값이므로 productCode로 찾기
      const selectedProduct = products.find(product => product.productCode === value);
      
      if (selectedProduct) {
        console.log('매칭된 제품:', selectedProduct);
        const customerInfo = selectedProduct.client || '';
        console.log('자동 설정될 고객:', customerInfo);
        
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customer: customerInfo // 제품의 고객 정보로 자동 설정
        }));
        
        // 성공 메시지 표시
        if (customerInfo) {
          showToastMessage(`고객 정보가 자동으로 설정되었습니다: ${customerInfo}`, 'success');
        }
        return;
      } else {
        console.warn('매칭되는 제품을 찾을 수 없음. 값:', value);
        console.warn('제품 코드 목록:', products.map(p => p.productCode));
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExport = () => {
    const exportData = processes.map(process => ({
      [t('process.order')]: processes.indexOf(process) + 1,
      [t('process.processName')]: process.processName,
      [t('process.processId')]: process.processCode,
      [t('process.relatedProduct')]: process.relatedProduct,
      [t('process.customer')]: process.customer,
      [t('process.processType')]: process.processType,
      [t('common.status')]: getStatusText(process.statusType),
      [t('process.registrationDate')]: process.registrationDate,
      [t('process.description')]: process.description
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('process.title'));
    
    // 컬럼 너비 설정
    const colWidths = [
      {wch: 8}, {wch: 20}, {wch: 15}, {wch: 25}, 
      {wch: 15}, {wch: 15}, {wch: 10}, {wch: 20}, {wch: 30}
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `${t('process.title')}_${new Date().toLocaleDateString('ko-KR')}.xlsx`);
    showToastMessage(t('process.processExported'), 'success');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Imported data:', jsonData);

        // 데이터 검증 및 변환
        const importedProcesses = [];
        let hasErrors = false;

        // 제품 데이터와 매칭을 위한 준비
        const productMap = new Map();
        products.forEach(product => {
          productMap.set(product.productCode, product);
          productMap.set(product.productName, product);
          // 소문자 버전도 추가하여 대소문자 무시 매칭
          if (product.productCode) productMap.set(product.productCode.toLowerCase(), product);
          if (product.productName) productMap.set(product.productName.toLowerCase(), product);
        });

        console.log('사용 가능한 제품 수:', products.length);
        console.log('제품 코드 샘플:', products.slice(0, 3).map(p => ({ code: p.productCode, name: p.productName })));

        jsonData.forEach((row, index) => {
          console.log(`행 ${index + 1} 원본 데이터:`, row);
          
          // Excel 컬럼명을 더 유연하게 처리
          const processName = row['공정명'] || row['processName'] || row['operation_name'] || row['Process Name'] || row['공정'] || '';
          const processCode = row['공정코드'] || row['processCode'] || row['code'] || row['Process Code'] || row['코드'] || '';
          const relatedProduct = row['관련제품'] || row['relatedProduct'] || row['product_code'] || row['Product Code'] || row['제품명'] || row['Product Name'] || row['제품코드'] || row['제품'] || '';
          const customer = row['고객사'] || row['customer'] || row['client'] || row['Customer'] || row['고객'] || '';
          const processType = row['공정유형'] || row['processType'] || row['type'] || row['Type'] || row['공정타입'] || row['유형'] || '';
          const description = row['설명'] || row['description'] || row['Description'] || row['비고'] || '';
          const status = row['상태'] || row['status'] || row['Status'] || 'active';
          const material = row['재질'] || row['material'] || row['Material'] || '';
          const specification = row['규격'] || row['specification'] || row['Specification'] || '';

          console.log(`공정명: "${processName}", 공정코드: "${processCode}", 관련제품: "${relatedProduct}", 고객사: "${customer}", 공정유형: "${processType}"`);

          // 필수 필드 검증
          if (!processName) {
            console.warn(`행 ${index + 2}: 공정명이 누락되었습니다.`);
            hasErrors = true;
            return;
          }

          // 제품 자동 매칭 개선
          let matchedProduct = null;
          if (relatedProduct && relatedProduct.trim() !== '') {
            console.log(`제품 매칭 시도: "${relatedProduct}"`);
            
            // 1. 정확한 매칭 시도
            matchedProduct = productMap.get(relatedProduct) || productMap.get(relatedProduct.toLowerCase());
            
            if (!matchedProduct) {
              // 2. 부분 매칭 시도 (더 유연한 매칭)
              const searchTerm = relatedProduct.toLowerCase().trim();
              for (const [key, product] of productMap) {
                const keyLower = key.toLowerCase();
                if (keyLower.includes(searchTerm) || searchTerm.includes(keyLower)) {
                  matchedProduct = product;
                  console.log(`부분 매칭 성공: "${relatedProduct}" -> "${key}"`);
                  break;
                }
              }
            } else {
              console.log(`정확 매칭 성공: "${relatedProduct}"`);
            }

            if (!matchedProduct) {
              console.warn(`제품 매칭 실패: "${relatedProduct}" (행 ${index + 2})`);
            } else {
              console.log(`매칭된 제품:`, matchedProduct);
            }
          }

          // Supabase 저장용 데이터 구조로 변환 (work_centers 테이블 형식)
          const process = {
            operation_name: processName,
            code: processCode || `${processName.replace(/\s+/g, '_').toUpperCase()}_${Date.now().toString().slice(-6)}`,
            description: description || `${relatedProduct || ''}${material ? ` (${material})` : ''}${specification ? ` - ${specification}` : ''}`.trim(),
            process_type: processType || '일반',
            client: customer || matchedProduct?.client || '일반',
            capacity_per_hour: 100, // 기본값
            status: ['active', 'maintenance', 'inactive'].includes(status.toLowerCase()) ? status.toLowerCase() : 'active',
            // 제품 연결 정보 - 이 부분이 중요!
            product_code: matchedProduct?.productCode || relatedProduct || null,
            related_product_code: matchedProduct?.productCode || relatedProduct,
            related_product_name: matchedProduct?.productName || '',
            material: material,
            specification: specification
          };

          console.log(`공정 ${index + 1}: ${processName} (${process.code})`);
          console.log(`  -> 제품 코드: ${process.product_code}`);
          console.log(`  -> 제품명: ${process.related_product_name}`);
          console.log(`  -> 고객: ${process.client}`);
          console.log(`  -> 공정 타입: ${process.process_type}`);
          
          importedProcesses.push(process);
        });

        if (importedProcesses.length > 0) {
          // Supabase에 각 공정 저장하고 동시에 UI용 데이터 준비
          let successCount = 0;
          let errorCount = 0;
          const newProcesses = [];

          console.log(`총 ${importedProcesses.length}개 공정 처리 시작...`);

          for (const process of importedProcesses) {
            try {
              const result = await processAPI.create(process);
              if (result.success) {
                successCount++;

                // 새로 생성된 공정을 UI 형식으로 변환하여 추가
                const newProcess = {
                  id: `wc_${result.data.id}`,
                  processName: result.data.name,
                  processCode: result.data.code,
                  relatedProduct: process.product_code && process.related_product_name 
                    ? `${process.product_code} - ${process.related_product_name}`
                    : process.product_code || 'N/A',
                  relatedProductCode: process.product_code || 'N/A',
                  relatedProductName: process.related_product_name || 'N/A',
                  customer: process.client || 'N/A',
                  processType: process.process_type || '일반',
                  description: result.data.description || 'N/A',
                  registrationDate: new Date().toLocaleString('ko-KR'),
                  statusType: result.data.status || 'active',
                  material: process.material || '',
                  specification: process.specification || '',
                  hasValidProduct: !!(process.product_code && process.related_product_name)
                };
                newProcesses.push(newProcess);
                console.log(`✓ 성공: ${process.operation_name} (${result.data.code}) - 제품: ${newProcess.relatedProduct}`);
              } else {
                console.error('✗ 공정 저장 실패:', result.error);
                errorCount++;
              }
            } catch (error) {
              console.error('✗ 공정 저장 오류:', error);
              errorCount++;
            }
          }

          console.log(`처리 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);

          // 성공적으로 저장된 공정들을 기존 목록에 추가
          if (successCount > 0) {
            setProcesses(prev => [...newProcesses, ...prev]);
            
            // 통계 업데이트
            const updatedProcesses = [...newProcesses, ...processes];
            updateStats(updatedProcesses);
            
            const message = errorCount > 0 
              ? `${successCount}개 공정이 저장되었습니다. ${errorCount}개는 저장에 실패했습니다. (총 ${importedProcesses.length}개 중)`
              : `${successCount}개의 공정이 성공적으로 가져와졌습니다.`;
              
            showToastMessage(message, errorCount > 0 ? 'warning' : 'success');
          } else {
            showToastMessage(`공정 저장에 실패했습니다. (총 ${importedProcesses.length}개 모두 실패)`, 'error');
          }
        } else {
          showToastMessage(t('process.fileReadError'), 'error');
        }

      } catch (error) {
        console.error('File reading error:', error);
        showToastMessage(t('process.fileReadError'), 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
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

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-lg border ${stat.borderColor} p-6`}
          >
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 공정 목록 테이블 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">{t('process.title')}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>{t('process.export')}</span>
                </button>
                <button
                  onClick={handleImport}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center space-x-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>{t('process.import')}</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{t('process.totalProcesses')}: </span>
              <span className="text-sm font-medium text-blue-600">{filteredProcesses.length}{t('process.processCountSuffix')}</span>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('process.searchProcessPlaceholder')}
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
              <option value="all">{t('process.allStatuses')}</option>
              <option value="active">{t('process.active')}</option>
              <option value="maintenance">{t('process.maintenance')}</option>
              <option value="inactive">{t('process.inactive')}</option>
            </select>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t('process.addNewProcess')}</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.processCode')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.relatedProduct')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('process.processType')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
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
                    <div className="text-xs text-gray-500">{process.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 font-mono">{process.processCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {process.hasValidProduct ? (
                      <div>
                        <button
                          onClick={() => {
                            // 제품 관리 페이지로 이동하면서 해당 제품을 하이라이트
                            const productCode = process.relatedProductCode;
                            console.log('제품 관리 페이지로 이동:', productCode);
                            // 로컬 스토리지에 검색할 제품 코드 저장
                            localStorage.setItem('highlightProduct', productCode);
                            // 제품 관리 페이지로 이동
                            window.location.href = '/products';
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          <div className="font-medium">{process.relatedProductCode}</div>
                          <div className="text-xs text-gray-500">{process.relatedProductName}</div>
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">N/A</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{process.customer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      process.processType?.includes('생산') ? 'bg-blue-100 text-blue-800' :
                      process.processType?.includes('품질') ? 'bg-green-100 text-green-800' :
                      process.processType?.includes('출하') ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {process.processType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(process.statusType)}
                      <span className={`text-sm font-medium ${
                        process.statusType === 'active' ? 'text-green-600' :
                        process.statusType === 'maintenance' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {getStatusText(process.statusType)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(process)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(process)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(process)}
                        className="text-red-600 hover:text-red-900"
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
      </motion.div>

      {/* 새 공정 추가/수정 모달 */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedProcess ? t('process.editProcess') : t('process.addNewProcess')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('process.processRequired')}
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
                {t('process.processIdRequired')}
              </label>
              <input
                type="text"
                name="processCode"
                value={formData.processCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('process.relatedProductRequired')}
              </label>
              <select
                name="relatedProduct"
                value={formData.relatedProduct}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">{t('process.productSelectPlaceholder')}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.productCode}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('process.customerAutoSet')}
              </label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder={t('process.autoSetDescription')}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('process.processTypeLabel')}
              </label>
              <select
                name="processType"
                value={formData.processType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('process.processTypeSelectPlaceholder')}</option>
                {productGroups.map((group) => (
                  <option key={group.id} value={group.group_name}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.status')}
              </label>
              <select
                name="statusType"
                value={formData.statusType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">{t('process.active')}</option>
                <option value="maintenance">{t('process.maintenance')}</option>
                <option value="inactive">{t('process.inactive')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('process.descriptionLabel')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
            />
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
              {t('common.cancel')}
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
              {selectedProcess ? t('common.update') : t('common.save')}
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
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('process.basicInfo')}</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.processName')}</dt>
                    <dd className="text-sm text-gray-900 font-medium">{selectedProcess.processName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.processId')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.processCode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.relatedProduct')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.relatedProduct}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.customer')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.customer}</dd>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">{t('process.statusInfo')}</h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.processType')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.processType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('common.status')}</dt>
                    <dd className="text-sm flex items-center gap-2">
                      {getStatusIcon(selectedProcess.statusType)}
                      <span>{getStatusText(selectedProcess.statusType)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.registrationDate')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.registrationDate}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('process.description')}</dt>
                    <dd className="text-sm text-gray-900">{selectedProcess.description}</dd>
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
        title={t('process.processDeleteConfirm')}
        message={`"${selectedProcess?.processName}" ${t('process.processDeleteConfirmMessage')}`}
      />
    </div>
  );
};

export default ProcessPage; 