const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 MES Thailand 데스크톱 앱 실행 중...');

// build 폴더 확인
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
    console.log('❌ build 폴더가 없습니다. 먼저 빌드를 실행하세요:');
    console.log('   npm run build');
    process.exit(1);
}

// electron.js 파일 복사 (없는 경우)
const electronFile = path.join(buildPath, 'electron.js');
if (!fs.existsSync(electronFile)) {
    const sourceElectron = path.join(__dirname, 'public', 'electron.js');
    if (fs.existsSync(sourceElectron)) {
        fs.copyFileSync(sourceElectron, electronFile);
        console.log('✅ electron.js 파일 복사 완료');
    }
}

// preload.js 파일 복사 (없는 경우)
const preloadFile = path.join(buildPath, 'preload.js');
if (!fs.existsSync(preloadFile)) {
    const sourcePreload = path.join(__dirname, 'public', 'preload.js');
    if (fs.existsSync(sourcePreload)) {
        fs.copyFileSync(sourcePreload, preloadFile);
        console.log('✅ preload.js 파일 복사 완료');
    }
}

// Electron 실행
console.log('🖥️  Electron 앱 시작...');
const electronProcess = exec('npx electron build/electron.js', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Electron 실행 오류:', error);
        return;
    }
    if (stderr) {
        console.error('⚠️ Stderr:', stderr);
    }
    console.log('📱 Stdout:', stdout);
});

electronProcess.on('close', (code) => {
    console.log(`🔚 Electron 프로세스 종료됨. 코드: ${code}`);
});

console.log('💡 데스크톱 앱이 실행되었습니다!');
console.log('💡 웹브라우저 버전: http://localhost:3000');
console.log('💡 두 버전 모두 동일한 기능을 제공합니다.'); 