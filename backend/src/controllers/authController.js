const { query, getClient } = require('../config/database');
const { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateVerificationToken,
  generateResetToken,
  createSuccessResponse,
  createErrorResponse,
  getCurrentThaiTime
} = require('../utils/helpers');
const nodemailer = require('nodemailer');

// 이메일 전송을 위한 transporter 설정
const createEmailTransporter = () => {
  // 개발 환경에서는 Ethereal Email을 사용하거나 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }
  
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// 회원가입
const register = async (req, res, next) => {
  const client = await getClient();
  
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      department,
      position
    } = req.body;

    await client.begin();

    // 이메일 중복 확인
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json(
        createErrorResponse('Email already registered')
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);
    
    // 이메일 인증 토큰 생성
    const verificationToken = generateVerificationToken();

    // 사용자 생성
    const userResult = await client.query(
      `INSERT INTO users (
        email, password, first_name, last_name, phone, 
        department, position, verification_token, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id, email, first_name, last_name, status`,
      [
        email, hashedPassword, firstName, lastName, phone,
        department, position, verificationToken, getCurrentThaiTime()
      ]
    );

    const user = userResult.rows[0];

    await client.commit();

    // 이메일 인증 메일 발송
    try {
      const transporter = createEmailTransporter();
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      const emailContent = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'MES Thailand - Email Verification',
        html: `
          <h2>Welcome to MES Thailand!</h2>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        `
      };

      if (process.env.NODE_ENV === 'development') {
        // 개발 환경에서는 콘솔에 이메일 내용 출력
        console.log('\n📧 EMAIL VERIFICATION SENT (Development Mode)');
        console.log('=====================================');
        console.log(`To: ${email}`);
        console.log(`Subject: ${emailContent.subject}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log(`Verification Token: ${verificationToken}`);
        console.log('=====================================\n');
        
        // 실제로 링크를 클릭할 수 있도록 토스트 메시지에도 포함
        console.log(`✅ 이메일 인증을 위해 다음 URL을 브라우저에서 열어주세요:`);
        console.log(`${verificationUrl}`);
      } else {
        await transporter.sendMail(emailContent);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // 이메일 전송 실패해도 회원가입은 성공으로 처리
    }

    res.status(201).json(
      createSuccessResponse(
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            status: user.status
          }
        },
        'Registration successful. Please check your email for verification.'
      )
    );

  } catch (error) {
    await client.rollback();
    next(error);
  } finally {
    client.done();
  }
};

// 로그인
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 사용자 조회
    const userResult = await query(
      'SELECT id, email, password, first_name, last_name, role, status, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json(
        createErrorResponse('Invalid email or password')
      );
    }

    const user = userResult.rows[0];

    // 비밀번호 확인
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(
        createErrorResponse('Invalid email or password')
      );
    }

    // 계정 상태 확인
    if (user.status === 'rejected') {
      return res.status(403).json(
        createErrorResponse('Your account has been rejected. Please contact administrator.')
      );
    }

    if (user.status === 'pending') {
      return res.status(403).json(
        createErrorResponse('Your account is pending approval. Please wait for administrator approval.')
      );
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login = $1 WHERE id = $2',
      [getCurrentThaiTime(), user.id]
    );

    res.json(
      createSuccessResponse(
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            status: user.status,
            emailVerified: user.email_verified
          }
        },
        'Login successful'
      )
    );

  } catch (error) {
    next(error);
  }
};

// 이메일 인증
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(
        createErrorResponse('Verification token is required')
      );
    }

    // 토큰으로 사용자 조회
    const userResult = await query(
      'SELECT id, email, email_verified FROM users WHERE verification_token = $1',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json(
        createErrorResponse('Invalid or expired verification token')
      );
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json(
        createErrorResponse('Email is already verified')
      );
    }

    // 이메일 인증 상태 업데이트
    await query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1',
      [user.id]
    );

    res.json(
      createSuccessResponse(
        { email: user.email },
        'Email verified successfully'
      )
    );

  } catch (error) {
    next(error);
  }
};

// 비밀번호 재설정 요청
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 사용자 조회
    const userResult = await query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // 보안상 이유로 이메일이 존재하지 않아도 성공 메시지 반환
      return res.json(
        createSuccessResponse(
          null,
          'If the email exists, a password reset link has been sent.'
        )
      );
    }

    const user = userResult.rows[0];

    // 재설정 토큰 생성
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후 만료

    // 재설정 토큰 저장
    await query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // 비밀번호 재설정 이메일 발송
    try {
      const transporter = createEmailTransporter();
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'MES Thailand - Password Reset',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.first_name},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });
    } catch (emailError) {
      console.error('Password reset email sending failed:', emailError);
      return res.status(500).json(
        createErrorResponse('Failed to send password reset email')
      );
    }

    res.json(
      createSuccessResponse(
        null,
        'If the email exists, a password reset link has been sent.'
      )
    );

  } catch (error) {
    next(error);
  }
};

// 비밀번호 재설정
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(
        createErrorResponse('Token and new password are required')
      );
    }

    // 토큰으로 사용자 조회
    const userResult = await query(
      'SELECT id, email FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2',
      [token, getCurrentThaiTime()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json(
        createErrorResponse('Invalid or expired reset token')
      );
    }

    const user = userResult.rows[0];

    // 새 비밀번호 해싱
    const hashedPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트 및 토큰 삭제
    await query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json(
      createSuccessResponse(
        { email: user.email },
        'Password reset successfully'
      )
    );

  } catch (error) {
    next(error);
  }
};

// 현재 사용자 정보 조회
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT 
        id, email, first_name, last_name, phone, department, position, 
        role, status, email_verified, last_login, created_at
      FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json(
        createErrorResponse('User not found')
      );
    }

    const user = userResult.rows[0];

    res.json(
      createSuccessResponse(
        {
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
        },
        'Profile retrieved successfully'
      )
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile
}; 