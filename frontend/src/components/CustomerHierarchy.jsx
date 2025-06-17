import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, ChevronDown, Package, 
  Settings, Building2, CheckCircle, AlertCircle, 
  Clock, User
} from 'lucide-react';

const CustomerHierarchy = () => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState({});

  // 고객별 데이터
  const customersData = [
    {
      id: 'HL',
      name: 'HL Clemove',
      companyName: 'HL Clemove Co., Ltd.',
      contact: '김철수',
      email: 'kim@hlclemove.com',
      phone: '02-1234-5678',
      status: 'active',
      products: [
        {
          id: 'CMI-CMMP252012BS-2R2M',
          name: 'CMMP252012BS-2R2M',
          quantity: 1000,
          unit: '개',
          orderDate: '2024-01-15',
          status: 'processing',
          processes: [
            {
              id: 'P001',
              name: '코일 권선',
              status: 'completed',
              equipment: [
                { id: 'EQ001', name: '권선기 #1', status: 'running' },
                { id: 'EQ002', name: '권선기 #2', status: 'maintenance' }
              ]
            },
            {
              id: 'P002',
              name: '절연 처리',
              status: 'processing',
              equipment: [
                { id: 'EQ003', name: '절연기 #1', status: 'running' }
              ]
            },
            {
              id: 'P003',
              name: '최종 검사',
              status: 'pending',
              equipment: [
                { id: 'EQ004', name: '검사장비 #1', status: 'idle' }
              ]
            }
          ]
        },
        {
          id: 'CMI-CMMP252012BS-R68M',
          name: 'CMMP252012BS-R68M',
          quantity: 500,
          unit: '개',
          orderDate: '2024-02-01',
          status: 'processing',
          processes: [
            {
              id: 'P001',
              name: '코일 권선',
              status: 'processing',
              equipment: [
                { id: 'EQ001', name: '권선기 #1', status: 'running' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'LG',
      name: 'LG VS',
      companyName: 'LG Vehicular Solutions',
      contact: '이영희',
      email: 'lee@lgvs.com',
      phone: '02-2345-6789',
      status: 'active',
      products: [
        {
          id: 'CMI-CMMPF6030QL-R47M-SB',
          name: 'CMMPF6030QL-R47M-SB',
          quantity: 750,
          unit: '개',
          orderDate: '2024-01-20',
          status: 'processing',
          processes: [
            {
              id: 'P004',
              name: '페라이트 성형',
              status: 'completed',
              equipment: [
                { id: 'EQ005', name: '성형기 #1', status: 'running' }
              ]
            },
            {
              id: 'P005',
              name: '코어 조립',
              status: 'processing',
              equipment: [
                { id: 'EQ006', name: '조립기 #1', status: 'running' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'MOBIS',
      name: 'MOBIS',
      companyName: 'Hyundai Mobis Co., Ltd.',
      contact: '박민수',
      email: 'park@mobis.com',
      phone: '02-3456-7890',
      status: 'active',
      products: []
    }
  ];

  const toggleExpand = (itemId, level = '') => {
    const key = level ? `${level}-${itemId}` : itemId;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isExpanded = (itemId, level = '') => {
    const key = level ? `${level}-${itemId}` : itemId;
    return expandedItems[key] || false;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'maintenance': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'idle': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return t('customers.completed');
      case 'processing': return t('production.processing');
      case 'pending': return t('customers.pending');
      case 'active': return t('customers.active');
      case 'running': return t('dashboard.running');
      case 'maintenance': return t('dashboard.maintenance');
      case 'idle': return t('hierarchical.idle');
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('hierarchical.customerView')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('hierarchical.customerDescription')}</p>
        </div>
                 <div className="text-right">
           <div className="text-2xl font-bold text-blue-600">{customersData.length}</div>
           <div className="text-sm text-gray-500">{t('hierarchical.totalCustomers')}</div>
         </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {customersData.map((customer) => (
            <div key={customer.id} className="border border-gray-200 rounded-lg">
              {/* 고객 헤더 */}
              <div 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(customer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded(customer.id) ? 
                      <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-500">{customer.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{customer.contact}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{customer.products.length}{t('hierarchical.products')}</span>
                    </div>
                    {getStatusIcon(customer.status)}
                  </div>
                </div>
              </div>

              {/* 제품 목록 */}
              {isExpanded(customer.id) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {customer.products.length > 0 ? (
                    customer.products.map((product) => (
                      <div key={product.id} className="ml-8">
                        <div 
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                          onClick={() => toggleExpand(product.id, 'product')}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {isExpanded(product.id, 'product') ? 
                                <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              }
                              <Package className="w-4 h-4 text-green-600" />
                              <div>
                                <h4 className="font-medium text-gray-800">{product.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {product.quantity} {product.unit} | {product.orderDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{product.processes.length}{t('hierarchical.processes')}</span>
                              {getStatusIcon(product.status)}
                            </div>
                          </div>
                        </div>

                        {/* 공정 목록 */}
                        {isExpanded(product.id, 'product') && (
                          <div className="ml-8 bg-white">
                            {product.processes.map((process) => (
                              <div key={process.id} className="border-l-2 border-gray-200">
                                <div 
                                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => toggleExpand(process.id, 'process')}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      {isExpanded(process.id, 'process') ? 
                                        <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                      }
                                      <Settings className="w-4 h-4 text-purple-600" />
                                      <div>
                                        <h5 className="font-medium text-gray-700">{process.name}</h5>
                                        <p className="text-xs text-gray-500">{process.id}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">{process.equipment.length}{t('hierarchical.equipment')}</span>
                                      {getStatusIcon(process.status)}
                                    </div>
                                  </div>
                                </div>

                                {/* 설비 목록 */}
                                {isExpanded(process.id, 'process') && (
                                  <div className="ml-8 bg-blue-50">
                                    {process.equipment.map((equipment) => (
                                      <div key={equipment.id} className="p-2 border-b border-blue-100 last:border-b-0">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <Settings className="w-3 h-3 text-orange-600" />
                                            <span className="text-sm font-medium text-gray-700">{equipment.name}</span>
                                            <span className="text-xs text-gray-500">({equipment.id})</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            {getStatusIcon(equipment.status)}
                                            <span className="text-xs text-gray-600">{getStatusText(equipment.status)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      등록된 제품이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerHierarchy; 