# MES Thailand 데스크톱 앱 빌드 스크립트
Write-Host "MES Thailand 데스크톱 앱 빌드를 시작합니다..." -ForegroundColor Green

# 기존 dist 폴더 완전 삭제
if (Test-Path "dist") {
    Write-Host "기존 빌드 폴더를 삭제합니다..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Remove-Item "dist" -Recurse -Force -ErrorAction Stop
}

# React 앱 빌드
Write-Host "React 앱을 빌드합니다..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "React 빌드 실패!" -ForegroundColor Red
    exit 1
}

# Electron 앱 빌드 (간단한 설정)
Write-Host "Electron 데스크톱 앱을 빌드합니다..." -ForegroundColor Blue
npx electron-builder --win --x64 --publish=never

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 빌드 성공!" -ForegroundColor Green
    Write-Host "설치 파일 위치: $(Get-Location)\dist\" -ForegroundColor Cyan
    
    # 빌드된 파일 목록 표시
    if (Test-Path "dist") {
        Write-Host "`n생성된 파일들:" -ForegroundColor Yellow
        Get-ChildItem "dist\*.exe" | ForEach-Object {
            Write-Host "  📦 $($_.Name) ($('{0:N1}' -f ($_.Length / 1MB)) MB)" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ 빌드 실패!" -ForegroundColor Red
    exit 1
}

Write-Host "`n빌드 완료!" -ForegroundColor Green 