import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Edit2, Trash2, Search, AlertTriangle, 
  CheckCircle, XCircle, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useUser } from '../contexts/UserContext';
import { qualityAPI } from '../utils/supabase';

const QualityTypesPage = () => {
  const { t } = useTranslation();
  const { user, userProfile, hasPermission, PERMISSIONS } = useUser();
  const [loading, setLoading] = useState(true);
  const [qualityTypes, setQualityTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedType, setSelectedType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 토스트 상태
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    category: 'defect',
    severity: 'medium',
    isActive: true
  });

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'defect', label: t('qualityTypes.categories.defect') },
    { value: 'dimension', label: t('qualityTypes.categories.dimension') },
    { value: 'electrical', label: t('qualityTypes.categories.electrical') },
    { value: 'mechanical', label: t('qualityTypes.categories.mechanical') },
    { value: 'visual', label: t('qualityTypes.categories.visual') },
    { value: 'functional', label: t('qualityTypes.categories.functional') }
  ];

  // 심각도 옵션
  const severityOptions = [
    { value: 'low', label: t('qualityTypes.severity.low'), color: 'text-green-600 bg-green-100' },
    { value: 'medium', label: t('qualityTypes.severity.medium'), color: 'text-yellow-600 bg-yellow-100' },
    { value: 'high', label: t('qualityTypes.severity.high'), color: 'text-red-600 bg-red-100' },
    { value: 'critical', label: t('qualityTypes.severity.critical'), color: 'text-red-700 bg-red-200' }
  ];

  // 권한 확인 (로그인한 사용자 누구나 접근 가능)
  const hasManagerAccess = () => {
    // 로그인한 사용자라면 누구나 접근 가능
    return !!user;
  };

  // 데이터 로드
  const loadQualityTypes = async () => {
    try {
      setLoading(true);
      const result = await qualityAPI.getQualityTypes();
      if (result.success) {
        setQualityTypes(result.data);
      } else {
        console.error('품질 유형 API 오류:', result.error);
        // 테이블이 없거나 권한 문제인 경우 빈 배열로 설정
        setQualityTypes([]);
        showToast('품질 유형 테이블이 생성되지 않았습니다. 관리자에게 문의하세요.', 'warning');
      }
    } catch (error) {
      console.error('품질 유형 로드 오류:', error);
      setQualityTypes([]);
      showToast('품질 유형 데이터 로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('QualityTypesPage useEffect 실행:', { 
      user: user?.email, 
      userProfile: userProfile?.role,
      hasPermission: hasPermission?.(PERMISSIONS.MANAGE_QUALITY)
    });
    
    if (user && userProfile) {
      if (!hasManagerAccess()) {
        console.log('권한 없음:', user.email, userProfile.role);
        showToast(t('qualityTypes.messages.accessDenied'), 'error');
        return;
      }
      console.log('권한 확인됨, 데이터 로드 시작');
      loadQualityTypes();
    }
  }, [user, userProfile]);

  // 검색 필터링
  const filteredTypes = qualityTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.nameEn && type.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 토스트 표시
  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  // 토스트 숨기기
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // 폼 입력 처리
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 새 품질 유형 추가
  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      category: 'defect',
      severity: 'medium',
      isActive: true
    });
    setShowModal(true);
  };

  // 품질 유형 수정
  const handleEdit = (type) => {
    setModalMode('edit');
    setSelectedType(type);
    setFormData({
      name: type.name,
      nameEn: type.nameEn || '',
      description: type.description || '',
      category: type.category,
      severity: type.severity,
      isActive: type.isActive
    });
    setShowModal(true);
  };

  // 품질 유형 삭제 확인
  const handleDeleteConfirm = (type) => {
    setDeleteTarget(type);
    setShowDeleteConfirm(true);
  };

  // 품질 유형 저장
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        showToast(t('qualityTypes.messages.nameRequired'), 'error');
        return;
      }

      let result;
      if (modalMode === 'add') {
        // 새로 추가
        result = await qualityAPI.createQualityType(formData);
        if (result.success) {
          setQualityTypes(prev => [result.data, ...prev]);
          showToast(t('qualityTypes.messages.addSuccess'), 'success');
        } else {
          showToast(t('qualityTypes.messages.saveError'), 'error');
          return;
        }
      } else {
        // 수정
        result = await qualityAPI.updateQualityType(selectedType.id, formData);
        if (result.success) {
          setQualityTypes(prev => prev.map(type =>
            type.id === selectedType.id ? result.data : type
          ));
          showToast(t('qualityTypes.messages.updateSuccess'), 'success');
        } else {
          showToast(t('qualityTypes.messages.saveError'), 'error');
          return;
        }
      }

      setShowModal(false);
    } catch (error) {
      console.error('품질 유형 저장 오류:', error);
      showToast(t('qualityTypes.messages.saveError'), 'error');
    }
  };

  // 품질 유형 삭제
  const handleDelete = async () => {
    try {
      console.log('품질 유형 삭제 시도:', deleteTarget);
      console.log('현재 사용자:', user?.email);
      console.log('사용자 프로필:', userProfile);
      
      const result = await qualityAPI.deleteQualityType(deleteTarget.id);
      console.log('삭제 결과:', result);
      
      if (result.success) {
        setQualityTypes(prev => prev.filter(type => type.id !== deleteTarget.id));
        showToast(t('qualityTypes.messages.deleteSuccess'), 'success');
      } else {
        console.error('삭제 실패:', result.error);
        if (result.error?.includes('permission denied')) {
          showToast('로그인이 필요합니다. 다시 로그인해주세요.', 'error');
        } else if (result.error?.includes('users')) {
          showToast('데이터베이스 권한 오류가 발생했습니다. 관리자에게 문의하세요.', 'error');
        } else {
          showToast(`삭제 오류: ${result.error}`, 'error');
        }
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('품질 유형 삭제 오류:', error);
      if (error?.message?.includes('permission denied')) {
        showToast('로그인이 필요합니다. 다시 로그인해주세요.', 'error');
      } else if (error?.message?.includes('users')) {
        showToast('데이터베이스 권한 오류가 발생했습니다. 관리자에게 문의하세요.', 'error');
      } else {
        showToast(`삭제 오류: ${error.message}`, 'error');
      }
    }
  };

  // 심각도 배지 렌더링
  const renderSeverityBadge = (severity) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option?.color || 'text-gray-600 bg-gray-100'}`}>
        {option?.label || severity}
      </span>
    );
  };

  // 카테고리 배지 렌더링
  const renderCategoryBadge = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        {option?.label || category}
      </span>
    );
  };

  if (!hasManagerAccess()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('qualityTypes.messages.accessDenied')}
          </h3>
          <p className="text-gray-600">
            {t('qualityTypes.messages.managerOnly')}
          </p>
        </div>
      </div>
    );
  }

  if (loading || !user || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="w-8 h-8 mr-3 text-blue-600" />
              {t('qualityTypes.title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('qualityTypes.subtitle')}</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t('qualityTypes.buttons.add')}</span>
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('qualityTypes.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 품질 유형 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredTypes.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? t('qualityTypes.messages.noSearchResults') : t('qualityTypes.messages.noData')}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? t('qualityTypes.messages.tryDifferentSearch') : t('qualityTypes.messages.addFirst')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('qualityTypes.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('qualityTypes.table.category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('qualityTypes.table.severity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('qualityTypes.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('qualityTypes.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTypes.map((type) => (
                  <motion.tr
                    key={type.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderCategoryBadge(type.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderSeverityBadge(type.severity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type.isActive ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t('qualityTypes.status.active')}
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          {t('qualityTypes.status.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title={t('qualityTypes.buttons.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(type)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title={t('qualityTypes.buttons.delete')}
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
        )}
      </div>

      {/* 추가/수정 모달 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'add' ? t('qualityTypes.modal.addTitle') : t('qualityTypes.modal.editTitle')}
      >
        <div className="space-y-4">
          {/* 한국어 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('qualityTypes.form.name')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('qualityTypes.form.namePlaceholder')}
            />
          </div>

          {/* 영어 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('qualityTypes.form.nameEn')}
            </label>
            <input
              type="text"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('qualityTypes.form.nameEnPlaceholder')}
            />
          </div>

          {/* 한국어 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('qualityTypes.form.description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('qualityTypes.form.descriptionPlaceholder')}
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('qualityTypes.form.category')}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 심각도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('qualityTypes.form.severity')}
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {severityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              {t('qualityTypes.form.isActive')}
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            {t('qualityTypes.buttons.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {t('qualityTypes.buttons.save')}
          </button>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('qualityTypes.deleteModal.title')}
      >
        <div className="mb-4">
          <p className="text-gray-600">
            {t('qualityTypes.deleteModal.message', { name: deleteTarget?.name })}
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            {t('qualityTypes.buttons.cancel')}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            {t('qualityTypes.buttons.delete')}
          </button>
        </div>
      </Modal>

      {/* 토스트 메시지 */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
};

export default QualityTypesPage; 