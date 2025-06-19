import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Factory, Settings, CheckSquare, 
  Package, BarChart3, Users, LogOut, Menu, X,
  Globe, Bell, User, Shield, Box, Cog, Clock, Check, AlertTriangle, Info
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useUser } from '../contexts/UserContext';
import DesktopDownload from '../components/DesktopDownload';

const MainLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, hasPermission, PERMISSIONS, signOut } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

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
    ...(hasPermission('ADMIN_ACCESS') || userProfile?.role === 'admin' || user?.email === 'joon@coilmaster.com' ? [{
      path: '/admin-panel',
      translationKey: 'admin.title',
      icon: Shield,
      color: 'red',
      isAdmin: true
    }] : [])
  ];

  // 알림 데이터 (실제로는 API에서 가져와야 함)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '생산 라인 A 알림',
      message: '라인 A에서 품질 이상이 감지되었습니다.',
      type: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
      read: false
    },
    {
      id: 2,
      title: '장비 점검 완료',
      message: '프레스 #2 정기 점검이 완료되었습니다.',
      type: 'success',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15분 전
      read: false
    },
    {
      id: 3,
      title: '재고 부족 경고',
      message: '원자재 ABC-123의 재고가 부족합니다.',
      type: 'error',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30분 전
      read: true
    },
    {
      id: 4,
      title: '생산 목표 달성',
      message: '오늘 생산 목표 100%를 달성했습니다.',
      type: 'info',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1시간 전
      read: true
    },
    {
      id: 5,
      title: '새 작업지시서',
      message: '작업지시서 WO-2025-001이 등록되었습니다.',
      type: 'info',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      read: true
    }
  ]);

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.read).length;

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 알림 아이콘 렌더링
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  // 알림 배경색
  const getNotificationBg = (type, read) => {
    const baseColor = read ? 'bg-gray-50' : 'bg-white';
    switch (type) {
      case 'success':
        return `${baseColor} border-l-4 border-green-500`;
      case 'warning':
        return `${baseColor} border-l-4 border-yellow-500`;
      case 'error':
        return `${baseColor} border-l-4 border-red-500`;
      case 'info':
      default:
        return `${baseColor} border-l-4 border-blue-500`;
    }
  };

  // 시간 포맷
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('layout.justNow');
    if (minutes < 60) return `${minutes}${t('layout.minutesAgo')}`;
    if (hours < 24) return `${hours}${t('layout.hoursAgo')}`;
    return `${days}${t('layout.daysAgo')}`;
  };

  // 개별 알림 읽음 처리
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = async () => {
    console.log('🚪 로그아웃 시도... (간단한 방식)');
    
    try {
      // Supabase 로그아웃 시도 (비동기로 백그라운드에서)
      // UserContext에서 제공하는 로그아웃 함수가 있다면 사용
      if (typeof signOut === 'function') {
        signOut().catch(err => console.log('Supabase 로그아웃 오류:', err));
      }
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
              {/* 데스크톱 앱 다운로드 */}
              <DesktopDownload />
              
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
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" 
                  title={t('layout.notifications')}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* 알림 드롭다운 */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                         <div className="p-4 border-b border-gray-200">
                       <div className="flex items-center justify-between mb-2">
                         <h3 className="text-lg font-semibold text-gray-800">{t('layout.notifications')}</h3>
                         {unreadCount > 0 && (
                           <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                             {unreadCount}{t('layout.unreadNotifications')}
                           </span>
                         )}
                       </div>
                       {unreadCount > 0 && (
                         <button
                           onClick={markAllNotificationsAsRead}
                           className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                         >
                           {t('layout.markAllAsRead')}
                         </button>
                       )}
                     </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                                             {notifications.length === 0 ? (
                         <div className="p-6 text-center text-gray-500">
                           <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                           <p>{t('layout.noNotifications')}</p>
                         </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                                                     {notifications.map((notification) => (
                             <div 
                               key={notification.id}
                               onClick={() => markNotificationAsRead(notification.id)}
                               className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${getNotificationBg(notification.type, notification.read)}`}
                             >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className={`text-sm font-medium truncate ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                    )}
                                  </div>
                                  <p className={`text-sm mt-1 ${notification.read ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center mt-2 text-xs text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(notification.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button 
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                     onClick={() => {
                             setShowNotifications(false);
                             // 실제로는 알림 페이지로 이동
                             console.log('모든 알림 보기');
                           }}
                         >
                           {t('layout.viewAllNotifications')}
                         </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 사용자 프로필 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-white font-medium">
                      {userProfile?.firstName?.charAt(0) || '관'}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {userProfile 
                      ? `${userProfile.firstName || '관리자'} ${userProfile.lastName || ''}`.trim()
                      : '관리자'
                    }
                  </div>
                  <div className="text-gray-500">
                    {userProfile?.position || userProfile?.role || 'Administrator'}
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