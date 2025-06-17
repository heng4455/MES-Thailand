const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 로그 출력
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.id : 'Anonymous'
  });

  // PostgreSQL 오류 처리
  if (err.code === '23505') {
    // Duplicate key error
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23503') {
    // Foreign key constraint error
    const message = 'Referenced resource not found';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23502') {
    // Not null constraint error
    const message = 'Required field missing';
    error = { message, statusCode: 400 };
  }

  if (err.code === '22001') {
    // String data too long
    const message = 'Input data too long';
    error = { message, statusCode: 400 };
  }

  // Validation 오류 처리
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT 오류 처리
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Cast 오류 처리 (잘못된 ObjectId 등)
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = { message, statusCode: 400 };
  }

  // 파일 업로드 오류 처리
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting 오류
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 