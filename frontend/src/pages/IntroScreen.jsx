import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const IntroScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1초 후 로그인 페이지로 바로 이동
    const timeoutId = setTimeout(() => {
      navigate('/login');
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* 로고 */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white">🏭</span>
          </div>
        </div>
        
        {/* 제목 */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            MES Thailand
          </h1>
          <p className="text-white/80 text-lg">
            제조실행시스템
          </p>
        </div>

        {/* 로딩 표시 */}
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white/80">시스템 로딩 중...</span>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen; 