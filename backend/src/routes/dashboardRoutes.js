const express = require('express');
const { query } = require('../config/database');
const { createSuccessResponse } = require('../utils/helpers');

const router = express.Router();

// 대시보드 통계 조회
router.get('/stats', async (req, res, next) => {
  try {
    // 기본 통계 데이터 (추후 실제 데이터로 대체)
    const stats = {
      totalProduction: 0,
      todayProduction: 0,
      defectRate: 0,
      equipmentStatus: {
        operational: 0,
        maintenance: 0,
        breakdown: 0
      },
      recentOrders: []
    };

    res.json(createSuccessResponse(stats, 'Dashboard stats retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 