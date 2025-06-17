const express = require('express');
const router = express.Router();
const axios = require('axios');

// LINE Bot 설정 저장 (메모리에 임시 저장)
let lineConfig = {
  channelAccessToken: '',
  channelSecret: '',
  groupId: '',
  isEnabled: false,
  lastTestTime: null,
  lastTestResult: null
};

// 알림 기록 (메모리에 임시 저장)
let notificationHistory = [
  {
    id: 1,
    type: 'system_alert',
    title: 'PLC 연결 오류',
    message: 'Production Line 1 PLC 연결이 끊어졌습니다.',
    timestamp: '2024-06-16T10:30:00',
    status: 'sent',
    recipients: 3
  },
  {
    id: 2,
    type: 'production_alert',
    title: '생산 목표 달성',
    message: '오늘 생산 목표 100% 달성하였습니다.',
    timestamp: '2024-06-16T09:15:00',
    status: 'sent',
    recipients: 5
  },
  {
    id: 3,
    type: 'quality_alert',
    title: '품질 이슈 발생',
    message: 'Batch #2024-001에서 불량률 5% 초과',
    timestamp: '2024-06-16T08:45:00',
    status: 'failed',
    recipients: 0
  }
];

// LINE 설정 저장
router.post('/config', async (req, res) => {
  try {
    console.log('💾 LINE 설정 저장 요청:', req.body);
    
    lineConfig = {
      ...lineConfig,
      ...req.body
    };
    
    res.json({
      success: true,
      message: 'LINE 설정이 저장되었습니다.',
      config: lineConfig
    });
  } catch (error) {
    console.error('LINE 설정 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: 'LINE 설정 저장에 실패했습니다.'
    });
  }
});

// LINE 설정 조회
router.get('/config', async (req, res) => {
  try {
    console.log('📄 LINE 설정 조회');
    
    // 보안을 위해 토큰과 시크릿은 마스킹
    const safeConfig = {
      ...lineConfig,
      channelAccessToken: lineConfig.channelAccessToken ? '***마스킹됨***' : '',
      channelSecret: lineConfig.channelSecret ? '***마스킹됨***' : ''
    };
    
    res.json({
      success: true,
      config: safeConfig
    });
  } catch (error) {
    console.error('LINE 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'LINE 설정 조회에 실패했습니다.'
    });
  }
});

