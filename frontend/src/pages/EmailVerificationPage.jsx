import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { supabase, onAuthStateChange } from '../utils/supabase';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, failed
  const [isLoading, setIsLoading] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    let timeoutId;
    
    // Supabase Auth 상태 변경 리스너 설정 (가장 중요)
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event);
      console.log('👤 Session:', session);
      
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          console.log('✅ 사용자 인증됨:', session.user.email);
          console.log('📧 이메일 확인 상태:', session.user.email_confirmed_at);
          
          setVerificationStatus('success');
          setIsLoading(false);
          toast.success('이메일 인증이 완료되었습니다!');
          
          // 3초 후 로그인 페이지로 이동
          timeoutId = setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else if (event === 'INITIAL_SESSION') {
        // 초기 세션 확인
        if (session?.user?.email_confirmed_at) {
          console.log('✅ 이미 인증된 사용자');
          setVerificationStatus('success');
          setIsLoading(false);
          toast.success('이미 인증된 계정입니다!');
          
          timeoutId = setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // URL 파라미터 처리
          await processAuthFromUrl();
        }
      }
    });

    // URL 파라미터에서 인증 정보 처리
    const processAuthFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // 쿼리 파라미터에서 확인
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      // 해시 파라미터에서 확인
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const hashError = hashParams.get('error');

      console.log('🔍 URL 파라미터 분석:', {
        queryCode: code,
        queryError: error,
        hashType: type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hashError,
        fullUrl: window.location.href
      });

      // 에러가 있는 경우
      if (error || hashError) {
        console.log('❌ 인증 에러:', error || hashError, errorDescription);
        setVerificationStatus('failed');
        setIsLoading(false);
        toast.error(errorDescription || '이메일 인증에 실패했습니다.');
        return;
      }

      // 해시에서 토큰 발견 (Supabase 기본 방식)
      if (type === 'signup' && accessToken && refreshToken) {
        console.log('✅ 해시 토큰 방식 인증 성공');
        
        try {
          // 토큰을 사용해서 세션 설정
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          console.log('✅ 세션 설정 성공:', data);
          setVerificationStatus('success');
          setIsLoading(false);
          toast.success('이메일 인증이 완료되었습니다!');
          
          timeoutId = setTimeout(() => {
            navigate('/login');
          }, 3000);
          
        } catch (error) {
          console.error('❌ 세션 설정 실패:', error);
          setVerificationStatus('failed');
          setIsLoading(false);
          toast.error('이메일 인증 처리 중 오류가 발생했습니다.');
        }
        return;
      }

      // code 파라미터가 있는 경우 (PKCE 방식)
      if (code) {
        console.log('🔐 PKCE 코드 발견, 하지만 code_verifier 없음');
        console.log('⚠️ 이메일 링크를 다시 클릭하거나 새 탭에서 열어보세요');
        
        setVerificationStatus('failed');
        setIsLoading(false);
        toast.error('인증 링크가 올바르지 않습니다. 이메일에서 링크를 다시 클릭해주세요.');
        return;
      }

      // 기본 대기 상태
      console.log('⏳ 인증 대기 중...');
      setVerificationStatus('verifying');
      setIsLoading(false);
    };

    // 컴포넌트 언마운트 시 구독 해제 및 타이머 정리
    return () => {
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  // 더 이상 필요 없음 - Supabase가 자동으로 처리
  const verifyEmail = () => {
    // Supabase는 이메일 링크 클릭 시 자동으로 인증 처리
  };

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  const renderVerifyingState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">이메일 인증 중...</h2>
      <p className="text-white/80">잠시만 기다려주세요. 이메일을 인증하고 있습니다.</p>
    </motion.div>
  );

  const renderSuccessState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <span className="text-4xl text-white">✓</span>
      </motion.div>
      <h2 className="text-2xl font-bold text-white mb-4">이메일 인증 완료!</h2>
      <p className="text-white/80 mb-6">
        이메일 인증이 성공적으로 완료되었습니다.<br/>
        이제 관리자 승인을 기다려주세요.
      </p>
      <p className="text-sm text-white/60 mb-6">
        3초 후 자동으로 로그인 페이지로 이동합니다...
      </p>
      <button
        onClick={handleReturnToLogin}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        로그인 페이지로 이동
      </button>
    </motion.div>
  );

  const renderFailedState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <span className="text-4xl text-white">✕</span>
      </motion.div>
      <h2 className="text-2xl font-bold text-white mb-4">이메일 인증 실패</h2>
      <p className="text-white/80 mb-6">
        이메일 인증에 실패했습니다.<br/>
        인증 링크가 만료되었거나 유효하지 않습니다.
      </p>
      <div className="space-y-3">
        <button
          onClick={handleReturnToLogin}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          로그인 페이지로 이동
        </button>
        <button
          onClick={() => navigate('/register')}
          className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          다시 회원가입
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
                <img src={logo} alt="MES Thailand Logo" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MES Thailand</h1>
            <p className="text-gray-600">이메일 인증</p>
          </div>

          {/* 인증 상태에 따른 컨텐츠 */}
          {verificationStatus === 'verifying' && renderVerifyingState()}
          {verificationStatus === 'success' && renderSuccessState()}
          {verificationStatus === 'failed' && renderFailedState()}
        </div>

        <div className="mt-6 text-center text-white/80 text-sm">
          <p>© 2024 MES Thailand. 모든 권리 보유.</p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage; 