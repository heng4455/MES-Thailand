import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  ShoppingCart,
  Save,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const CustomersPage = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  });

  // 샘플 고객 데이터
  useEffect(() => {
    // 실제 구현에서는 API에서 데이터를 가져옴
    const mockCustomers = [
      {
        id: 1,
        customerName: 'MOBIS',
        companyName: '현대모비스',
        contact: '김철수',
        email: 'kim.cs@mobis.co.kr',
        phone: '+82-2-1234-5678',
        address: '서울특별시 강남구 테헤란로 123',
        status: 'active',
        registrationDate: '2025-06-11',
        lastOrderDate: '2025-06-15',
        totalOrders: 4,
        activeProjects: 2
      },
      {
        id: 2,
        customerName: 'LG VS',
        companyName: 'LG전자 VS사업부',
        contact: '박영희',
        email: 'park.yh@lge.com',
        phone: '+82-2-2222-3333',
        address: '서울특별시 영등포구 여의도동 456',
        status: 'active',
        registrationDate: '2025-06-11',
        lastOrderDate: '2025-06-14',
        totalOrders: 6,
        activeProjects: 3
      },
      {
        id: 3,
        customerName: 'HL Clemove',
        companyName: 'HL클레무브',
        contact: '이민수',
        email: 'lee.ms@hlclemove.com',
        phone: '+82-31-5555-7777',
        address: '경기도 수원시 영통구 789번길',
        status: 'active',
        registrationDate: '2025-06-11',
        lastOrderDate: '2025-06-13',
        totalOrders: 7,
        activeProjects: 1
      },
      {
        id: 4,
        customerName: 'Samsung SDI',
        companyName: '삼성SDI',
        contact: '최진아',
        email: 'choi.ja@samsungsdi.com',
        phone: '+82-31-8888-9999',
        address: '경기도 용인시 기흥구 삼성로 111',
        status: 'inactive',
        registrationDate: '2025-05-20',
        lastOrderDate: '2025-05-25',
        totalOrders: 2,
        activeProjects: 0
      },
      {
        id: 5,
        customerName: 'SK Innovation',
        companyName: 'SK이노베이션',
        contact: '정우석',
        email: 'jung.ws@skinnovation.com',
        phone: '+82-2-7777-1111',
        address: '서울특별시 종로구 종로 26',
        status: 'pending',
        registrationDate: '2025-06-10',
        lastOrderDate: null,
        totalOrders: 0,
        activeProjects: 0
      }
    ];

    setTimeout(() => {
      setCustomers(mockCustomers);
      setIsLoading(false);
    }, 1000);
  }, []);

  // 필터링된 고객 목록
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // 상태별 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return t('customers.active');
      case 'inactive':
        return t('customers.inactive');
      case 'pending':
        return t('customers.pending');
      default:
        return status;
    }
  };

  // 액션 함수들
  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      companyName: customer.companyName,
      contact: customer.contact,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status
    });
    setShowEditModal(true);
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
    setShowDeleteDialog(false);
    setSelectedCustomer(null);
  };

  const handleSave = () => {
    if (selectedCustomer) {
      // 수정
      setCustomers(customers.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, ...formData }
          : c
      ));
      setShowEditModal(false);
    } else {
      // 새 고객 추가
      const newCustomer = {
        id: Date.now(),
        ...formData,
        registrationDate: new Date().toISOString().split('T')[0],
        lastOrderDate: null,
        totalOrders: 0,
        activeProjects: 0
      };
      setCustomers([...customers, newCustomer]);
      setShowAddModal(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      companyName: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      status: 'active'
    });
    setSelectedCustomer(null);
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
      const exportData = customers.map(customer => ({
        '고객명': customer.customerName,
        '회사명': customer.companyName,
        '담당자': customer.contact,
        '이메일': customer.email,
        '전화번호': customer.phone,
        '주소': customer.address,
        '상태': getStatusText(customer.status),
        '등록일': customer.registrationDate,
        '최종 주문일': customer.lastOrderDate || '-',
        '총 주문수': customer.totalOrders,
        '활성 프로젝트': customer.activeProjects
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '고객 목록');

      // 컬럼 너비 조정
      const colWidths = [
        { wch: 15 }, // 고객명
        { wch: 25 }, // 회사명
        { wch: 10 }, // 담당자
        { wch: 25 }, // 이메일
        { wch: 15 }, // 전화번호
        { wch: 30 }, // 주소
        { wch: 8 },  // 상태
        { wch: 12 }, // 등록일
        { wch: 12 }, // 최종 주문일
        { wch: 10 }, // 총 주문수
        { wch: 12 }  // 활성 프로젝트
      ];
      ws['!cols'] = colWidths;

      const fileName = `고객목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToastMessage('고객 데이터가 성공적으로 내보내졌습니다.', 'success');
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
        const importedCustomers = [];
        let hasErrors = false;

        jsonData.forEach((row, index) => {
          const customerName = row['고객명'] || row['customerName'] || '';
          const companyName = row['회사명'] || row['companyName'] || '';
          const contact = row['담당자'] || row['contact'] || '';
          const email = row['이메일'] || row['email'] || '';
          const phone = row['전화번호'] || row['phone'] || '';
          const address = row['주소'] || row['address'] || '';
          const status = row['상태'] || row['status'] || 'active';

          // 필수 필드 검증
          if (!customerName || !companyName || !email) {
            console.warn(`행 ${index + 2}: 필수 필드가 누락되었습니다.`);
            hasErrors = true;
            return;
          }

          // 이메일 형식 검증
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            console.warn(`행 ${index + 2}: 이메일 형식이 올바르지 않습니다.`);
            hasErrors = true;
            return;
          }

          const customer = {
            id: Date.now() + Math.random(),
            customerName,
            companyName,
            contact,
            email,
            phone,
            address,
            status: ['active', 'inactive', 'pending'].includes(status) ? status : 'active',
            registrationDate: new Date().toISOString().split('T')[0],
            lastOrderDate: null,
            totalOrders: 0,
            activeProjects: 0
          };

          importedCustomers.push(customer);
        });

        if (importedCustomers.length > 0) {
          setCustomers(prev => [...prev, ...importedCustomers]);
          showToastMessage(
            `${importedCustomers.length}개의 고객이 성공적으로 가져와졌습니다.${hasErrors ? ' (일부 오류 있음)' : ''}`,
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

  // 통계 계산
  const stats = {
    totalCustomers: customers.length,
    activeProjects: customers.reduce((sum, customer) => sum + customer.activeProjects, 0),
    completedOrders: customers.reduce((sum, customer) => sum + customer.totalOrders, 0)
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
            <h1 className="text-2xl font-bold text-gray-900">{t('customers.title')}</h1>
            <p className="text-gray-600 mt-1">{t('customers.subtitle')}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('customers.addNewCustomer')}
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('customers.totalCustomers')}</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('customers.activeProjects')}</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeProjects}</p>
              </div>
              <Building className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">{t('customers.completedOrders')}</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completedOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-600" />
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
                placeholder={t('customers.search')}
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
                <option value="active">{t('customers.active')}</option>
                <option value="inactive">{t('customers.inactive')}</option>
                <option value="pending">{t('customers.pending')}</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t('customers.export')}
            </button>
            <button 
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t('customers.import')}
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

      {/* 고객 목록 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customers.customerName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customers.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  {t('customers.registrationDate')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customers.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.companyName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {customer.phone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(customer.registrationDate).toLocaleDateString('ko-KR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                      {getStatusText(customer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(customer)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title={t('customers.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                        title={t('customers.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title={t('customers.delete')}
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
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('customers.noCustomers')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('customers.addCustomer')}</p>
          </div>
        )}
      </div>

      {/* 고객 추가/수정 모달 */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
        title={selectedCustomer ? t('modals.editCustomer') : t('modals.addNewCustomer')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.customerNameLabel')} *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.companyNameLabel')} *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.contactPersonLabel')} *
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.emailLabel')} *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.phoneLabel')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('modals.statusLabel')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">{t('modals.active')}</option>
                <option value="inactive">{t('modals.inactive')}</option>
                <option value="pending">{t('modals.pending')}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('modals.addressLabel')}
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {selectedCustomer ? t('modals.save') : t('modals.add')}
            </button>
          </div>
        </div>
      </Modal>

      {/* 고객 정보 보기 모달 */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedCustomer(null);
        }}
        title={t('modals.customerDetailsTitle')}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{t('modals.basicInfo')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('modals.customerNameLabel')}:</span>
                    <span className="font-medium">{selectedCustomer.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('modals.companyNameLabel')}:</span>
                    <span className="font-medium">{selectedCustomer.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('modals.contactPersonLabel')}:</span>
                    <span className="font-medium">{selectedCustomer.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('modals.statusLabel')}:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                      {getStatusText(selectedCustomer.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">{t('modals.contactInfo')}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">{t('modals.activityInfo')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</div>
                  <div className="text-sm text-gray-600">{t('modals.totalOrders')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedCustomer.activeProjects}</div>
                  <div className="text-sm text-gray-600">{t('customers.activeProjects')}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-purple-600">
                    {new Date(selectedCustomer.registrationDate).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="text-sm text-gray-600">{t('customers.registrationDate')}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-orange-600">
                    {selectedCustomer.lastOrderDate 
                      ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString('ko-KR')
                      : '-'
                    }
                  </div>
                  <div className="text-sm text-gray-600">{t('modals.recentOrder')}</div>
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
          setSelectedCustomer(null);
        }}
        onConfirm={confirmDelete}
        title={t('customers.deleteConfirmTitle')}
        message={`"${selectedCustomer?.customerName}" ${t('modals.deleteConfirmMessage')}`}
        confirmText={t('modals.delete')}
        cancelText={t('modals.cancel')}
        type="danger"
      />
    </div>
  );
};

export default CustomersPage; 