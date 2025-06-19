import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Package, 
  Settings, 
  Calendar,
  Users,
  Hash,
  MapPin,
  Cog
} from 'lucide-react';
import { customersAPI, productsAPI, processAPI, equipmentAPI, supabase } from '../utils/supabase';

const CustomerHierarchy = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedProcesses, setExpandedProcesses] = useState({});
  const [hierarchyData, setHierarchyData] = useState([]);

  useEffect(() => {
    loadHierarchyData();
  }, []);

  const loadHierarchyData = async () => {
    try {
      setLoading(true);
      
      // 모든 데이터 병렬 로드
      const [customersResult, productsResult, processResult, equipmentResult] = await Promise.all([
        customersAPI.getAll(),
        productsAPI.getAll(),
        processAPI.getAll(),
        equipmentAPI.getAll()
      ]);

      if (customersResult.success && productsResult.success) {
        const customers = customersResult.data;
        const products = productsResult.data;
        const processes = processResult.success ? processResult.data : [];
        const equipment = equipmentResult.success ? equipmentResult.data : [];

        // 고객별로 제품을 그룹화
        const customerHierarchy = await Promise.all(customers.map(async (customer) => {
          // 해당 고객의 제품들 찾기
          const customerProducts = products.filter(product => 
            product.client === customer.customer_name || 
            product.client === customer.company_name
          );

          // 각 제품에 대한 공정과 설비 정보 추가
          const productsWithDetails = await Promise.all(customerProducts.map(async (product) => {
            // 해당 제품의 공정들 찾기 - 개선된 방법 사용
            let productProcesses = [];
            try {
              console.log(`🔍 고객 ${customer.customer_name}의 제품 ${product.product_code} 공정 조회...`);
              
              // 방법 1: description에서 제품 코드로 매칭
              const { data: processData1 } = await supabase
                .from('work_centers')
                .select('id, name, code, location, status, description')
                .ilike('description', `%${product.product_code}%`);
              
              // 방법 2: process_routes와 process_steps를 통한 매칭
              const { data: processData2 } = await supabase
                .from('process_steps')
                .select(`
                  work_center_id,
                  work_centers!inner(
                    id, name, code, location, status, description
                  ),
                  process_routes!inner(
                    product_id,
                    products!inner(
                      product_code
                    )
                  )
                `)
                .eq('process_routes.products.product_code', product.product_code);
              
              // 방법 3: 전체 필드 검색
              const { data: processData3 } = await supabase
                .from('work_centers')
                .select('id, name, code, location, status, description')
                .or(`name.ilike.%${product.product_code}%,code.ilike.%${product.product_code}%,description.ilike.%${product.product_code}%`);
              
              // 결과 합치기
              const allProcesses = new Map();
              
              if (processData1) {
                processData1.forEach(process => {
                  allProcesses.set(process.id, {
                    id: process.id,
                    name: process.name,
                    code: process.code,
                    processType: process.location || '일반',
                    status: process.status || 'active',
                    description: process.description,
                    matchMethod: 'description'
                  });
                });
              }
              
              if (processData2) {
                processData2.forEach(item => {
                  const process = item.work_centers;
                  allProcesses.set(process.id, {
                    id: process.id,
                    name: process.name,
                    code: process.code,
                    processType: process.location || '일반',
                    status: process.status || 'active',
                    description: process.description,
                    matchMethod: 'process_routes'
                  });
                });
              }
              
              if (processData3) {
                processData3.forEach(process => {
                  if (!allProcesses.has(process.id)) {
                    allProcesses.set(process.id, {
                      id: process.id,
                      name: process.name,
                      code: process.code,
                      processType: process.location || '일반',
                      status: process.status || 'active',
                      description: process.description,
                      matchMethod: 'field_search'
                    });
                  }
                });
              }
              
              productProcesses = Array.from(allProcesses.values());
              console.log(`✅ 제품 ${product.product_code} 공정 수: ${productProcesses.length}개`);
              
            } catch (error) {
              console.warn(`제품 ${product.product_code}의 공정 조회 실패:`, error);
            }

            // 각 공정에 대한 설비 정보 추가
            const processesWithEquipment = productProcesses.map(process => {
              const relatedEquipment = equipment.filter(eq => 
                eq.name === process.name ||
                eq.location === process.location ||
                eq.equipment_code === process.code
              );

              return {
                ...process,
                equipment: relatedEquipment
              };
            });

            return {
              ...product,
              processes: processesWithEquipment,
              processCount: processesWithEquipment.length,
              equipmentCount: processesWithEquipment.reduce((sum, p) => sum + p.equipment.length, 0)
            };
          }));

          return {
            ...customer,
            products: productsWithDetails,
            productCount: productsWithDetails.length,
            totalProcesses: productsWithDetails.reduce((sum, p) => sum + p.processCount, 0),
            totalEquipment: productsWithDetails.reduce((sum, p) => sum + p.equipmentCount, 0)
          };
        }));

        setHierarchyData(customerHierarchy);
      }
    } catch (error) {
      console.error('계층 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomer = (customerId) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const toggleProduct = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const toggleProcess = (processId) => {
    setExpandedProcesses(prev => ({
      ...prev,
      [processId]: !prev[processId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">{t('hierarchical.customerView')}</h2>
        </div>
        <div className="text-sm text-gray-500">
          총 고객 수: <span className="font-medium text-blue-600">{hierarchyData.length}개</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{t('hierarchical.customerDescription')}</p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {hierarchyData.map((customer) => (
          <div key={customer.id} className="border border-gray-200 rounded-lg">
            {/* 고객 레벨 */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleCustomer(customer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {expandedCustomers[customer.id] ? 
                    <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">{customer.customer_name}</div>
                    <div className="text-sm text-gray-500">{customer.company_name}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{customer.contact_person || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="w-4 h-4" />
                    <span>{customer.productCount}개 제품</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Cog className="w-4 h-4" />
                    <span>{customer.totalProcesses}개 공정</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 제품 레벨 */}
            {expandedCustomers[customer.id] && (
              <div className="border-t border-gray-100 bg-gray-50">
                {customer.products.length > 0 ? (
                  customer.products.map((product) => (
                    <div key={product.id} className="border-b border-gray-100 last:border-b-0">
                      <div 
                        className="p-4 pl-12 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {expandedProducts[product.id] ? 
                              <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                            <Package className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900">{product.product_code}</div>
                              <div className="text-sm text-gray-500">{product.product_name}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Hash className="w-4 h-4" />
                              <span>{product.quantity || 0}개</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Cog className="w-4 h-4" />
                              <span>{product.processCount}개 공정</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(product.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 공정 레벨 */}
                      {expandedProducts[product.id] && (
                        <div className="bg-white">
                          {product.processes.length > 0 ? (
                            product.processes.map((process) => (
                              <div key={process.id} className="border-b border-gray-100 last:border-b-0">
                                <div 
                                  className="p-4 pl-20 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleProcess(process.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      {expandedProcesses[process.id] ? 
                                        <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                      }
                                      <Settings className="w-4 h-4 text-purple-600" />
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {process.operation_name || process.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {process.description || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {process.equipment.length}개 설비
                                    </div>
                                  </div>
                                </div>

                                {/* 설비 레벨 */}
                                {expandedProcesses[process.id] && (
                                  <div className="bg-gray-50">
                                    {process.equipment.length > 0 ? (
                                      process.equipment.map((equipment) => (
                                        <div key={equipment.id} className="p-4 pl-28 border-b border-gray-100 last:border-b-0">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                              <Settings className="w-4 h-4 text-orange-600" />
                                              <div>
                                                <div className="font-medium text-gray-900">{equipment.name}</div>
                                                <div className="text-sm text-gray-500">{equipment.type || 'N/A'}</div>
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                              <div className="flex items-center space-x-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{equipment.location || 'N/A'}</span>
                                              </div>
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                equipment.status === 'operational' ? 'bg-green-100 text-green-600' :
                                                equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-red-100 text-red-600'
                                              }`}>
                                                {equipment.status === 'operational' ? '가동중' :
                                                 equipment.status === 'maintenance' ? '보전중' :
                                                 equipment.status === 'stopped' ? '정지' : '알 수 없음'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="p-4 pl-28 text-sm text-gray-500">
                                        등록된 설비가 없습니다.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-4 pl-20 text-sm text-gray-500">
                              등록된 공정이 없습니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 pl-12 text-sm text-gray-500">
                    등록된 제품이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hierarchyData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          등록된 고객이 없습니다.
        </div>
      )}
    </div>
  );
};

export default CustomerHierarchy; 