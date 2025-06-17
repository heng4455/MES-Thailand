import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Factory, Settings, CheckSquare, 
  Package, BarChart3, Users, LogOut, Menu, X,
  Globe, Bell, User, Shield, Box, Cog
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useUser } from '../contexts/UserContext';

const MainLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { userProfile, canAccessAdminPanel, signOut } = useUser();

  const menuItems = [
    {
      path: '/dashboard',
      translationKey: 'navigation.dashboard',
      icon: LayoutDashboard,
      color: 'blue'
    },
    {
      path: '/customers',
      translationKey: 'navigation.customers',
      icon: Users,
      color: 'teal'
    },
    {
      path: '/products',
      translationKey: 'navigation.products',
      icon: Package,
      color: 'amber'
    },
    {
      path: '/process',
      translationKey: 'navigation.process',
      icon: Cog,
      color: 'indigo'
    },
    {
      path: '/production',
      translationKey: 'navigation.production',
      icon: Factory,
      color: 'green'
    },
    {
      path: '/equipment',
      translationKey: 'navigation.equipment',
      icon: Settings,
      color: 'orange'
    },
    {
      path: '/quality',
      translationKey: 'navigation.quality',
      icon: CheckSquare,
      color: 'red'
    },
    {
      path: '/inventory',
      translationKey: 'navigation.inventory',
      icon: Box,
      color: 'purple'
    },
    {
      path: '/reports',
      translationKey: 'navigation.reports',
      icon: BarChart3,
      color: 'indigo'
    },
    // 관리자 패널 - 권한이 있는 사용자만
    ...(canAccessAdminPanel() ? [{
      path: '/admin-panel',
      translationKey: 'admin.title',
      icon: Shield,
      color: 'red',
      isAdmin: true
    }] : [])
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = async () => {
    console.log('🚪 로그아웃 시도... (간단한 방식)');
    
    try {
      // Supabase 로그아웃 시도 (비동기로 백그라운드에서)
      signOut().catch(err => console.log('Supabase 로그아웃 오류:', err));
    } catch (error) {
      console.log('로그아웃 오류 무시:', error);
    }
    
    // 즉시 로컬 정리 및 이동 (긴급 로그아웃 방식)
    localStorage.clear();
    console.log('✅ 로컬 스토리지 정리 완료, 로그인 페이지로 이동');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* 로고 영역 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <img src={logo} alt="MES Thailand Logo" className="w-8 h-8 object-contain" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-gray-800">MES Thailand</h1>
                <p className="text-xs text-gray-500">{t('layout.manufacturingSystem')}</p>
              </div>
            )}
          </div>
        </div>

        {/* 메뉴 영역 */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? `bg-${item.color}-50 text-${item.color}-600 border-r-4 border-${item.color}-500`
                    : item.isAdmin
                    ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{t(item.translationKey)}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 하단 영역 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">{t('navigation.logout')}</span>}
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>🕐</span>
                <span>{new Date().toLocaleString(i18n.language === 'ko' ? 'ko-KR' : i18n.language === 'th' ? 'th-TH' : i18n.language === 'zh' ? 'zh-CN' : 'en-US')}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 언어 선택 */}
              <div className="relative">
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ko">🇰🇷 한국어</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="zh">🇨🇳 中文</option>
                  <option value="th">🇹🇭 ไทย</option>
                </select>
                <Globe className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* 알림 */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title={t('layout.notifications')}>
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* 사용자 프로필 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : t('layout.admin')}
                  </div>
                  <div className="text-gray-500">
                    {userProfile?.role ? userProfile.role : t('layout.realtimeMonitoring')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 