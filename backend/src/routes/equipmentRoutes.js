const express = require('express');
const { createSuccessResponse, createErrorResponse } = require('../utils/helpers');
const { supabase } = require('../config/database');

const router = express.Router();

// 모든 설비 조회
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('설비 조회 오류:', error);
      return res.status(500).json(createErrorResponse('설비 데이터를 가져오는 중 오류가 발생했습니다', error.message));
    }

    res.json(createSuccessResponse(data || [], '설비 목록을 성공적으로 가져왔습니다'));
  } catch (error) {
    console.error('설비 조회 예외:', error);
    next(error);
  }
});

// 특정 설비 조회
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('설비 상세 조회 오류:', error);
      return res.status(404).json(createErrorResponse('설비를 찾을 수 없습니다', error.message));
    }

    res.json(createSuccessResponse(data, '설비 정보를 성공적으로 가져왔습니다'));
  } catch (error) {
    console.error('설비 상세 조회 예외:', error);
    next(error);
  }
});

// 새 설비 생성
router.post('/', async (req, res, next) => {
  try {
    const equipmentData = req.body;
    
    // 필수 필드 검증
    if (!equipmentData.equipment_code || !equipmentData.name) {
      return res.status(400).json(createErrorResponse('설비 코드와 설비명은 필수 입력 항목입니다'));
    }

    // 설비 코드 중복 검사
    const { data: existingEquipment } = await supabase
      .from('equipment')
      .select('id')
      .eq('equipment_code', equipmentData.equipment_code)
      .single();

    if (existingEquipment) {
      return res.status(400).json(createErrorResponse('이미 존재하는 설비 코드입니다'));
    }

    const { data, error } = await supabase
      .from('equipment')
      .insert([equipmentData])
      .select()
      .single();

    if (error) {
      console.error('설비 생성 오류:', error);
      return res.status(500).json(createErrorResponse('설비 생성 중 오류가 발생했습니다', error.message));
    }

    res.status(201).json(createSuccessResponse(data, '설비가 성공적으로 생성되었습니다'));
  } catch (error) {
    console.error('설비 생성 예외:', error);
    next(error);
  }
});

// 설비 수정
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipmentData = req.body;

    // 필수 필드 검증
    if (!equipmentData.equipment_code || !equipmentData.name) {
      return res.status(400).json(createErrorResponse('설비 코드와 설비명은 필수 입력 항목입니다'));
    }

    // 다른 설비에서 같은 코드 사용 여부 검사
    const { data: existingEquipment } = await supabase
      .from('equipment')
      .select('id')
      .eq('equipment_code', equipmentData.equipment_code)
      .neq('id', id)
      .single();

    if (existingEquipment) {
      return res.status(400).json(createErrorResponse('이미 존재하는 설비 코드입니다'));
    }

    const { data, error } = await supabase
      .from('equipment')
      .update(equipmentData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('설비 수정 오류:', error);
      return res.status(500).json(createErrorResponse('설비 수정 중 오류가 발생했습니다', error.message));
    }

    if (!data) {
      return res.status(404).json(createErrorResponse('설비를 찾을 수 없습니다'));
    }

    res.json(createSuccessResponse(data, '설비가 성공적으로 수정되었습니다'));
  } catch (error) {
    console.error('설비 수정 예외:', error);
    next(error);
  }
});

// 설비 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 설비가 존재하는지 확인
    const { data: existingEquipment } = await supabase
      .from('equipment')
      .select('id, name')
      .eq('id', id)
      .single();

    if (!existingEquipment) {
      return res.status(404).json(createErrorResponse('설비를 찾을 수 없습니다'));
    }

    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('설비 삭제 오류:', error);
      return res.status(500).json(createErrorResponse('설비 삭제 중 오류가 발생했습니다', error.message));
    }

    res.json(createSuccessResponse(null, '설비가 성공적으로 삭제되었습니다'));
  } catch (error) {
    console.error('설비 삭제 예외:', error);
    next(error);
  }
});

// 설비 상태 업데이트
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['operational', 'maintenance', 'breakdown', 'retired'].includes(status)) {
      return res.status(400).json(createErrorResponse('유효하지 않은 상태값입니다'));
    }

    const { data, error } = await supabase
      .from('equipment')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('설비 상태 업데이트 오류:', error);
      return res.status(500).json(createErrorResponse('설비 상태 업데이트 중 오류가 발생했습니다', error.message));
    }

    if (!data) {
      return res.status(404).json(createErrorResponse('설비를 찾을 수 없습니다'));
    }

    res.json(createSuccessResponse(data, '설비 상태가 성공적으로 업데이트되었습니다'));
  } catch (error) {
    console.error('설비 상태 업데이트 예외:', error);
    next(error);
  }
});

module.exports = router; 