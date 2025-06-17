const express = require('express');
const { createSuccessResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(createSuccessResponse([], 'Reports retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 