const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile
} = require('../controllers/authController');

const router = express.Router();

// 입력 검증 미들웨어
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// 회원가입 검증 규칙
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be between 1-100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be between 1-100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('th-TH')
    .withMessage('Valid Thai phone number is required'),
  body('department')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department is required'),
  body('position')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Position is required')
];

// 로그인 검증 규칙
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// 이메일 인증 검증 규칙
const verifyEmailValidation = [
  body('token')
    .notEmpty()
    .isLength({ min: 32, max: 64 })
    .withMessage('Valid verification token is required')
];

// 비밀번호 재설정 요청 검증 규칙
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

// 비밀번호 재설정 검증 규칙
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .isLength({ min: 32, max: 64 })
    .withMessage('Valid reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// 라우트 정의
router.post('/register', registerValidation, validateInput, register);
router.post('/login', loginValidation, validateInput, login);
router.post('/verify-email', verifyEmailValidation, validateInput, verifyEmail);
router.post('/forgot-password', forgotPasswordValidation, validateInput, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateInput, resetPassword);
router.get('/profile', authenticateToken, getProfile);

router.get('/check', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role,
        status: req.user.status
      }
    }
  });
});

module.exports = router; 