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
import { UserProvider } from './contexts/UserContext';

// i18n 초기화
import './utils/i18n';

// Supabase 테스트 도구 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  import('./utils/supabaseTest');
}

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
        <Routes>
          {/* 인증이 필요 없는 페이지들 */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          
          {/* 인증이 필요한 페이지들 - MainLayout으로 감싸기 */}
          <Route path="/dashboard" element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          } />
          <Route path="/customers" element={
            <MainLayout>
              <CustomersPage />
            </MainLayout>
          } />
          <Route path="/products" element={
            <MainLayout>
              <ProductsPage />
            </MainLayout>
          } />
          <Route path="/process" element={
            <MainLayout>
              <ProcessPage />
            </MainLayout>
          } />
          <Route path="/production" element={
            <MainLayout>
              <ProductionPage />
            </MainLayout>
          } />
          <Route path="/equipment" element={
            <MainLayout>
              <EquipmentPage />
            </MainLayout>
          } />
          <Route path="/quality" element={
            <MainLayout>
              <QualityPage />
            </MainLayout>
          } />
          <Route path="/inventory" element={
            <MainLayout>
              <InventoryPage />
            </MainLayout>
          } />
          <Route path="/reports" element={
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          } />
          <Route path="/admin-panel" element={
            <MainLayout>
              <AdminPanelPage />
            </MainLayout>
          } />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/auth-test" element={<AuthTestPage />} />
          
          {/* 잘못된 경로는 로그인으로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        
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