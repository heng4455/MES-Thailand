import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { authHelpers } from '../utils/supabase';
import { useUser } from '../contexts/UserContext';
import LanguageSelector from '../components/LanguageSelector';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, userProfile, loading, signOut } = useUser();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const handleLogin = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('Login data:', data);
      
      // Supabase 로그인
      const result = await authHelpers.signIn(data.email, data.password);
      
      if (result.success) {
        const { user, session } = result.data;
        
        toast.success(t('auth.loginSuccess'));
        localStorage.setItem('supabase_session', JSON.stringify(session));
        
        // 짧은 지연 후 리다이렉트 (사용자 경험 개선)
        setTimeout(() => {
          console.log('Attempting to navigate to dashboard...');
          try {
            navigate('/dashboard', { replace: true });
            console.log('Navigate called successfully');
          } catch (error) {
            console.error('Navigation error:', error);
            // 대안: 강제 새로고침으로 대시보드 이동
            window.location.href = '/dashboard';
          }
          setIsLoading(false);
        }, 500);
        
      } else {
        // 특정 오류 타입에 따른 메시지 처리
        switch (result.error) {
          case 'EMAIL_NOT_CONFIRMED':
            toast.error(t('auth.emailVerificationRequired'));
            break;
          case 'APPROVAL_PENDING':
            toast.error(t('auth.approvalPending'), {
              duration: 6000
            });
            break;
          case 'APPROVAL_REJECTED':
            toast.error(t('auth.approvalRejected'), {
              duration: 6000
            });
            break;
          case 'APPROVAL_REQUIRED':
            toast.error(t('auth.approvalRequired'), {
              duration: 6000
            });
            break;
          default:
            if (result.error.includes('Invalid login credentials')) {
              toast.error(t('auth.invalidCredentials'));
            } else if (result.message) {
              toast.error(result.message);
            } else {
              toast.error(result.error || t('auth.loginError'));
            }
        }
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('auth.loginError'));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = watch('email');
    
    if (!email) {
      toast.error(t('auth.enterEmailFirst'));
      return;
    }
    
    try {
      const result = await authHelpers.resetPassword(email);
      
      if (result.success) {
        toast.success(t('auth.passwordResetSent'));
      } else {
        toast.error(result.error || t('auth.passwordResetError'));
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(t('auth.passwordResetError'));
    }
  };

  // 이미 로그인된 상태에서 대시보드로 이동하는 효과 추가
  useEffect(() => {
    if (!loading && user) {
      // 이미 로그인된 상태라면 1초 후 자동으로 대시보드로 이동
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t('auth.logout'));
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('auth.loginError'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4">
      {/* 언어 선택기 */}
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>

      <div className="max-w-md w-full">
        {/* 현재 로그인된 사용자 정보 표시 */}
        {!loading && user && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 backdrop-blur-lg rounded-2xl shadow-xl border border-green-200 p-6"
          >
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-lg font-bold">
                  {userProfile ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}` : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  {t('auth.alreadyLoggedIn')}
                </h3>
                <p className="text-green-600 mt-1">
                  <strong>{t('auth.user')}:</strong> {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 
                  user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || user.email}
                </p>
                {userProfile?.role && (
                  <p className="text-green-600 text-sm">
                    <strong>{t('auth.role')}:</strong> {userProfile.role}
                  </p>
                )}
                {userProfile?.department && (
                  <p className="text-green-600 text-sm">
                    <strong>{t('auth.department')}:</strong> {userProfile.department}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  {t('auth.goToDashboard')}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  {t('auth.logout')}
                </button>
              </div>
              
              <p className="text-green-600 text-xs">
                {t('auth.autoRedirect')}
              </p>
            </div>
          </motion.div>
        )}

        {/* 로그인 카드 */}
        <div className={`bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 ${!loading && user ? 'opacity-60' : ''}`}>
          {/* 헤더 */}
          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
                <img src={logo} alt="MES Thailand Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t('auth.login')}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('auth.loginSubtitle')}
              </p>
            </div>
          </div>





          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            {/* 이메일 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                {...register('email', {
                  required: t('auth.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.emailInvalid')
                  }
                })}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder={t('auth.emailPlaceholder')}
                disabled={!loading && user}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: {
                      value: 6,
                      message: t('auth.passwordMinLength')
                    }
                  })}
                  className="block w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('auth.passwordPlaceholder')}
                  disabled={!loading && user}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={!loading && user}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* 기억하기 & 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={!loading && user}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('auth.rememberMe')}
                </span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                disabled={!loading && user}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading || (!loading && user)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('auth.loggingIn')}
                </div>
              ) : (!loading && user) ? (
                t('auth.alreadyLoggedIn')
              ) : (
                t('auth.signIn')
              )}
            </button>

            {/* 수동 대시보드 이동 버튼 (로그인 성공 후) */}
            {!loading && user && (
              <button
                type="button"
                onClick={() => {
                  console.log('Manual navigation to dashboard');
                  window.location.href = '/dashboard';
                }}
                className="w-full mt-3 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                🚀 {t('auth.goToDashboard')}
              </button>
            )}
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-6 text-center text-white/80 text-sm">
          <p>{t('auth.copyright')}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 