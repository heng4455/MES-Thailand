const express = require('express');
const { query } = require('../config/database');
const { createSuccessResponse, createErrorResponse } = require('../utils/helpers');

const router = express.Router();

// 작업 지시서 목록 조회
router.get('/work-orders', async (req, res, next) => {
  try {
    res.json(createSuccessResponse([], 'Work orders retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

// 생산 라인 목록 조회
router.get('/lines', async (req, res, next) => {
  try {
    res.json(createSuccessResponse([], 'Production lines retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 