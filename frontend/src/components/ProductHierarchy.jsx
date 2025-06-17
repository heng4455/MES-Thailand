import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, ChevronDown, Users, Package, 
  Calendar, Building2, CheckCircle, AlertCircle, 
  Clock
} from 'lucide-react';

const ProductHierarchy = () => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState({});

  // 제품별 데이터
  const productsData = [
    {
      id: 'CMI-CMMP252012BS-2R2M',
      name: 'CMMP252012BS-2R2M',
      category: '인덕터',
      orderDate: '2024-01-15',
      customers: [
        {
          id: 'HL',
          name: 'HL Clemove',
          companyName: 'HL Clemove Co., Ltd.',
          quantity: 1000,
          requestDate: '2024-01-15',
          deliveryDate: '2024-03-15',
          status: 'processing'
        }
      ]
    },
    {
      id: 'CMI-CMMP252012BS-R68M',
      name: 'CMMP252012BS-R68M',
      category: '인덕터',
      orderDate: '2024-02-01',
      customers: [
        {
          id: 'HL',
          name: 'HL Clemove',
          companyName: 'HL Clemove Co., Ltd.',
          quantity: 500,
          requestDate: '2024-02-01',
          deliveryDate: '2024-04-01',
          status: 'processing'
        }
      ]
    },
    {
      id: 'CMI-CMMPF6030QL-R47M-SB',
      name: 'CMMPF6030QL-R47M-SB',
      category: '트랜스포머',
      orderDate: '2024-01-20',
      customers: [
        {
          id: 'LG',
          name: 'LG VS',
          companyName: 'LG Vehicular Solutions',
          quantity: 750,
          requestDate: '2024-01-20',
          deliveryDate: '2024-03-20',
          status: 'processing'
        }
      ]
    },
    {
      id: 'CMI-CMMPF7040QL-R33M-SB',
      name: 'CMMPF7040QL-R33M-SB',
      category: '트랜스포머',
      orderDate: '2024-02-10',
      customers: [
        {
          id: 'LG',
          name: 'LG VS',
          companyName: 'LG Vehicular Solutions',
          quantity: 300,
          requestDate: '2024-02-10',
          deliveryDate: '2024-04-10',
          status: 'pending'
        },
        {
          id: 'MOBIS',
          name: 'MOBIS',
          companyName: 'Hyundai Mobis Co., Ltd.',
          quantity: 200,
          requestDate: '2024-02-15',
          deliveryDate: '2024-04-15',
          status: 'pending'
        }
      ]
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
      case 'shipped': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return t('customers.completed');
      case 'processing': return t('production.processing');
      case 'pending': return t('customers.pending');
      case 'shipped': return t('products.shipped');
      default: return status;
    }
  };

  // 총 주문 수량 계산
  const getTotalQuantity = (product) => {
    return product.customers.reduce((total, customer) => total + customer.quantity, 0);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('hierarchical.productView')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('hierarchical.productDescription')}</p>
        </div>
                 <div className="text-right">
           <div className="text-2xl font-bold text-green-600">{productsData.length}</div>
           <div className="text-sm text-gray-500">{t('hierarchical.totalProducts')}</div>
         </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {productsData.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg">
              {/* 제품 헤더 */}
              <div 
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(product.id, 'productView')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded(product.id, 'productView') ? 
                      <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    }
                    <Package className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{product.orderDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{product.customers.length}{t('hierarchical.customers')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{getTotalQuantity(product)}{t('products.pieces')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 고객 목록 */}
              {isExpanded(product.id, 'productView') && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {product.customers.map((customer) => (
                    <div key={customer.id} className="ml-8 p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-800">{customer.name}</h4>
                            <p className="text-sm text-gray-500">{customer.companyName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4 mb-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{t('hierarchical.requestDate')}: {customer.requestDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{t('hierarchical.deliveryDate')}: {customer.deliveryDate}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{customer.quantity}{t('products.pieces')}</span>
                            {getStatusIcon(customer.status)}
                            <span className="text-xs text-gray-600">{getStatusText(customer.status)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductHierarchy; 