import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 다국어 번역 파일 import
import ko from '../locales/ko.json';
import en from '../locales/en.json';
import th from '../locales/th.json';
import zh from '../locales/zh.json';

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' }
];

// 번역 리소스
const resources = {
  ko: { translation: ko },
  en: { translation: en },
  zh: { translation: zh },
  th: { translation: th }
};

// i18next 초기화
i18n
  .use(LanguageDetector) // 브라우저 언어 자동 감지
  .use(initReactI18next) // React i18next 바인딩
  .init({
    resources,
    
    // 기본 언어 설정
    fallbackLng: 'ko', // 기본 언어: 한국어
    lng: 'ko', // 초기 언어: 한국어
    
    // 언어 감지 설정
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'], // 선택한 언어를 localStorage에 저장
      lookupLocalStorage: 'mes-language' // localStorage 키
    },

    // 네임스페이스 설정
    ns: ['translation'],
    defaultNS: 'translation',

    // 키 구분자
    keySeparator: '.',
    
    // 보간 설정
    interpolation: {
      escapeValue: false, // React는 기본적으로 XSS 보호가 있음
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          // 통화 형식 (태국 바트)
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'THB'
          }).format(value);
        }
        if (format === 'number') {
          // 숫자 형식
          return new Intl.NumberFormat(lng).format(value);
        }
        if (format === 'date') {
          // 날짜 형식
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        return value;
      }
    },

    // 개발 모드 설정
    debug: process.env.NODE_ENV === 'development',

    // React 특화 설정
    react: {
      useSuspense: false, // Suspense 사용 안함 (로딩 처리를 직접 관리)
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '', // 빈 번역값 처리
      transSupportBasicHtmlNodes: true, // 기본 HTML 태그 지원
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'] // 허용할 HTML 태그
    }
  });

// 언어 변경 함수
export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  // 언어 변경 이벤트 발생
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lng } }));
};

// 현재 언어 가져오기
export const getCurrentLanguage = () => i18n.language;

// 지원하는 언어인지 확인
export const isSupportedLanguage = (lng) => 
  SUPPORTED_LANGUAGES.some(lang => lang.code === lng);

// 언어 정보 가져오기
export const getLanguageInfo = (lng) => 
  SUPPORTED_LANGUAGES.find(lang => lang.code === lng);

// 브라우저 언어를 지원하는 언어로 매핑
export const mapBrowserLanguage = (browserLng) => {
  const langCode = browserLng.split('-')[0]; // ko-KR -> ko
  return isSupportedLanguage(langCode) ? langCode : 'ko';
};

// RTL 언어 확인 (아랍어 등 추가 시 사용)
export const isRTL = (lng) => {
  const rtlLanguages = ['ar', 'he', 'fa'];
  return rtlLanguages.includes(lng);
};

// 숫자 형식 지원
export const formatNumber = (number, language = getCurrentLanguage()) => {
  return new Intl.NumberFormat(language).format(number);
};

// 통화 형식 지원 (태국 바트)
export const formatCurrency = (amount, language = getCurrentLanguage()) => {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
};

// 날짜 형식 지원
export const formatDate = (date, language = getCurrentLanguage(), options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  return new Intl.DateTimeFormat(language, defaultOptions).format(new Date(date));
};

// 시간 형식 지원
export const formatTime = (date, language = getCurrentLanguage()) => {
  return new Intl.DateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date));
};

// 날짜시간 형식 지원
export const formatDateTime = (date, language = getCurrentLanguage()) => {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export default i18n; 