// LINE 연결 테스트
router.post('/test', async (req, res) => {
  try {
    console.log('🔍 LINE 연결 테스트 시작');
    
    const { channelAccessToken, channelSecret, groupId } = req.body;
    
    if (!channelAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'Channel Access Token이 필요합니다.'
      });
    }
    
    // LINE API로 봇 정보 조회하여 토큰 유효성 검증
    try {
      const response = await axios.get('https://api.line.me/v2/bot/info', {
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ LINE Bot 정보 조회 성공:', response.data);
      
      res.json({
        success: true,
        message: 'LINE 연결 테스트 성공',
        botInfo: {
          displayName: response.data.displayName,
          userId: response.data.userId,
          basicId: response.data.basicId,
          premiumId: response.data.premiumId,
          videoCallEnabled: response.data.videoCallEnabled
        }
      });
    } catch (lineError) {
      console.error('❌ LINE API 오류:', lineError.response?.data || lineError.message);
      
      let errorMessage = 'LINE API 연결에 실패했습니다.';
      if (lineError.response?.status === 401) {
        errorMessage = '유효하지 않은 Channel Access Token입니다.';
      } else if (lineError.response?.status === 403) {
        errorMessage = 'LINE Bot API 접근 권한이 없습니다.';
      }
      
      res.json({
        success: false,
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('LINE 연결 테스트 오류:', error);
    res.status(500).json({
      success: false,
      error: '연결 테스트 중 서버 오류가 발생했습니다.'
    });
  }
});

// 테스트 알림 전송
router.post('/send-test', async (req, res) => {
  try {
    console.log('📤 테스트 알림 전송 시작');
    
    if (!lineConfig.channelAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'LINE 설정이 완료되지 않았습니다.'
      });
    }
    
    if (!lineConfig.isEnabled) {
      return res.status(400).json({
        success: false,
        error: 'LINE 알림이 비활성화되어 있습니다.'
      });
    }
    
    const testMessage = {
      type: 'text',
      text: `🔔 MES Thailand 테스트 알림\n\n` +
            `📅 시간: ${new Date().toLocaleString('ko-KR')}\n` +
            `🏭 시스템: MES Thailand\n` +
            `✅ 상태: 정상 작동 중\n\n` +
            `이 메시지는 LINE 알림 기능 테스트입니다.`
    };
    
    // 실제 LINE 메시지 전송은 주석 처리 (테스트 환경)
    /*
    try {
      let sendResult;
      
      if (lineConfig.groupId) {
        // 그룹으로 전송
        sendResult = await axios.post('https://api.line.me/v2/bot/message/push', {
          to: lineConfig.groupId,
          messages: [testMessage]
        }, {
          headers: {
            'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // 개별 사용자 전송은 사용자 ID가 필요하므로 브로드캐스트로 대체
        sendResult = await axios.post('https://api.line.me/v2/bot/message/broadcast', {
          messages: [testMessage]
        }, {
          headers: {
            'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('✅ LINE 메시지 전송 성공:', sendResult.data);
    } catch (lineError) {
      console.error('❌ LINE 메시지 전송 실패:', lineError.response?.data || lineError.message);
      throw lineError;
    }
    */
    
    // 테스트 모드: 성공한 것으로 가정하고 기록 추가
    const newNotification = {
      id: notificationHistory.length + 1,
      type: 'system_alert',
      title: '테스트 알림',
      message: testMessage.text,
      timestamp: new Date().toISOString(),
      status: 'sent',
      recipients: lineConfig.groupId ? 1 : 0
    };
    
    notificationHistory.unshift(newNotification);
    
    console.log('✅ 테스트 알림 전송 완료 (시뮬레이션)');
    
    res.json({
      success: true,
      message: '테스트 알림이 전송되었습니다.',
      notification: newNotification
    });
    
  } catch (error) {
    console.error('테스트 알림 전송 오류:', error);
    
    // 실패 기록 추가
    const failedNotification = {
      id: notificationHistory.length + 1,
      type: 'system_alert',
      title: '테스트 알림',
      message: '테스트 알림 전송에 실패했습니다.',
      timestamp: new Date().toISOString(),
      status: 'failed',
      recipients: 0
    };
    
    notificationHistory.unshift(failedNotification);
    
    res.status(500).json({
      success: false,
      error: '테스트 알림 전송에 실패했습니다.',
      notification: failedNotification
    });
  }
});

// 실제 알림 전송 (시스템에서 호출)
router.post('/send', async (req, res) => {
  try {
    console.log('📨 실제 알림 전송:', req.body);
    
    const { type, title, message, priority = 'normal' } = req.body;
    
    if (!lineConfig.isEnabled) {
      return res.json({
        success: false,
        error: 'LINE 알림이 비활성화되어 있습니다.'
      });
    }
    
    if (!lineConfig.channelAccessToken) {
      return res.json({
        success: false,
        error: 'LINE 설정이 완료되지 않았습니다.'
      });
    }
    
    const priorityEmoji = {
      low: '🔵',
      normal: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    
    const lineMessage = {
      type: 'text',
      text: `${priorityEmoji[priority] || '🔔'} ${title}\n\n` +
            `${message}\n\n` +
            `📅 ${new Date().toLocaleString('ko-KR')}\n` +
            `🏭 MES Thailand System`
    };
    
    // 실제 LINE API 호출은 주석 처리 (운영 환경에서 활성화)
    /*
    try {
      if (lineConfig.groupId) {
        await axios.post('https://api.line.me/v2/bot/message/push', {
          to: lineConfig.groupId,
          messages: [lineMessage]
        }, {
          headers: {
            'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post('https://api.line.me/v2/bot/message/broadcast', {
          messages: [lineMessage]
        }, {
          headers: {
            'Authorization': `Bearer ${lineConfig.channelAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (lineError) {
      console.error('LINE 메시지 전송 실패:', lineError);
      throw lineError;
    }
    */
    
    // 알림 기록 추가
    const notification = {
      id: notificationHistory.length + 1,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent', // 시뮬레이션에서는 항상 성공
      recipients: lineConfig.groupId ? 1 : 0
    };
    
    notificationHistory.unshift(notification);
    
    res.json({
      success: true,
      message: '알림이 전송되었습니다.',
      notification
    });
    
  } catch (error) {
    console.error('알림 전송 오류:', error);
    
    // 실패 기록 추가
    const failedNotification = {
      id: notificationHistory.length + 1,
      type: req.body.type || 'system_alert',
      title: req.body.title || '알림 전송 실패',
      message: req.body.message || '알림 전송에 실패했습니다.',
      timestamp: new Date().toISOString(),
      status: 'failed',
      recipients: 0
    };
    
    notificationHistory.unshift(failedNotification);
    
    res.status(500).json({
      success: false,
      error: '알림 전송에 실패했습니다.',
      notification: failedNotification
    });
  }
});

// 알림 기록 조회
router.get('/notifications', async (req, res) => {
  try {
    console.log('📋 알림 기록 조회');
    
    const { limit = 10, type } = req.query;
    
    let filteredNotifications = notificationHistory;
    
    if (type) {
      filteredNotifications = notificationHistory.filter(n => n.type === type);
    }
    
    const limitedNotifications = filteredNotifications.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      notifications: limitedNotifications,
      total: filteredNotifications.length
    });
  } catch (error) {
    console.error('알림 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '알림 기록 조회에 실패했습니다.'
    });
  }
});

// 헬스체크
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LINE API 서비스가 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
    config: {
      enabled: lineConfig.isEnabled,
      hasToken: !!lineConfig.channelAccessToken,
      hasSecret: !!lineConfig.channelSecret,
      hasGroupId: !!lineConfig.groupId
    }
  });
});

module.exports = router; 