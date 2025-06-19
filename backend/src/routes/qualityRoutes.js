const express = require('express');
const { createSuccessResponse } = require('../utils/helpers');
const pool = require('../config/database');

const router = express.Router();

router.get('/checks', async (req, res, next) => {
  try {
    res.json(createSuccessResponse([], 'Quality checks retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

// 품질 유형 목록 조회
router.get('/types', async (req, res, next) => {
  try {
    const query = `
      SELECT id, name, name_en, description, category, severity, is_active, 
             created_at, created_by
      FROM quality_types 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    res.json(createSuccessResponse(result.rows, 'Quality types retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

// 활성 품질 유형 목록 조회 (검사용)
router.get('/types/active', async (req, res, next) => {
  try {
    const query = `
      SELECT id, name, name_en, description, category, severity
      FROM quality_types 
      WHERE is_active = true
      ORDER BY name
    `;
    const result = await pool.query(query);
    res.json(createSuccessResponse(result.rows, 'Active quality types retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

// 품질 유형 생성
router.post('/types', async (req, res, next) => {
  try {
    const {
      name, nameEn, description, category, severity, isActive
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const query = `
      INSERT INTO quality_types (
        name, name_en, description, category, severity, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      name, nameEn || null, description || null,
      category || 'defect', severity || 'medium', isActive !== false,
      req.user?.email || 'system'
    ];

    const result = await pool.query(query, values);
    res.status(201).json(createSuccessResponse(result.rows[0], 'Quality type created successfully'));
  } catch (error) {
    next(error);
  }
});

// 품질 유형 수정
router.put('/types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, nameEn, description, category, severity, isActive
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const query = `
      UPDATE quality_types SET
        name = $1, name_en = $2, description = $3,
        category = $4, severity = $5, is_active = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const values = [
      name, nameEn || null, description || null,
      category || 'defect', severity || 'medium', isActive !== false,
      id
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quality type not found' });
    }

    res.json(createSuccessResponse(result.rows[0], 'Quality type updated successfully'));
  } catch (error) {
    next(error);
  }
});

// 품질 유형 삭제
router.delete('/types/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM quality_types WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quality type not found' });
    }

    res.json(createSuccessResponse(null, 'Quality type deleted successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 