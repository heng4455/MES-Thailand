# MES Thailand 클린 빌드 스크립트
Write-Host "=== MES Thailand 데스크톱 앱 클린 빌드 ===" -ForegroundColor Green

# 1단계: 모든 관련 프로세스 종료
Write-Host "1. 관련 프로세스 종료 중..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*electron*" -or $_.ProcessName -like "*node*" -or $_.ProcessName -like "*npm*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2단계: 기존 빌드 파일 강제 삭제
Write-Host "2. 기존 빌드 파일 삭제 중..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Write-Host "   - dist 폴더 삭제 시도..." -ForegroundColor Gray
    try {
        # 강제 삭제를 위한 속성 변경
        Get-ChildItem "dist" -Recurse -Force | ForEach-Object {
            $_.Attributes = 'Normal'
        }
        Remove-Item "dist" -Recurse -Force -ErrorAction Stop
        Write-Host "   ✅ dist 폴더 삭제 완료" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️ dist 폴더 삭제 실패, 개별 파일 삭제 시도..." -ForegroundColor Yellow
        Get-ChildItem "dist" -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    }
}

if (Test-Path "build") {
    Write-Host "   - build 폴더 삭제..." -ForegroundColor Gray
    Remove-Item "build" -Recurse -Force -ErrorAction SilentlyContinue
}

# 3단계: 노드 모듈 캐시 정리
Write-Host "3. 캐시 정리 중..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# 4단계: React 앱 빌드
Write-Host "4. React 앱 빌드 중..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React 빌드 실패!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ React 빌드 완료" -ForegroundColor Green

# 5단계: 패키지 정보 확인
Write-Host "5. 빌드 환경 확인..." -ForegroundColor Blue
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "   - 앱 이름: $($packageJson.name)" -ForegroundColor Gray
Write-Host "   - 버전: $($packageJson.version)" -ForegroundColor Gray

# 6단계: Electron 빌드
Write-Host "6. Electron 데스크톱 앱 빌드 중..." -ForegroundColor Blue
Write-Host "   이 과정은 몇 분이 걸릴 수 있습니다..." -ForegroundColor Gray

# 환경 변수 설정
$env:NODE_ENV = "production"
$env:CI = "false"

# 직접 electron-builder 실행
npx electron-builder --win --x64 --publish=never --config.compression=normal

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 빌드 성공!" -ForegroundColor Green
    
    # 빌드 결과 확인
    if (Test-Path "dist") {
        Write-Host "`n=== 빌드 결과 ===" -ForegroundColor Cyan
        $exeFiles = Get-ChildItem "dist\*.exe" -ErrorAction SilentlyContinue
        $msiFiles = Get-ChildItem "dist\*.msi" -ErrorAction SilentlyContinue
        
        if ($exeFiles) {
            $exeFiles | ForEach-Object {
                $sizeInMB = [math]::Round($_.Length / 1MB, 1)
                Write-Host "📦 설치 파일: $($_.Name) ($sizeInMB MB)" -ForegroundColor White
                Write-Host "   경로: $($_.FullName)" -ForegroundColor Gray
            }
        }
        
        if ($msiFiles) {
            $msiFiles | ForEach-Object {
                $sizeInMB = [math]::Round($_.Length / 1MB, 1)
                Write-Host "📦 MSI 파일: $($_.Name) ($sizeInMB MB)" -ForegroundColor White
                Write-Host "   경로: $($_.FullName)" -ForegroundColor Gray
            }
        }
        
        # 언패킹된 폴더 확인
        if (Test-Path "dist\win-unpacked") {
            Write-Host "📁 실행 가능한 폴더: dist\win-unpacked\" -ForegroundColor White
            $exeInUnpacked = Get-ChildItem "dist\win-unpacked\*.exe" -ErrorAction SilentlyContinue
            if ($exeInUnpacked) {
                Write-Host "   실행 파일: $($exeInUnpacked.Name)" -ForegroundColor Gray
            }
        }
        
        Write-Host "`n🎉 데스크톱 앱 빌드가 완료되었습니다!" -ForegroundColor Green
        Write-Host "📁 빌드 파일 위치: $(Get-Location)\dist\" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Electron 빌드 실패!" -ForegroundColor Red
    Write-Host "오류 코드: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "`n빌드 프로세스 완료!" -ForegroundColor Green 