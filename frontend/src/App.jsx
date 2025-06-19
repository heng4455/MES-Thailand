import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { User, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import ProcessPage from './pages/ProcessPage';
import ProductionPage from './pages/ProductionPage';
import EquipmentPage from './pages/EquipmentPage';
import QualityPage from './pages/QualityPage';
import QualityTypesPage from './pages/QualityTypesPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import MainLayout from './layouts/MainLayout';

import AdminPage from './pages/AdminPage';
import AuthTestPage from './pages/AuthTestPage';
import { UserProvider, useUser } from './contexts/UserContext';

// i18n 초기화
import './utils/i18n';

// Supabase 테스트 도구 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  import('./utils/supabaseTest');
}

// 인증 가드 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { user, userProfile, loading } = useUser();
  const { t } = useTranslation();

  // 로딩 중일 때 로딩 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('auth.loggingIn')}</p>
          <p className="text-xs text-gray-500 mt-2">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  // 사용자가 로그인하지 않았으면 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 사용자 프로필이 없으면 승인 대기 상태로 처리
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('auth.awaitingApproval')}</h2>
          <p className="text-gray-600 mb-4">
            {t('auth.awaitingApprovalDesc')}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.user')}: {user.email}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  // 승인되지 않은 사용자는 대기 페이지 표시
  if (userProfile.approvalStatus !== 'approved') {
    console.log('❌ 승인되지 않은 사용자:', {
      email: user.email,
      approvalStatus: userProfile.approvalStatus,
      role: userProfile.role
    });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('auth.awaitingApproval')}</h2>
          <p className="text-gray-600 mb-4">
            {t('auth.awaitingApprovalMessage')}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">{t('auth.firstName')}:</span> {userProfile.firstName} {userProfile.lastName}</p>
              <p><span className="font-medium">{t('auth.email')}:</span> {user.email}</p>
              <p><span className="font-medium">{t('auth.department')}:</span> {userProfile.department}</p>
              <p><span className="font-medium">상태:</span> 
                <span className="ml-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
                  {userProfile.approvalStatus}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    );
  }

  // 모든 조건을 만족한 인증된 사용자만 접근 허용
  console.log('✅ 인증된 사용자 접근 허용:', {
    email: user.email,
    name: `${userProfile.firstName} ${userProfile.lastName}`,
    role: userProfile.role,
    approvalStatus: userProfile.approvalStatus
  });
  return children;
};

// 매니저 권한 가드 컴포넌트
const ManagerRoute = ({ children }) => {
  const { user, userProfile, hasPermission, PERMISSIONS } = useUser();

  // 사용자가 로그인하지 않았으면 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 매니저 권한 확인
  const hasManagerAccess = () => {
    if (!userProfile) return false;
    
    // 관리자 이메일 체크
    if (user?.email === 'admin@mes-thailand.com' || 
        user?.email === 'joon@coilmaster.com') {
      return true;
    }
    
    // MANAGE_QUALITY 권한 체크 또는 admin/manager 역할 체크
    return hasPermission(PERMISSIONS.MANAGE_QUALITY) || 
           userProfile.role === 'admin' || 
           userProfile.role === 'manager';
  };

  // 권한이 없으면 대시보드로 리다이렉트
  if (!hasManagerAccess()) {
    return <Navigate to="/dashboard" replace />;
  }

  // 권한이 있으면 요청된 페이지 렌더링
  return children;
};

// 앱 라우터 컴포넌트
const AppRoutes = () => {
  const { user, loading } = useUser();
  const { t } = useTranslation();

  // 로딩 중일 때 전체 화면 로딩 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t('auth.loggingIn')}</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 인증이 필요 없는 페이지들 */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />
      <Route 
        path="/verify-email" 
        element={user ? <Navigate to="/dashboard" replace /> : <EmailVerificationPage />} 
      />
      
      {/* 인증이 필요한 페이지들 - ProtectedRoute와 MainLayout으로 감싸기 */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <MainLayout>
            <CustomersPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute>
          <MainLayout>
            <ProductsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/process" element={
        <ProtectedRoute>
          <MainLayout>
            <ProcessPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/production" element={
        <ProtectedRoute>
          <MainLayout>
            <ProductionPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/equipment" element={
        <ProtectedRoute>
          <MainLayout>
            <EquipmentPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/quality" element={
        <ProtectedRoute>
          <MainLayout>
            <QualityPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/quality-types" element={
        <ProtectedRoute>
          <MainLayout>
            <QualityTypesPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <MainLayout>
            <InventoryPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-panel" element={
        <ProtectedRoute>
          <MainLayout>
            <AdminPanelPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* 개발/테스트 페이지들 */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/auth-test" element={<AuthTestPage />} />
      
      {/* 루트 경로 처리 */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* 잘못된 경로 처리 */}
      <Route 
        path="*" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <AppRoutes />
        
          {/* Toast 알림 */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App; 