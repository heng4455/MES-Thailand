import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // 네비게이션 메뉴 항목들
  const navigationItems = [
    {
      key: 'dashboard',
      label: t('navigation.dashboard'),
      emoji: '🏠',
      path: '/dashboard'
    },
    {
      key: 'production',
      label: t('navigation.production'),
      emoji: '⚙️',
      path: '/production'
    },
    {
      key: 'quality',
      label: t('navigation.quality'),
      emoji: '🧪',
      path: '/quality'
    },
    {
      key: 'equipment',
      label: t('navigation.equipment'),
      emoji: '🔧',
      path: '/equipment'
    },
    {
      key: 'planning',
      label: t('navigation.planning'),
      emoji: '📋',
      path: '/planning'
    },
    {
      key: 'reports',
      label: t('navigation.reports'),
      emoji: '📊',
      path: '/reports'
    },
    {
      key: 'admin',
      label: t('navigation.admin'),
      emoji: '👥',
      path: '/admin'
    }
  ];

  // 현재 활성 경로 확인
  const isActiveItem = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // 네비게이션 클릭 핸들러
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around items-center py-2 px-2 max-w-7xl mx-auto">
        {navigationItems.map((item) => {
          const isActive = isActiveItem(item.path);
          
          return (
            <button
              key={item.key}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[100px] ${
                isActive
                  ? 'bg-blue-100 text-blue-600 scale-105'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              aria-label={item.label}
            >
              <div className={`p-1 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-blue-200' : ''
              }`}>
                <span className={`text-lg ${isActive ? 'text-blue-700' : ''}`}>
                  {item.emoji}
                </span>
              </div>
              <span className={`text-xs font-medium mt-1 truncate w-full text-center ${
                isActive ? 'text-blue-700' : ''
              }`}>
                {item.label}
              </span>
              
              {/* 활성 상태 인디케이터 */}
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* 하단 여백 (모바일 Safe Area) */}
      <div className="h-safe-area-inset-bottom bg-white/95"></div>
    </div>
  );
};

export default BottomNavigation; 