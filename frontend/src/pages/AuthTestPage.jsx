import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AuthTestPage = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('Test123456!');
  const [loading, setLoading] = useState(false);
  const [urlInfo, setUrlInfo] = useState({});
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    // URL 정보 분석
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const info = {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      queryParams: Object.fromEntries(urlParams),
      hashParams: Object.fromEntries(hashParams)
    };
    
    setUrlInfo(info);
    console.log('🔍 페이지 URL 정보:', info);

    // 현재 Auth 상태 확인
    checkAuthState();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth 상태 변경:', event, session);
      setAuthState({ event, session, user: session?.user });
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      console.log('📋 현재 세션:', session);
      setAuthState({ 
        event: 'CURRENT_SESSION', 
        session, 
        user: session?.user 
      });
    } catch (error) {
      console.error('❌ 세션 확인 실패:', error);
    }
  };

  const handleTestSignUp = async () => {
    if (!testEmail) {
      toast.error('이메일을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      console.log('👤 테스트 회원가입 시작:', testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error) throw error;

      console.log('✅ 회원가입 응답:', data);
      toast.success('회원가입 요청이 완료되었습니다! 이메일을 확인해주세요.');
      
    } catch (error) {
      console.error('❌ 회원가입 실패:', error);
      toast.error(`회원가입 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSignIn = async () => {
    if (!testEmail) {
      toast.error('이메일을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 테스트 로그인 시작:', testEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) throw error;

      console.log('✅ 로그인 응답:', data);
      toast.success('로그인 성공!');
      
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      toast.error(`로그인 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('🚪 로그아웃 완료');
      toast.success('로그아웃 완료');
      
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      toast.error(`로그아웃 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processHashTokens = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    if (accessToken && refreshToken) {
      setLoading(true);
      try {
        console.log('🔄 해시 토큰으로 세션 설정 시도...');
        
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) throw error;

        console.log('✅ 해시 토큰 세션 설정 성공:', data);
        toast.success('해시 토큰으로 인증 완료!');
        
      } catch (error) {
        console.error('❌ 해시 토큰 세션 설정 실패:', error);
        toast.error(`해시 토큰 처리 실패: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('해시에 유효한 토큰이 없습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">🧪 Supabase Auth 테스트</h1>
          <p className="text-white/70">인증 과정을 단계별로 테스트할 수 있습니다.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 테스트 폼 */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">인증 테스트</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">테스트 이메일</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white/80 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestSignUp}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? '처리 중...' : '회원가입 테스트'}
                </button>
                
                <button
                  onClick={handleTestSignIn}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? '처리 중...' : '로그인 테스트'}
                </button>
                
                <button
                  onClick={handleTestSignOut}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? '처리 중...' : '로그아웃'}
                </button>

                <button
                  onClick={processHashTokens}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? '처리 중...' : '해시 토큰 처리'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* 상태 정보 */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-6"
          >
            {/* URL 정보 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📍 URL 정보</h3>
              <div className="text-sm text-white/80 space-y-2">
                <div><strong>경로:</strong> {urlInfo.pathname}</div>
                <div><strong>쿼리:</strong> {urlInfo.search || '없음'}</div>
                <div><strong>해시:</strong> {urlInfo.hash || '없음'}</div>
                
                {Object.keys(urlInfo.queryParams || {}).length > 0 && (
                  <div>
                    <strong>쿼리 파라미터:</strong>
                    <pre className="mt-1 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                      {JSON.stringify(urlInfo.queryParams, null, 2)}
                    </pre>
                  </div>
                )}
                
                {Object.keys(urlInfo.hashParams || {}).length > 0 && (
                  <div>
                    <strong>해시 파라미터:</strong>
                    <pre className="mt-1 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                      {JSON.stringify(urlInfo.hashParams, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Auth 상태 */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🔐 Auth 상태</h3>
              <div className="text-sm text-white/80 space-y-2">
                {authState ? (
                  <>
                    <div><strong>이벤트:</strong> {authState.event}</div>
                    <div><strong>사용자:</strong> {authState.user ? authState.user.email : '없음'}</div>
                    {authState.user && (
                      <>
                        <div><strong>이메일 인증:</strong> {authState.user.email_confirmed_at ? '완료' : '대기중'}</div>
                        <div><strong>가입일:</strong> {new Date(authState.user.created_at).toLocaleString()}</div>
                      </>
                    )}
                  </>
                ) : (
                  <div>상태 확인 중...</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthTestPage; 