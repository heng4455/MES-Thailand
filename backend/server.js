const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 데이터베이스 연결
const { pool } = require('./src/config/database');

// 라우터 불러오기
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const productionRoutes = require('./src/routes/productionRoutes');
const qualityRoutes = require('./src/routes/qualityRoutes');
const equipmentRoutes = require('./src/routes/equipmentRoutes');
const planningRoutes = require('./src/routes/planningRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const plcRoutes = require('./src/routes/plcRoutes');

// 미들웨어 불러오기
const errorHandler = require('./src/middleware/errorHandler');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const server = createServer(app);

// CORS 설정
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Socket.IO 설정
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// 미들웨어 설정
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 최대 100 요청
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 정적 파일 제공
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 라우트 설정
app.use('/api/auth', authRoutes);
// app.use('/api/users', authenticateToken, userRoutes); // 개발 환경에서 주석 처리
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/production', authenticateToken, productionRoutes);
app.use('/api/quality', authenticateToken, qualityRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/planning', authenticateToken, planningRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/plc', plcRoutes); // PLC 라우트는 개발 중이므로 인증 비활성화

// LINE 라우트 추가
const lineRoutes = require('./src/routes/lineRoutes');
app.use('/api/line', lineRoutes); // LINE 라우트도 개발 중이므로 인증 비활성화

// 사용자 라우트 - 개발 환경에서는 인증 없이 사용
app.use('/api/users', userRoutes); // 개발 환경에서 인증 비활성화

console.log('📱 LINE Routes loaded successfully');

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

// 에러 핸들링 미들웨어
app.use(errorHandler);

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  // 사용자를 특정 룸에 조인
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });
  
  // 실시간 생산 데이터 구독
  socket.on('subscribe-production', (lineId) => {
    socket.join(`production-${lineId}`);
    console.log(`User ${socket.id} subscribed to production line: ${lineId}`);
  });
  
  // 실시간 품질 데이터 구독
  socket.on('subscribe-quality', (lineId) => {
    socket.join(`quality-${lineId}`);
    console.log(`User ${socket.id} subscribed to quality line: ${lineId}`);
  });
  
  // 실시간 장비 상태 구독
  socket.on('subscribe-equipment', (equipmentId) => {
    socket.join(`equipment-${equipmentId}`);
    console.log(`User ${socket.id} subscribed to equipment: ${equipmentId}`);
  });
  
  // 실시간 PLC 데이터 구독
  socket.on('subscribe-plc', (plcId) => {
    socket.join(`plc-${plcId}`);
    console.log(`User ${socket.id} subscribed to PLC: ${plcId}`);
  });
  
  // PLC 데이터 포인트 구독
  socket.on('subscribe-plc-datapoints', () => {
    socket.join('plc-datapoints');
    console.log(`User ${socket.id} subscribed to PLC data points`);
  });
  
  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// 글로벌 Socket.IO 인스턴스 설정
global.io = io;

// PLC 실시간 데이터 시뮬레이션
const simulatePlcData = () => {
  const plcDataPoints = [
    { id: 1, plcId: 1, name: 'Motor Speed', address: '40001', unit: 'RPM', type: 'analog' },
    { id: 2, plcId: 1, name: 'Temperature', address: '40002', unit: '°C', type: 'analog' },
    { id: 3, plcId: 1, name: 'Emergency Stop', address: '10001', unit: '', type: 'digital' },
    { id: 4, plcId: 2, name: 'Conveyor Speed', address: '40001', unit: 'm/s', type: 'analog' },
    { id: 5, plcId: 2, name: 'Product Counter', address: '40003', unit: 'EA', type: 'analog' },
    { id: 6, plcId: 4, name: 'Pressure', address: '40004', unit: 'Bar', type: 'analog' }
  ];

  plcDataPoints.forEach(dataPoint => {
    let value;
    if (dataPoint.type === 'analog') {
      switch (dataPoint.unit) {
        case 'RPM':
          value = Math.floor(Math.random() * 200) + 1400;
          break;
        case '°C':
          value = parseFloat((Math.random() * 20 + 55).toFixed(1));
          break;
        case 'm/s':
          value = parseFloat((Math.random() * 2 + 2).toFixed(1));
          break;
        case 'EA':
          value = Math.floor(Math.random() * 1000) + 500;
          break;
        case 'Bar':
          value = parseFloat((Math.random() * 3 + 2).toFixed(2));
          break;
        default:
          value = Math.random() * 100;
      }
    } else {
      value = Math.random() > 0.9 ? 1 : 0;
    }

    const updatedDataPoint = {
      ...dataPoint,
      value,
      lastUpdate: new Date().toISOString()
    };

    // 실시간 데이터를 구독한 클라이언트에게 전송
    io.to('plc-datapoints').emit('plc-data-update', updatedDataPoint);
    io.to(`plc-${dataPoint.plcId}`).emit('plc-data-update', updatedDataPoint);
  });
};

// 5초마다 PLC 데이터 업데이트 시뮬레이션
setInterval(simulatePlcData, 5000);

// 서버 시작
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

server.listen(PORT, () => {
  console.log(`
🚀 MES Thailand Backend Server Started!
📊 API Server: http://localhost:${PORT}
🔌 WebSocket Server: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started at: ${new Date().toISOString()}
  `);
});

// 우아한 종료 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = app; 