import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
// Removed lucide-react imports - using emojis instead
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { authHelpers } from '../utils/supabase';
import LanguageSelector from '../components/LanguageSelector';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 폼 입력, 2: 이메일 인증 안내

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const password = watch('password');

  // 부서 옵션들
  const departments = [
    { value: 'production', label: t('auth.department') },
    { value: 'quality', label: '품질관리부' },
    { value: 'maintenance', label: '설비보전부' },
    { value: 'planning', label: '생산계획부' },
    { value: 'engineering', label: '기술부' },
    { value: 'management', label: '경영진' }
  ];

  // 직책 옵션들
  const positions = [
    { value: 'operator', label: '작업자' },
    { value: 'technician', label: '기술자' },
    { value: 'supervisor', label: '팀장' },
    { value: 'manager', label: '부장' },
    { value: 'director', label: '이사' }
  ];

  const handleRegister = async (data) => {
    setIsLoading(true);
    
    try {
      console.log('Register data:', data);
      
      // Supabase 회원가입 및 이메일 인증 요청
      const result = await authHelpers.signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        department: data.department,
        position: data.position
      });
      
      if (result.success) {
        // 성공 시 이메일 인증 안내 단계로 이동
        setStep(2);
        toast.success(t('auth.registerSuccess'));
        console.log('✅ 회원가입 성공! 이메일 인증 메일이 발송되었습니다.');
      } else {
        toast.error(result.error || t('auth.registerError'));
      }
      
    } catch (error) {
      console.error('Register error:', error);
      toast.error(t('auth.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      const formData = watch(); // 현재 폼 데이터 가져오기
      const result = await authHelpers.resendVerification(formData.email);
      
      if (result.success) {
        toast.success(t('auth.passwordResetSent'));
      } else {
        toast.error(result.error || t('auth.passwordResetError'));
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error(t('auth.passwordResetError'));
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // 이메일 인증 안내 화면
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4">
        {/* 언어 선택기 */}
        <div className="absolute top-6 right-6">
          <LanguageSelector />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">📧</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-gray-900">
                {t('auth.awaitingApproval')}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {t('auth.awaitingApprovalDesc')}
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  📧 <strong>{t('auth.emailVerificationNotice')}</strong><br/>
                  1. {t('auth.emailVerificationRequired')}<br/>
                  2. Confirm your signup 링크를 클릭하세요<br/>
                  3. 이메일 인증이 완료됩니다<br/>
                  4. <strong>{t('auth.awaitingApprovalMessage')}</strong><br/>
                  5. 승인 완료 후 로그인 가능합니다
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ <strong>중요 안내:</strong><br/>
                  이메일 인증 후에도 <strong>{t('auth.awaitingApprovalMessage')}</strong>이 필요합니다.<br/>
                  승인이 완료되면 로그인할 수 있습니다.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="space-y-4 mt-8"
            >
              <button
                onClick={handleResendEmail}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                인증 이메일 재발송
              </button>
              
              <button
                onClick={handleGoToLogin}
                className="w-full py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                {t('auth.backToLogin')}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 회원가입 폼 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4">
      {/* 언어 선택기 */}
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* 회원가입 카드 */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          {/* 헤더 */}
          <div className="text-center space-y-4 mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
                <img src={logo} alt="MES Thailand Logo" className="w-12 h-12 object-contain" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">
                {t('auth.register')}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('auth.registerSubtitle')}
              </p>
            </motion.div>
          </div>

          {/* 회원가입 폼 */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onSubmit={handleSubmit(handleRegister)} 
            className="space-y-6"
          >
            {/* 이름 & 성 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.firstName')} *
                </label>
                <input
                  type="text"
                  {...register('firstName', {
                    required: t('auth.firstNameRequired')
                  })}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('auth.firstNamePlaceholder')}
                />
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.lastName')} *
                </label>
                <input
                  type="text"
                  {...register('lastName', {
                    required: t('auth.lastNameRequired')
                  })}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('auth.lastNamePlaceholder')}
                />
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')} *
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
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 비밀번호 & 비밀번호 확인 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')} *
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.confirmPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: t('auth.passwordRequired'),
                      validate: value => value === password || t('auth.passwordMismatch')
                    })}
                    className="block w-full px-3 py-3 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder={t('auth.phonePlaceholder')}
              />
            </div>

            {/* 부서 & 직책 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.department')}
                </label>
                <select
                  {...register('department')}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">{t('auth.departmentPlaceholder')}</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.position')}
                </label>
                <select
                  {...register('position')}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">{t('auth.positionPlaceholder')}</option>
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('auth.registering')}
                </div>
              ) : (
                t('auth.signUp')
              )}
            </button>

            {/* 로그인 링크 */}
            <div className="text-center">
              <p className="text-gray-600">
                {t('auth.alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {t('auth.signIn')}
                </button>
              </p>
            </div>
          </motion.form>
        </div>

        {/* 추가 정보 */}
        <div className="text-center text-white/80 text-sm">
          <p>{t('auth.copyright')}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage; 