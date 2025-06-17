import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
  const { user } = useUser();

  // 사용자가 로그인하지 않았으면 로그인 페이지로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 인증된 사용자면 요청된 페이지 렌더링
  return children;
};

// 앱 라우터 컴포넌트
const AppRoutes = () => {
  const { user } = useUser();

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