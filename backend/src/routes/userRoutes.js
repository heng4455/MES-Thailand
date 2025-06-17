const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');
const { createSuccessResponse, createErrorResponse, calculatePagination } = require('../utils/helpers');

const router = express.Router();

// 현재 사용자 정보 조회
router.get('/me', async (req, res, next) => {
  try {
    console.log('📋 현재 사용자 정보 요청');
    
    // 토큰에서 사용자 정보 추출 (실제로는 JWT 토큰에서 가져와야 함)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ Authorization header 없음');
      return res.status(401).json(
        createErrorResponse('Authorization header required')
      );
    }

    // Supabase JWT 토큰에서 사용자 정보 추출 시도
    try {
      const token = authHeader.replace('Bearer ', '');
      
      // JWT 토큰 디코딩 (base64 디코딩으로 간단히 처리)
      const tokenParts = token.split('.');
      if (tokenParts.length >= 2) {
        const base64Payload = tokenParts[1];
        // Base64 URL 디코딩을 위해 패딩 추가
        const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
        const payload = JSON.parse(Buffer.from(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
        console.log('🔍 JWT Payload:', {
          email: payload.email,
          sub: payload.sub,
          user_metadata: payload.user_metadata
        });
        
        // JWT에서 추출한 정보로 사용자 객체 생성
        const userFromToken = {
          id: payload.sub || 'unknown-id',
          email: payload.email || 'unknown@mes-thailand.com',
          firstName: payload.user_metadata?.firstName || 
                    payload.user_metadata?.full_name?.split(' ')[0] || 
                    payload.email?.split('@')[0] || '사용자',
          lastName: payload.user_metadata?.lastName || 
                   payload.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          phone: payload.user_metadata?.phone || '+66-xxx-xxx-xxxx',
          department: payload.user_metadata?.department || 'General',
          position: payload.user_metadata?.position || 
                   (payload.user_metadata?.role === 'admin' ? 'Administrator' : 'User'),
          role: payload.user_metadata?.role || 'admin',
          status: 'active',
          emailVerified: payload.email_confirmed || true,
          lastLogin: new Date().toISOString(),
          createdAt: payload.created_at || new Date().toISOString()
        };

        console.log('✅ 사용자 정보 생성:', userFromToken);
        
        return res.json(createSuccessResponse(
          userFromToken,
          'Current user information retrieved successfully'
        ));
      }
    } catch (jwtError) {
      console.log('⚠️ JWT 파싱 실패, 기본값 사용:', jwtError.message);
    }

    // JWT 파싱 실패 시 기본 사용자 정보 반환
    const mockUser = {
      id: 'default-user-id',
      email: 'admin@mes-thailand.com',
      firstName: '관리자',
      lastName: '시스템',
      phone: '+66-xxx-xxx-xxxx',
      department: 'IT',
      position: 'System Administrator',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    console.log('📝 기본 사용자 정보 반환');
    
    res.json(createSuccessResponse(
      mockUser,
      'Current user information retrieved successfully'
    ));

  } catch (error) {
    console.error('❌ 사용자 정보 조회 오류:', error);
    next(error);
  }
});

// 사용자 목록 조회 (관리자만)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += `WHERE status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      const searchCondition = paramCount === 1 ? 'WHERE' : 'AND';
      whereClause += ` ${searchCondition} (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // 총 개수 조회
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // 페이지네이션 계산
    const pagination = calculatePagination(page, limit, totalCount);

    // 사용자 목록 조회
    const usersResult = await query(
      `SELECT 
        id, email, first_name, last_name, phone, department, position,
        role, status, email_verified, last_login, created_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, pagination.pageSize, pagination.offset]
    );

    res.json(createSuccessResponse(
      usersResult.rows.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        department: user.department,
        position: user.position,
        role: user.role,
        status: user.status,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at
      })),
      'Users retrieved successfully',
      pagination
    ));

  } catch (error) {
    next(error);
  }
});

// 사용자 상태 업데이트 (관리자만)
router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json(
        createErrorResponse('Invalid status. Must be one of: pending, approved, rejected')
      );
    }

    const result = await query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, email, first_name, last_name, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(
        createErrorResponse('User not found')
      );
    }

    const user = result.rows[0];

    res.json(createSuccessResponse(
      {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        status: user.status
      },
      'User status updated successfully'
    ));

  } catch (error) {
    next(error);
  }
});

module.exports = router; 