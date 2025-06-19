const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// 보안 경고 억제 (개발 환경에서만)
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

// 메인 윈도우 레퍼런스
let mainWindow;

function createWindow() {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, 'assets/icon.png'), // 앱 아이콘
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev, // 개발 환경에서는 웹 보안 비활성화
      allowRunningInsecureContent: isDev, // 개발 환경에서만 허용
      experimentalFeatures: false,
      sandbox: false, // React 개발 도구를 위해 샌드박스 비활성화
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // 초기 로딩 시 숨김
    titleBarStyle: 'default', // 타이틀바 스타일
    backgroundColor: '#1a1a1a' // 어두운 배경색
  });

  // CSP 헤더 설정은 프로덕션에서만 적용
  // 개발 환경에서는 HTML의 간단한 CSP만 사용

  // 애플리케이션 로드
  let startUrl;
  
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    // 프로덕션 환경에서 build 폴더 찾기
    const buildPath = path.join(__dirname, '..', 'build', 'index.html');
    startUrl = `file://${buildPath}`;
  }
  
  console.log('Loading URL:', startUrl);
  console.log('__dirname:', __dirname);
  console.log('Process cwd:', process.cwd());
  console.log('App path:', app.getAppPath());
  console.log('Resources path:', process.resourcesPath);
  
  // 여러 경로 확인
  const possiblePaths = [
    path.join(__dirname, '..', 'build', 'index.html'),
    path.join(process.cwd(), 'build', 'index.html'),
    path.join(app.getAppPath(), 'build', 'index.html'),
    path.join(process.resourcesPath, 'app', 'build', 'index.html')
  ];
  
  console.log('Checking possible paths:');
  possiblePaths.forEach((p, i) => {
    console.log(`${i + 1}. ${p} - exists: ${fs.existsSync(p)}`);
  });
  
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('Failed to load URL:', error);
    
    // 존재하는 첫 번째 경로 사용
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        const fallbackUrl = `file://${testPath}`;
        console.log(`Using fallback URL: ${fallbackUrl}`);
        mainWindow.loadURL(fallbackUrl);
        break;
      }
    }
  });

  // 로드 완료 이벤트 추가
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Content loaded successfully');
  });

  // 로드 실패 이벤트 추가
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load content:', {
      errorCode,
      errorDescription,
      validatedURL
    });
    
    // 오류 페이지 표시
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MES Thailand - Loading Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .error-container {
            text-align: center;
            background: rgba(0,0,0,0.3);
            padding: 40px;
            border-radius: 10px;
            max-width: 500px;
          }
          h1 { color: #ff6b6b; margin-bottom: 20px; }
          .error-details { 
            background: rgba(0,0,0,0.2); 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0;
            font-family: monospace;
            font-size: 12px;
          }
          button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
          }
          button:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>⚠️ Loading Error</h1>
          <p>MES Thailand 애플리케이션을 로드하는 중 오류가 발생했습니다.</p>
          <div class="error-details">
            <strong>Error Code:</strong> ${errorCode}<br>
            <strong>Description:</strong> ${errorDescription}<br>
            <strong>URL:</strong> ${validatedURL}
          </div>
          <button onclick="location.reload()">다시 시도</button>
          <button onclick="require('electron').ipcRenderer.send('open-dev-tools')">개발자 도구 열기</button>
        </div>
      </body>
      </html>
    `;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  });

  // 개발 모드에서는 DevTools 자동 열기
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 개발 모드가 아닐 때 최대화
    if (!isDev) {
      mainWindow.maximize();
    }
  });

  // 윈도우 닫기 이벤트
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 외부 링크를 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // 내비게이션 보안 검사 (프로덕션에서만)
  if (!isDev) {
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.origin !== new URL(startUrl).origin) {
        event.preventDefault();
      }
    });
  }

  // 권한 요청 차단 (프로덕션에서만)
  if (!isDev) {
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
      // 모든 권한 요청을 거부
      callback(false);
    });
  }

  // 새 창 열기 차단
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // 개발 환경에서 에러 디버깅
  if (isDev) {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`Console [${level}]:`, message);
    });
  }
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(() => {
  createWindow();

  // 메뉴 설정
  createMenu();

  // macOS에서 독(dock) 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱 보안 설정
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// 메뉴 생성
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MES Thailand',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About MES Thailand',
              message: 'MES Thailand v1.0.0',
              detail: 'Manufacturing Execution System for Thai Industry\n\nBuilt with Electron + React + Node.js + PostgreSQL'
            });
          }
        }
      ]
    }
  ];

  // macOS 메뉴 조정
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 통신 핸들러
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'Excel Files', extensions: ['xlsx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

// 앱 업데이트 관련 (향후 확장 가능)
ipcMain.handle('check-for-updates', async () => {
  // 업데이트 체크 로직
  return { hasUpdate: false };
});

// 애플리케이션 종료 시 정리
app.on('before-quit', () => {
  // 필요한 정리 작업 수행
  console.log('Application is closing...');
}); 