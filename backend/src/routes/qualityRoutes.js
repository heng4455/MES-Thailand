const express = require('express');
const { createSuccessResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/checks', async (req, res, next) => {
  try {
    res.json(createSuccessResponse([], 'Quality checks retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 