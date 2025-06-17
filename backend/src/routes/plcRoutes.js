const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

console.log('🔧 PLC Routes loaded successfully');

// PLC 연결 상태 조회
router.get('/connections', async (req, res) => {
  console.log('📡 PLC connections API called');
  try {
    // 실제 구현에서는 데이터베이스에서 PLC 연결 정보를 조회
    const mockConnections = [
      {
        id: 1,
        name: 'Production Line 1',
        ipAddress: '192.168.1.100',
        port: 502,
        protocol: 'Modbus TCP',
        status: 'connected',
        lastUpdate: new Date().toISOString(),
        dataPoints: 45,
        errorCount: 0
      },
      {
        id: 2,
        name: 'Production Line 2',
        ipAddress: '192.168.1.101',
        port: 502,
        protocol: 'Modbus TCP',
        status: 'connected',
        lastUpdate: new Date(Date.now() - 5000).toISOString(),
        dataPoints: 38,
        errorCount: 2
      },
      {
        id: 3,
        name: 'Quality Control Station',
        ipAddress: '192.168.1.102',
        port: 502,
        protocol: 'Modbus TCP',
        status: 'disconnected',
        lastUpdate: new Date(Date.now() - 3600000).toISOString(),
        dataPoints: 0,
        errorCount: 15
      },
      {
        id: 4,
        name: 'Packaging Line',
        ipAddress: '192.168.1.103',
        port: 502,
        protocol: 'Modbus TCP',
        status: 'warning',
        lastUpdate: new Date(Date.now() - 10000).toISOString(),
        dataPoints: 22,
        errorCount: 5
      }
    ];

    res.json({
      success: true,
      data: mockConnections
    });
  } catch (error) {
    console.error('Error fetching PLC connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PLC connections'
    });
  }
});

// PLC 데이터 포인트 조회
router.get('/datapoints', async (req, res) => {
  console.log('📊 PLC datapoints API called');
  try {
    const { plcId } = req.query;
    
    // 실제 구현에서는 PLC에서 실시간 데이터를 수집
    const mockDataPoints = [
      {
        id: 1,
        plcId: 1,
        name: 'Motor Speed',
        address: '40001',
        value: Math.floor(Math.random() * 200) + 1400,
        unit: 'RPM',
        type: 'analog',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 2,
        plcId: 1,
        name: 'Temperature',
        address: '40002',
        value: parseFloat((Math.random() * 20 + 55).toFixed(1)),
        unit: '°C',
        type: 'analog',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 3,
        plcId: 1,
        name: 'Emergency Stop',
        address: '10001',
        value: Math.random() > 0.9 ? 1 : 0,
        unit: '',
        type: 'digital',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 4,
        plcId: 2,
        name: 'Conveyor Speed',
        address: '40001',
        value: parseFloat((Math.random() * 2 + 2).toFixed(1)),
        unit: 'm/s',
        type: 'analog',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 5,
        plcId: 2,
        name: 'Product Counter',
        address: '40003',
        value: Math.floor(Math.random() * 1000) + 500,
        unit: 'EA',
        type: 'analog',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 6,
        plcId: 4,
        name: 'Pressure',
        address: '40004',
        value: parseFloat((Math.random() * 3 + 2).toFixed(2)),
        unit: 'Bar',
        type: 'analog',
        lastUpdate: new Date().toISOString()
      }
    ];

    const filteredData = plcId 
      ? mockDataPoints.filter(dp => dp.plcId === parseInt(plcId))
      : mockDataPoints;

    res.json({
      success: true,
      data: filteredData
    });
  } catch (error) {
    console.error('Error fetching PLC data points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PLC data points'
    });
  }
});

// PLC 연결 설정 업데이트
router.put('/connections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ipAddress, port, protocol } = req.body;

    // 실제 구현에서는 데이터베이스 업데이트 및 PLC 재연결
    console.log(`Updating PLC connection ${id}:`, { name, ipAddress, port, protocol });

    res.json({
      success: true,
      message: 'PLC connection updated successfully'
    });
  } catch (error) {
    console.error('Error updating PLC connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PLC connection'
    });
  }
});

// PLC 연결 재시작
router.post('/connections/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;

    // 실제 구현에서는 PLC 연결 재시작 로직
    console.log(`Restarting PLC connection: ${id}`);

    // 소켓을 통해 실시간 알림 전송
    if (global.io) {
      global.io.emit('plc-connection-restarted', { plcId: id, timestamp: new Date().toISOString() });
    }

    res.json({
      success: true,
      message: 'PLC connection restart initiated'
    });
  } catch (error) {
    console.error('Error restarting PLC connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart PLC connection'
    });
  }
});

// PLC 데이터 포인트 설정 추가
router.post('/datapoints', async (req, res) => {
  try {
    const { plcId, name, address, type, unit } = req.body;

    // 실제 구현에서는 데이터베이스에 새 데이터 포인트 추가
    console.log('Adding new PLC data point:', { plcId, name, address, type, unit });

    res.json({
      success: true,
      message: 'PLC data point added successfully'
    });
  } catch (error) {
    console.error('Error adding PLC data point:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add PLC data point'
    });
  }
});

// PLC 실시간 데이터 스트리밍 시작
router.post('/connections/:id/start-stream', async (req, res) => {
  try {
    const { id } = req.params;

    // 실제 구현에서는 PLC 실시간 데이터 수집 시작
    console.log(`Starting data stream for PLC: ${id}`);

    res.json({
      success: true,
      message: 'PLC data streaming started'
    });
  } catch (error) {
    console.error('Error starting PLC data stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start PLC data stream'
    });
  }
});

// PLC 실시간 데이터 스트리밍 중지
router.post('/connections/:id/stop-stream', async (req, res) => {
  try {
    const { id } = req.params;

    // 실제 구현에서는 PLC 실시간 데이터 수집 중지
    console.log(`Stopping data stream for PLC: ${id}`);

    res.json({
      success: true,
      message: 'PLC data streaming stopped'
    });
  } catch (error) {
    console.error('Error stopping PLC data stream:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop PLC data stream'
    });
  }
});

module.exports = router; 