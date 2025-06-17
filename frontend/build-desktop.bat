@echo off
echo MES Thailand 데스크톱 앱 빌드 시작...

echo 1. React 앱 빌드 중...
call npm run build

echo 2. Electron 파일 복사 중...
if not exist "build\" mkdir build
copy "public\electron.js" "build\"
copy "public\preload.js" "build\"

echo 3. 데스크톱 앱 시작...
echo 빌드 완료! Electron 앱을 실행하려면 다음 명령어를 사용하세요:
echo npm run electron

echo.
echo 설치 파일을 만들려면 다음 명령어를 사용하세요:
echo npm run electron:dist

pause 