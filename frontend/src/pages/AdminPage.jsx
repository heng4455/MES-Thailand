import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { motion } from 'framer-motion';
import { FiUsers, FiMail, FiClock, FiCheck, FiX } from 'react-icons/fi';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Supabase에서 사용자 목록 가져오기 (관리자 권한 필요)
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        throw error;
      }
      
      setUsers(users || []);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
      setError('사용자 목록을 불러올 수 없습니다. 관리자 권한이 필요합니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <FiX className="text-6xl text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">접근 오류</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-300">
            브라우저 콘솔에서 <code>window.supabaseTest.testConnection()</code>을 실행해보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <FiUsers className="text-3xl text-blue-400" />
            <h1 className="text-3xl font-bold text-white">사용자 관리</h1>
          </div>
          <p className="text-white/70">등록된 사용자 목록과 인증 상태를 확인할 수 있습니다.</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
        >
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                총 {users.length}명의 사용자
              </h2>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="p-12 text-center text-white/70">
              <FiUsers className="text-6xl mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">등록된 사용자가 없습니다.</p>
              <p className="text-sm">
                <a href="/register" className="text-blue-400 hover:underline">
                  회원가입 페이지
                </a>에서 첫 번째 사용자를 등록해보세요.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white font-medium">이메일</th>
                    <th className="text-left p-4 text-white font-medium">인증 상태</th>
                    <th className="text-left p-4 text-white font-medium">가입일</th>
                    <th className="text-left p-4 text-white font-medium">최근 접속</th>
                    <th className="text-left p-4 text-white font-medium">역할</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FiMail className="text-gray-400" />
                          <span className="text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {user.email_confirmed_at ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <FiCheck />
                            <span>인증 완료</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <FiClock />
                            <span>인증 대기</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-white/70">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="p-4 text-white/70">
                        {formatDate(user.last_sign_in_at)}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-sm">
                          사용자
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">빠른 테스트</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => window.open('/register', '_blank')}
              className="p-3 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors text-left"
            >
              <div className="font-medium">새 사용자 등록</div>
              <div className="text-sm opacity-75">회원가입 페이지 열기</div>
            </button>
            <button
              onClick={() => {
                console.log('사용자 목록:', users);
                alert(`총 ${users.length}명의 사용자가 등록되어 있습니다.`);
              }}
              className="p-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-left"
            >
              <div className="font-medium">콘솔에 사용자 목록 출력</div>
              <div className="text-sm opacity-75">개발자 도구에서 확인</div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage; 