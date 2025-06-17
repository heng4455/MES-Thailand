import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../utils/i18n';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const currentLanguage = getCurrentLanguage();
  const currentLangInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 언어 선택 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 border border-white/20"
        aria-label="언어 선택"
      >
        <span className="text-lg">{currentLangInfo.flag}</span>
        <span className="text-sm font-medium text-white">
          {currentLangInfo.name}
        </span>
        <span className={`text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 overflow-hidden z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/20 transition-all duration-200 ${
                currentLanguage === lang.code ? 'bg-white/15' : ''
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium text-white">
                {lang.name}
              </span>
              {currentLanguage === lang.code && (
                <span className="text-blue-400 ml-auto">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 