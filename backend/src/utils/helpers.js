const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment-timezone');

// 비밀번호 해싱
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// 비밀번호 확인
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT 토큰 생성
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// 랜덤 토큰 생성
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// 이메일 검증 토큰 생성
const generateVerificationToken = () => {
  return generateRandomToken(32);
};

// 비밀번호 재설정 토큰 생성
const generateResetToken = () => {
  return generateRandomToken(32);
};

// 날짜 포맷팅 (태국 시간대)
const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).tz('Asia/Bangkok').format(format);
};

// 현재 태국 시간 가져오기
const getCurrentThaiTime = () => {
  return moment().tz('Asia/Bangkok').toDate();
};

// 페이지네이션 계산
const calculatePagination = (page = 1, limit = 10, totalCount) => {
  const currentPage = Math.max(1, parseInt(page));
  const pageSize = Math.max(1, Math.min(100, parseInt(limit))); // 최대 100개로 제한
  const offset = (currentPage - 1) * pageSize;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    currentPage,
    pageSize,
    offset,
    totalPages,
    totalCount,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// SQL LIKE 패턴 이스케이프
const escapeLikePattern = (pattern) => {
  return pattern.replace(/[%_\\]/g, '\\$&');
};

// 파일 크기 포맷팅
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 숫자 포맷팅 (태국 바트 통화)
const formatCurrency = (amount, currency = 'THB') => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// 퍼센트 포맷팅
const formatPercentage = (value, decimals = 2) => {
  return (value * 100).toFixed(decimals) + '%';
};

// 오류 응답 생성
const createErrorResponse = (message, statusCode = 500, details = null) => {
  const error = {
    success: false,
    error: message,
    statusCode
  };
  
  if (details) {
    error.details = details;
  }
  
  return error;
};

// 성공 응답 생성
const createSuccessResponse = (data, message = 'Success', pagination = null) => {
  const response = {
    success: true,
    message,
    data
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
};

// 작업 지시서 번호 생성
const generateWorkOrderNumber = (lineCode, date = new Date()) => {
  const dateStr = moment(date).tz('Asia/Bangkok').format('YYYYMMDD');
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `WO-${lineCode}-${dateStr}-${randomSuffix}`;
};

// 품질 검사 번호 생성
const generateQualityCheckNumber = (productCode, date = new Date()) => {
  const dateStr = moment(date).tz('Asia/Bangkok').format('YYYYMMDD');
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `QC-${productCode}-${dateStr}-${randomSuffix}`;
};

// 장비 코드 생성
const generateEquipmentCode = (type, lineCode) => {
  const typeCodes = {
    'machine': 'MC',
    'tool': 'TL',
    'fixture': 'FX',
    'gauge': 'GG',
    'conveyor': 'CV'
  };
  
  const typeCode = typeCodes[type.toLowerCase()] || 'EQ';
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${typeCode}-${lineCode}-${randomSuffix}`;
};

// 배열을 청크로 나누기
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// 객체에서 null/undefined 값 제거
const removeNullValues = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// 딥 클론
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// 배열에서 중복 제거
const removeDuplicates = (array, key = null) => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

// 성능 지표 계산
const calculateEfficiency = (actualQuantity, targetQuantity) => {
  if (targetQuantity === 0) return 0;
  return Math.min(100, (actualQuantity / targetQuantity) * 100);
};

const calculateDefectRate = (defectQuantity, totalQuantity) => {
  if (totalQuantity === 0) return 0;
  return (defectQuantity / totalQuantity) * 100;
};

const calculateOEE = (availability, performance, quality) => {
  return (availability / 100) * (performance / 100) * (quality / 100) * 100;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRandomToken,
  generateVerificationToken,
  generateResetToken,
  formatDateTime,
  getCurrentThaiTime,
  calculatePagination,
  escapeLikePattern,
  formatFileSize,
  formatCurrency,
  formatPercentage,
  createErrorResponse,
  createSuccessResponse,
  generateWorkOrderNumber,
  generateQualityCheckNumber,
  generateEquipmentCode,
  chunkArray,
  removeNullValues,
  deepClone,
  removeDuplicates,
  calculateEfficiency,
  calculateDefectRate,
  calculateOEE
}; 