import React from 'react';
import { useTranslation } from 'react-i18next';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: {
      container: 'flex items-center space-x-2',
      icon: 'text-lg',
      title: 'text-lg font-bold',
      subtitle: 'text-xs'
    },
    default: {
      container: 'flex items-center space-x-3',
      icon: 'text-xl',
      title: 'text-xl font-bold',
      subtitle: 'text-sm'
    },
    large: {
      container: 'flex items-center space-x-4',
      icon: 'text-3xl',
      title: 'text-3xl font-bold',
      subtitle: 'text-lg'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.default;

  return (
    <div className={`${currentSize.container} ${className}`}>
      {/* 로고 아이콘 - 이모지로 변경 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg blur-sm opacity-50"></div>
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-lg flex items-center justify-center">
          <span className={`${currentSize.icon} text-white`}>
            🏭
          </span>
        </div>
      </div>

      {/* 로고 텍스트 */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${currentSize.title} text-white leading-tight`}>
            {t('app.title')}
          </h1>
          <p className={`${currentSize.subtitle} text-white/80 leading-tight`}>
            {t('app.subtitle')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo; 