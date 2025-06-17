import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
// Removed lucide-react imports - using emojis instead
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { authHelpers } from '../utils/supabase';

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
    { value: 'production', label: '생산부' },
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
        toast.error(result.error || '회원가입 중 오류가 발생했습니다.');
      }
      
    } catch (error) {
      console.error('Register error:', error);
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      const formData = watch(); // 현재 폼 데이터 가져오기
      const result = await authHelpers.resendVerification(formData.email);
      
      if (result.success) {
        toast.success('인증 이메일을 다시 발송했습니다.');
      } else {
        toast.error(result.error || '이메일 재전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('이메일 재전송 중 오류가 발생했습니다.');
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // 이메일 인증 안내 화면
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 text-center">
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
              <h2 className="text-2xl font-bold text-white">
                이메일 인증이 필요합니다
              </h2>
              <p className="text-white/80 leading-relaxed">
                회원가입이 완료되었습니다!<br/>
                <strong>입력하신 이메일로 인증 링크를 발송했습니다.</strong><br/>
                이메일을 확인하고 인증 링크를 클릭해주세요.
              </p>
              <div className="bg-white/10 rounded-lg p-4 mt-4">
                <p className="text-white/90 text-sm">
                  📧 <strong>이메일 확인 방법:</strong><br/>
                  1. 이메일 받은편지함을 확인하세요<br/>
                  2. "Confirm your signup" 링크를 클릭하세요<br/>
                  3. 자동으로 인증이 완료됩니다<br/>
                  4. 로그인 페이지에서 로그인하세요
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
                className="w-full py-3 px-4 border border-white/20 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200"
              >
                인증 이메일 재발송
              </button>
              
              <button
                onClick={handleGoToLogin}
                className="w-full py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                로그인 페이지로 이동
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 회원가입 폼 화면
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full space-y-8"
      >
        {/* 회원가입 카드 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
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
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-white">
                {t('auth.register')}
              </h2>
              <p className="text-white/70 mt-2">
                MES Thailand 계정을 생성하세요
              </p>
            </motion.div>
          </div>

          {/* 회원가입 폼 */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onSubmit={handleSubmit(handleRegister)}
            className="space-y-6"
          >
            {/* 개인정보 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('auth.firstName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-white/50">👤</span>
                  </div>
                  <input
                    type="text"
                    {...register('firstName', {
                      required: '이름을 입력해주세요',
                      minLength: {
                        value: 2,
                        message: '이름은 최소 2자 이상이어야 합니다'
                      }
                    })}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="홍길동"
                  />
                </div>
                {errors.firstName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center"
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.firstName.message}
                  </motion.p>
                )}
              </div>

              {/* 성 */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('auth.lastName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-white/50">👤</span>
                  </div>
                  <input
                    type="text"
                    {...register('lastName', {
                      required: '성을 입력해주세요',
                      minLength: {
                        value: 1,
                        message: '성은 최소 1자 이상이어야 합니다'
                      }
                    })}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="김"
                  />
                </div>
                {errors.lastName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center"
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.lastName.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">📧</span>
                </div>
                <input
                  type="email"
                  {...register('email', {
                    required: '이메일을 입력해주세요',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '올바른 이메일 형식을 입력해주세요'
                    }
                  })}
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="example@company.com"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <span className="mr-1">⚠️</span>
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                전화번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">📞</span>
                </div>
                <input
                  type="tel"
                  {...register('phone', {
                    required: '전화번호를 입력해주세요',
                    pattern: {
                      value: /^[0-9-+() ]+$/,
                      message: '올바른 전화번호 형식을 입력해주세요'
                    }
                  })}
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="010-1234-5678"
                />
              </div>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <span className="mr-1">⚠️</span>
                  {errors.phone.message}
                </motion.p>
              )}
            </div>

            {/* 직장 정보 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 부서 */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  부서
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-white/50">🏢</span>
                  </div>
                  <select
                    {...register('department', {
                      required: '부서를 선택해주세요'
                    })}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="" className="text-gray-900">부서를 선택하세요</option>
                    {departments.map((dept) => (
                      <option key={dept.value} value={dept.value} className="text-gray-900">
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.department && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center"
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.department.message}
                  </motion.p>
                )}
              </div>

              {/* 직책 */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  직책
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-white/50">💼</span>
                  </div>
                  <select
                    {...register('position', {
                      required: '직책을 선택해주세요'
                    })}
                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="" className="text-gray-900">직책을 선택하세요</option>
                    {positions.map((pos) => (
                      <option key={pos.value} value={pos.value} className="text-gray-900">
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.position && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center"
                  >
                    <span className="mr-1">⚠️</span>
                    {errors.position.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">🔒</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: '비밀번호를 입력해주세요',
                    minLength: {
                      value: 8,
                      message: '비밀번호는 최소 8자 이상이어야 합니다'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다'
                    }
                  })}
                  className="block w-full pl-10 pr-12 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/80 transition-colors"
                >
                  <span>{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <span className="mr-1">⚠️</span>
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">🔒</span>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: '비밀번호 확인을 입력해주세요',
                    validate: value => value === password || '비밀번호가 일치하지 않습니다'
                  })}
                  className="block w-full pl-10 pr-12 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/80 transition-colors"
                >
                  <span>{showConfirmPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400 flex items-center"
                >
                  <span className="mr-1">⚠️</span>
                  {errors.confirmPassword.message}
                </motion.p>
              )}
            </div>

            {/* 이용약관 동의 */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  {...register('agreeTerms', {
                    required: '이용약관에 동의해주세요'
                  })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-white/20 rounded bg-white/10 mt-1"
                />
                <label className="ml-2 text-sm text-white/80">
                  <span className="text-red-400">*</span> 이용약관 및 개인정보 처리방침에 동의합니다.
                </label>
              </div>
              {errors.agreeTerms && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 flex items-center"
                >
                  <span className="mr-1">⚠️</span>
                  {errors.agreeTerms.message}
                </motion.p>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="space-y-4">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    계정 생성 중...
                  </div>
                ) : (
                  t('auth.register')
                )}
              </motion.button>

              {/* 로그인 링크 */}
              <div className="text-center">
                <span className="text-white/70 text-sm">
                  이미 계정이 있으신가요?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-green-300 hover:text-green-200 text-sm font-medium transition-colors"
                >
                  로그인하기
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage; 