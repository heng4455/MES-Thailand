const { contextBridge, ipcRenderer } = require('electron');

// 안전한 API를 렌더러 프로세스에 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 앱 정보
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 파일 다이얼로그
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),

  // 메뉴 이벤트 리스너
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new', callback);
    ipcRenderer.on('menu-save', callback);
  },

  // 메뉴 이벤트 리스너 제거
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new');
    ipcRenderer.removeAllListeners('menu-save');
  },

  // 업데이트 체크
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // 시스템 정보
  platform: process.platform,
  
  // 환경 정보
  isDev: process.env.NODE_ENV === 'development'
});

// Window 전역 객체에 MES 관련 정보 추가
window.MES_CONFIG = {
  APP_NAME: 'MES Thailand',
  VERSION: '1.0.0',
  BUILD_DATE: new Date().toISOString(),
  ENVIRONMENT: process.env.NODE_ENV || 'production'
}; 