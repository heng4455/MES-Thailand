const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT 토큰 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 확인
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 사용자 상태 확인
    if (user.status !== 'approved') {
      return res.status(403).json({
        error: 'Account not approved',
        message: 'Your account is pending approval or has been rejected'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid access token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Access token has expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
};

// 권한 확인 미들웨어
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// 관리자 권한 확인
const requireAdmin = requireRole(['admin']);

// 매니저 이상 권한 확인
const requireManager = requireRole(['manager', 'admin']);

// 선택적 인증 미들웨어 (토큰이 있으면 사용자 정보 설정, 없어도 통과)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].status === 'approved') {
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    // 선택적 인증이므로 오류가 있어도 계속 진행
    next();
  }
};

// 사용자 본인 또는 관리자만 접근 가능
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate first'
    });
  }

  const userId = parseInt(req.params.userId || req.params.id);
  const currentUserId = req.user.id;
  const userRole = req.user.role;

  if (userId === currentUserId || userRole === 'admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied',
    message: 'You can only access your own data or you need admin privileges'
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  optionalAuth,
  requireOwnerOrAdmin
}; 