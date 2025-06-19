import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Monitor, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopDownload = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Electron 환경 감지 - 데스크톱 앱에서는 다운로드 버튼을 숨김
  const isElectron = () => {
    return window.electronAPI || 
           window.MES_CONFIG || 
           navigator.userAgent.toLowerCase().indexOf('electron') > -1 ||
           window.process?.type;
  };

  // 데스크톱 앱에서는 컴포넌트를 렌더링하지 않음
  if (isElectron()) {
    return null;
  }

  // 현재 OS 감지
  const detectOS = () => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Win') !== -1) return 'windows';
    if (userAgent.indexOf('Mac') !== -1) return 'mac';
    if (userAgent.indexOf('Linux') !== -1) return 'linux';
    return 'windows'; // 기본값
  };

  const currentOS = detectOS();

  // 다운로드 링크 - GitHub Releases에서 호스팅
  const downloadLinks = {
    windows: {
      installer: 'https://github.com/heng4455/MES-Thailand/releases/download/Download/MES-Thailand-Installer-1.0.0.exe',
      portable: 'https://github.com/heng4455/MES-Thailand/releases/download/Download/MES-Thailand-Portable-1.0.0.exe'
    },
    mac: 'https://github.com/heng4455/MES-Thailand/releases/download/Download/MES-Thailand-1.0.0.dmg',
    linux: 'https://github.com/heng4455/MES-Thailand/releases/download/Download/MES-Thailand-1.0.0.AppImage'
  };

  const osNames = {
    windows: 'Windows',
    mac: 'macOS',
    linux: 'Linux'
  };

  const handleDownload = (os, type = 'installer') => {
    setIsDownloading(true);
    
    try {
      // GitHub 릴리스에서 직접 다운로드
      let downloadUrl;
      if (os === 'windows') {
        downloadUrl = downloadLinks[os][type];
      } else {
        downloadUrl = downloadLinks[os];
      }
      
      // 새 탭에서 바로 다운로드 링크로 이동
      window.open(downloadUrl, '_blank');
      
      // 성공 메시지
      setTimeout(() => {
        setIsDownloading(false);
        const message = type === 'portable' 
          ? `포터블 버전 다운로드가 시작되었습니다!\n\n✅ SHA256: 0bbe63dfad826aa9ad10f77b6a042171d57aa130e2e654b21a02d207720be4d4\n\n사용법:\n• 다운로드한 파일을 원하는 위치에 저장\n• 바로 실행하여 사용 (설치 불필요)\n• USB에 넣어서 이동 가능`
          : `설치 프로그램 다운로드가 시작되었습니다!\n\n✅ SHA256: 0bbe63dfad826aa9ad10f77b6a042171d57aa130e2e654b21a02d207720be4d4\n\n설치 후 바탕화면에 "MES Thailand" 아이콘이 생성됩니다.\n\n데스크톱 앱의 장점:\n• 더 빠른 실행 속도\n• 오프라인 데이터 캐싱\n• 시스템 알림 지원`;
        
        alert(message);
        setShowModal(false);
      }, 500);
      
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      alert('다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <>
      {/* 다운로드 버튼 */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
        title="데스크톱 앱 다운로드"
      >
        <Download className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
        <span className="hidden md:block text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
          데스크톱 앱
        </span>
      </button>

      {/* 다운로드 모달 */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      MES Thailand 데스크톱 앱
                    </h3>
                    <p className="text-gray-500 text-sm">
                      v1.0.0 • 더 빠르고 안정적인 경험
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 기능 소개 */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">데스크톱 앱의 장점</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">더 빠른 로딩 속도</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">오프라인 데이터 캐싱</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">바탕화면 알림 지원</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">시스템 트레이 통합</span>
                  </div>
                </div>
              </div>

              {/* 다운로드 옵션 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">운영체제 선택</h4>
                
                {/* 현재 OS 추천 */}
                {currentOS === 'windows' ? (
                  // Windows 전용 다운로드 옵션
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-blue-900">
                              Windows 설치 프로그램 (추천)
                            </div>
                            <div className="text-sm text-blue-600">
                              바탕화면 바로가기 생성, 자동 업데이트 지원
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload('windows', 'installer')}
                          disabled={isDownloading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              다운로드 중...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              설치 프로그램 (107MB)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-green-900">
                              Windows 포터블 버전
                            </div>
                            <div className="text-sm text-green-600">
                              설치 불필요, USB에서 실행 가능
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload('windows', 'portable')}
                          disabled={isDownloading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              다운로드 중...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              포터블 버전 (448MB)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // 다른 OS의 기존 방식
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-900">
                            {osNames[currentOS]} (추천)
                          </div>
                          <div className="text-sm text-blue-600">
                            현재 사용 중인 운영체제
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(currentOS)}
                        disabled={isDownloading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            다운로드 중...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            다운로드
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 다른 OS 옵션 */}
                <div className="space-y-2">
                  {Object.entries(osNames)
                    .filter(([os]) => os !== currentOS)
                    .map(([os, name]) => (
                      <div key={os} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{name}</span>
                        </div>
                        <button
                          onClick={() => handleDownload(os)}
                          disabled={isDownloading}
                          className="text-blue-600 hover:text-blue-700 disabled:text-blue-400 text-sm font-medium transition-colors"
                        >
                          다운로드
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* 설치 안내 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">설치 후 사용법</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>1. 다운로드한 파일을 실행하여 설치</div>
                  <div>2. 바탕화면에 생성된 아이콘으로 실행</div>
                  <div>3. 동일한 계정으로 로그인하여 사용</div>
                </div>
              </div>

              {/* 웹앱 vs 데스크톱앱 */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-900">참고사항</span>
                </div>
                <p className="text-sm text-amber-700">
                  웹앱과 데스크톱앱 모두 동일한 기능을 제공합니다. 
                  편한 방식을 선택하여 사용하세요.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DesktopDownload; 