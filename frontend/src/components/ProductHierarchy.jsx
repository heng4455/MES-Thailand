import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Building2, 
  Calendar,
  Hash,
  User,
  Phone,
  Mail,
  Settings,
  Cog
} from 'lucide-react';
import { customersAPI, productsAPI, supabase } from '../utils/supabase';

const ProductHierarchy = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [hierarchyData, setHierarchyData] = useState([]);

  useEffect(() => {
    loadHierarchyData();
  }, []);

  const loadHierarchyData = async () => {
    try {
      setLoading(true);
      
      // 제품과 고객 데이터 병렬 로드
      const [productsResult, customersResult] = await Promise.all([
        productsAPI.getAll(),
        customersAPI.getAll()
      ]);

      if (productsResult.success && customersResult.success) {
        const products = productsResult.data;
        const customers = customersResult.data;

        // 제품별로 고객 정보를 그룹화하고 연결된 공정도 로드
        const productHierarchy = await Promise.all(products.map(async (product) => {
          // 해당 제품을 주문한 고객들 찾기
          const relatedCustomers = customers.filter(customer => 
            product.client === customer.customer_name || 
            product.client === customer.company_name
          );

          // 고객 정보가 없는 경우 제품의 client 정보로 기본 고객 객체 생성
          let customersWithDetails = relatedCustomers;
          if (relatedCustomers.length === 0 && product.client) {
            customersWithDetails = [{
              id: `client-${product.client}`,
              customer_name: product.client,
              company_name: product.client,
              contact_person: 'N/A',
              email: 'N/A',
              phone: 'N/A',
              created_at: product.created_at,
              isPlaceholder: true
            }];
          }

          // 해당 제품과 연결된 공정들 조회
          let connectedProcesses = [];
          try {
            console.log(`🔍 제품 ${product.product_code}의 연결된 공정 조회 시작...`);
            
            // 방법 1: description에서 제품 코드로 매칭 (기존 방식)
            const { data: processData1 } = await supabase
              .from('work_centers')
              .select('id, name, code, location, status, description')
              .ilike('description', `%${product.product_code}%`);
            
            console.log(`방법 1 - description 매칭 결과:`, processData1?.length || 0, '개');
            
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
            
            console.log(`방법 2 - process_routes/steps 매칭 결과:`, processData2?.length || 0, '개');
            
            // 방법 3: work_centers에서 직접 제품 코드가 포함된 모든 필드 검색
            const { data: processData3 } = await supabase
              .from('work_centers')
              .select('id, name, code, location, status, description')
              .or(`name.ilike.%${product.product_code}%,code.ilike.%${product.product_code}%,description.ilike.%${product.product_code}%`);
            
            console.log(`방법 3 - 전체 필드 매칭 결과:`, processData3?.length || 0, '개');
            
            // 모든 결과를 합치고 중복 제거
            const allProcesses = new Map();
            
            // 방법 1 결과 추가
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
            
            // 방법 2 결과 추가
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
            
            // 방법 3 결과 추가
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
            
            connectedProcesses = Array.from(allProcesses.values());
            console.log(`✅ 최종 공정 수: ${connectedProcesses.length}개`);
            
            if (connectedProcesses.length > 0) {
              console.log('발견된 공정들:', connectedProcesses.map(p => `${p.name} (${p.code}) - 매칭방법: ${p.matchMethod}`));
            }
            
          } catch (error) {
            console.warn(`제품 ${product.product_code}의 공정 조회 실패:`, error);
          }

          return {
            ...product,
            customers: customersWithDetails,
            customerCount: customersWithDetails.length,
            totalOrders: customersWithDetails.length,
            connectedProcesses: connectedProcesses,
            processCount: connectedProcesses.length
          };
        }));

        // 제품을 고객 수가 많은 순으로 정렬
        productHierarchy.sort((a, b) => b.customerCount - a.customerCount);

        setHierarchyData(productHierarchy);
      }
    } catch (error) {
      console.error('제품 계층 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const toggleCustomer = (customerId) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getProductTypeColor = (productCode) => {
    if (productCode?.includes('CMMP')) return 'bg-blue-100 text-blue-800';
    if (productCode?.includes('CMMPF')) return 'bg-green-100 text-green-800';
    if (productCode?.includes('BS')) return 'bg-purple-100 text-purple-800';
    if (productCode?.includes('SB')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
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
            {[...Array(4)].map((_, i) => (
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
          <Package className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">{t('hierarchical.productView')}</h2>
        </div>
        <div className="text-sm text-gray-500">
          총 제품 수: <span className="font-medium text-green-600">{hierarchyData.length}개</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{t('hierarchical.productDescription')}</p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {hierarchyData.map((product) => (
          <div key={product.id} className="border border-gray-200 rounded-lg">
            {/* 제품 레벨 */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleProduct(product.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {expandedProducts[product.id] ? 
                    <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                  <Package className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-semibold text-gray-900">{product.product_code}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProductTypeColor(product.product_code)}`}>
                        {product.product_code?.includes('CMMP') ? 'CMMP 시리즈' :
                         product.product_code?.includes('CMMPF') ? 'CMMPF 시리즈' : '기타'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{product.product_name}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Hash className="w-4 h-4" />
                    <span>{product.quantity || 0}개</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-4 h-4" />
                    <span>{product.customerCount}개 고객</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Settings className="w-4 h-4" />
                    <span>{product.processCount}개 공정</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(product.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 고객 레벨 */}
            {expandedProducts[product.id] && (
              <div className="border-t border-gray-100 bg-gray-50">
                {product.customers.length > 0 ? (
                  product.customers.map((customer) => (
                    <div key={customer.id} className="border-b border-gray-100 last:border-b-0">
                      {/* 고객 정보 */}
                      <div 
                        className="p-4 pl-12 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleCustomer(customer.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {expandedCustomers[customer.id] ? 
                              <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            }
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">{customer.customer_name}</div>
                              <div className="text-sm text-gray-500">{customer.company_name}</div>
                              {customer.isPlaceholder && (
                                <div className="text-xs text-orange-600">* 고객 정보 미등록</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{customer.contact_person || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Settings className="w-4 h-4" />
                              <span>{product.processCount}개 공정</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(customer.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 고객별 세부 정보 (확장시) */}
                      {expandedCustomers[customer.id] && (
                        <div className="bg-white border-t border-gray-100">
                          {/* 주문 정보 */}
                          <div className="p-4 pl-16">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">주문 정보</h4>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="text-sm">
                                    <span className="text-gray-500">주문 수량:</span>
                                    <span className="font-medium text-gray-900 ml-1">{product.quantity || 0}개</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-500">단위:</span>
                                    <span className="font-medium text-gray-900 ml-1">{product.unit || '개'}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-500">상태:</span>
                                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                      product.order_status === 'completed' ? 'bg-green-100 text-green-600' :
                                      product.order_status === 'processing' ? 'bg-blue-100 text-blue-600' :
                                      product.order_status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {product.order_status === 'completed' ? '완료' :
                                       product.order_status === 'processing' ? '진행중' :
                                       product.order_status === 'pending' ? '대기' :
                                       product.order_status === 'shipped' ? '출고' : '미정'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  주문일: {formatDate(product.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* 연결된 공정 목록 */}
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                                <Cog className="w-4 h-4 mr-1" />
                                연결된 공정 ({product.processCount}개)
                              </h4>
                              {product.connectedProcesses && product.connectedProcesses.length > 0 ? (
                                <div className="space-y-2">
                                  {product.connectedProcesses.map((process) => (
                                    <div key={process.id} className="bg-white rounded p-2 border border-blue-100">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <Cog className="w-4 h-4 text-blue-600" />
                                          <div>
                                            <div className="font-medium text-gray-900">{process.name}</div>
                                            <div className="text-xs text-gray-500">{process.code}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            process.processType === '절삭' ? 'bg-red-100 text-red-600' :
                                            process.processType === '조립' ? 'bg-green-100 text-green-600' :
                                            process.processType === '검사' ? 'bg-purple-100 text-purple-600' :
                                            'bg-gray-100 text-gray-600'
                                          }`}>
                                            {process.processType}
                                          </span>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            process.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {process.status === 'active' ? '활성' : '비활성'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-blue-600">연결된 공정이 없습니다.</div>
                              )}
                            </div>

                            {/* 고객 연락처 정보 */}
                            <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">연락처 정보</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">이메일:</span>
                                  <span className="text-gray-900">{customer.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">전화:</span>
                                  <span className="text-gray-900">{customer.phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 pl-12 text-sm text-gray-500">
                    주문 고객이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hierarchyData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          등록된 제품이 없습니다.
        </div>
      )}
    </div>
  );
};

export default ProductHierarchy; 