; MES Thailand 설치 스크립트
!include "MUI2.nsh"
!include "LogicLib.nsh"

; 설치 프로그램 정보
Name "MES Thailand"
OutFile "MES Thailand Setup.exe"
InstallDir "$PROGRAMFILES\MES Thailand"
InstallDirRegKey HKCU "Software\MES Thailand" "InstallDir"
RequestExecutionLevel admin

; 버전 정보
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "MES Thailand"
VIAddVersionKey "Comments" "Manufacturing Execution System for Thailand"
VIAddVersionKey "CompanyName" "MES Thailand Team"
VIAddVersionKey "LegalCopyright" "Copyright © 2024 MES Thailand Team"
VIAddVersionKey "FileDescription" "MES Thailand Installer"
VIAddVersionKey "FileVersion" "1.0.0.0"
VIAddVersionKey "ProductVersion" "1.0.0.0"

; UI 설정
!define MUI_ABORTWARNING
!define MUI_ICON "build\icon.ico"
!define MUI_UNICON "build\icon.ico"
!define MUI_WELCOMEPAGE_TITLE "MES Thailand 설치 마법사에 오신 것을 환영합니다"
!define MUI_WELCOMEPAGE_TEXT "이 마법사는 컴퓨터에 MES Thailand를 설치합니다.$\r$\n$\r$\n설치를 계속하기 전에 다른 모든 애플리케이션을 닫는 것이 좋습니다."

; 페이지 정의
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\MES Thailand.exe"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; 언어 설정
!insertmacro MUI_LANGUAGE "Korean"
!insertmacro MUI_LANGUAGE "English"

; 설치 섹션
Section "MES Thailand (필수)" SecMain
  SectionIn RO
  
  ; 설치 디렉토리 설정
  SetOutPath "$INSTDIR"
  
  ; 파일 복사
  File /r "${BUILD_DIR}\*.*"
  
  ; 레지스트리 키 작성
  WriteRegStr HKCU "Software\MES Thailand" "InstallDir" "$INSTDIR"
  
  ; 제거 프로그램 정보
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                   "DisplayName" "MES Thailand"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                   "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                   "DisplayIcon" "$INSTDIR\MES Thailand.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                   "Publisher" "MES Thailand Team"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                   "DisplayVersion" "1.0.0"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                     "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" \
                     "NoRepair" 1
  
  ; 제거 프로그램 생성
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
SectionEnd

Section "바탕화면 바로가기" SecDesktop
  CreateShortCut "$DESKTOP\MES Thailand.lnk" "$INSTDIR\MES Thailand.exe" "" "$INSTDIR\MES Thailand.exe" 0
SectionEnd

Section "시작 메뉴 바로가기" SecStartMenu
  CreateDirectory "$SMPROGRAMS\MES Thailand"
  CreateShortCut "$SMPROGRAMS\MES Thailand\MES Thailand.lnk" "$INSTDIR\MES Thailand.exe" "" "$INSTDIR\MES Thailand.exe" 0
  CreateShortCut "$SMPROGRAMS\MES Thailand\제거.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0
SectionEnd

; 섹션 설명
LangString DESC_SecMain ${LANG_KOREAN} "MES Thailand 메인 애플리케이션 (필수)"
LangString DESC_SecDesktop ${LANG_KOREAN} "바탕화면에 바로가기 아이콘 생성"
LangString DESC_SecStartMenu ${LANG_KOREAN} "시작 메뉴에 프로그램 그룹 생성"

LangString DESC_SecMain ${LANG_ENGLISH} "MES Thailand main application (required)"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Create a desktop shortcut icon"
LangString DESC_SecStartMenu ${LANG_ENGLISH} "Create a start menu program group"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} $(DESC_SecStartMenu)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; 제거 섹션
Section "Uninstall"
  
  ; 파일 및 디렉토리 제거
  RMDir /r "$INSTDIR"
  
  ; 바로가기 제거
  Delete "$DESKTOP\MES Thailand.lnk"
  RMDir /r "$SMPROGRAMS\MES Thailand"
  
  ; 레지스트리 키 제거
  DeleteRegKey HKCU "Software\MES Thailand"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand"
  
SectionEnd

; 설치 전 함수
Function .onInit
  ; 관리자 권한 확인
  UserInfo::GetAccountType
  pop $0
  ${If} $0 != "admin"
    MessageBox MB_ICONSTOP "이 프로그램을 설치하려면 관리자 권한이 필요합니다."
    SetErrorLevel 740 ; 권한 부족 오류 코드
    Quit
  ${EndIf}
  
  ; 이전 설치 확인
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\MES Thailand" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "MES Thailand가 이미 설치되어 있습니다.$\n$\n기존 버전을 제거하고 계속하시겠습니까?" \
  IDOK uninst
  Abort
  
  uninst:
    ClearErrors
    ExecWait '$R0 _?=$INSTDIR'
    
    IfErrors no_remove_uninstaller done
    IfFileExists "$INSTDIR\MES Thailand.exe" no_remove_uninstaller done
    Delete $R0
    RMDir $INSTDIR
    
  no_remove_uninstaller:
  done:
FunctionEnd 