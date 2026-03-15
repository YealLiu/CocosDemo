/**
 * 消息处理器
 * 处理所有WebSocket消息，路由到对应的服务
 * 
 * @author ⚙️后端大牛
 * @version 1.0.0
 */

const logger = require('../utils/logger');

class MessageHandler {
  constructor(connectionManager, matchmakingService, battleService) {
    this.connectionManager = connectionManager;
    this.matchmakingService = matchmakingService;
    this.battleService = battleService;

    // 设置回调
    this.setupCallbacks();
  }

  /**
   * 设置服务回调
   */
  setupCallbacks() {
    // 匹配成功回调
    this.matchmakingService.setMatchFoundCallback((matchData) => {
      this.handleMatchFound(matchData);
    });

    // 匹配超时回调
    this.matchmakingService.setMatchTimeoutCallback((clientId) => {
      this.handleMatchTimeout(clientId);
    });

    // 对战广播回调
    this.battleService.setBroadcastCallback((roomId, message) => {
      this.broadcastToRoom(roomId, message);
    });
  }

  /**
   * 处理消息
   * @param {string} clientId - 客户端ID
   * @param {Object} message - 消息对象
   */
  handle(clientId, message) {
    const { type, data } = message;
    
    logger.debug(`📨 收到消息 [${clientId}]: ${type}`);

    switch (type) {
      // 认证相关
      case 'auth':
        this.handleAuth(clientId, data);
        break;

      // 匹配相关
      case 'match_start':
        this.handleMatchStart(clientId, data);
        break;
      case 'match_cancel':
        this.handleMatchCancel(clientId);
        break;

      // 对战相关
      case 'battle_action':
        this.handleBattleAction(clientId, data);
        break;
      case 'battle_ready':
        this.handleBattleReady(clientId, data);
        break;
      case 'battle_reconnect':
        this.handleBattleReconnect(clientId, data);
        break;

      // 心跳
      case 'ping':
        this.handlePing(clientId);
        break;

      // 其他
      default:
        this.sendError(clientId, 'UNKNOWN_MESSAGE_TYPE', `未知消息类型: ${type}`);
    }
  }

  /**
   * 处理认证
   */
  handleAuth(clientId, data) {
    const { playerId, playerName, rank = 0, token } = data;

    // 简化版：暂不验证token
    const playerData = {
      id: playerId,
      name: playerName || `Player_${playerId}`,
      rank: rank
    };

    this.connectionManager.setPlayerAuth(clientId, playerId, playerData);
    
    logger.info(`🔐 玩家认证成功 [${clientId}]: ${playerData.name}`);

    this.sendToClient(clientId, {
      type: 'auth_success',
      data: {
        playerId,
        playerName: playerData.name,
        rank: playerData.rank
      }
    });
  }

  /**
   * 处理开始匹配
   */
  handleMatchStart(clientId, data) {
    const client = this.connectionManager.getConnection(clientId);
    if (!client || !client.isAuthenticated) {
      this.sendError(clientId, 'NOT_AUTHENTICATED', '请先进行认证');
      return;
    }

    const { mode = 'ranked' } = data;
    const result = this.matchmakingService.startMatch(clientId, client.playerData, mode);

    if (result.success) {
      this.connectionManager.setMatchState(clientId, 'matching');
      this.sendToClient(clientId, {
        type: 'match_started',
        data: { mode, message: '正在寻找对手...' }
      });
    } else {
      this.sendError(clientId, 'MATCH_START_FAILED', result.error);
    }
  }

  /**
   * 处理取消匹配
   */
  handleMatchCancel(clientId) {
    const success = this.matchmakingService.cancelMatch(clientId);
    if (success) {
      this.connectionManager.setMatchState(clientId, 'idle');
      this.sendToClient(clientId, {
        type: 'match_cancelled',
        data: { message: '已取消匹配' }
      });
    }
  }

  /**
   * 处理匹配成功
   */
  handleMatchFound(matchData) {
    const { roomId, player1, player2 } = matchData;

    // 创建对战房间
    const room = this.battleService.createRoom(matchData);

    // 更新玩家状态
    this.connectionManager.setMatchState(player1.clientId, 'battling', roomId);
    this.connectionManager.setMatchState(player2.clientId, 'battling', roomId);

    // 通知双方
    this.sendToClient(player1.clientId, {
      type: 'match_found',
      data: {
        roomId,
        opponent: {
          name: player2.name,
          rank: player2.rank
        },
        mode: matchData.mode
      }
    });

    this.sendToClient(player2.clientId, {
      type: 'match_found',
      data: {
        roomId,
        opponent: {
          name: player1.name,
          rank: player1.rank
        },
        mode: matchData.mode
      }
    });

    logger.info(`🎮 匹配成功通知已发送 [${roomId}]`);
  }

  /**
   * 处理匹配超时
   */
  handleMatchTimeout(clientId) {
    this.connectionManager.setMatchState(clientId, 'idle');
    this.sendToClient(clientId, {
      type: 'match_timeout',
      data: { message: '匹配超时，请重试' }
    });
  }

  /**
   * 处理对战准备就绪
   */
  handleBattleReady(clientId, data) {
    const { roomId } = data;
    const room = this.battleService.rooms.get(roomId);
    
    if (!room) {
      this.sendError(clientId, 'ROOM_NOT_FOUND', '房间不存在');
      return;
    }

    // 标记玩家准备
    if (!room.readyPlayers) {
      room.readyPlayers = new Set();
    }
    room.readyPlayers.add(clientId);

    logger.info(`✅ 玩家准备就绪 [${clientId}]，房间 [${roomId}]`);

    // 双方准备后开始对战
    if (room.readyPlayers.size === 2) {
      this.battleService.startBattle(roomId);
    }
  }

  /**
   * 处理对战动作
   */
  handleBattleAction(clientId, data) {
    const { roomId, action } = data;
    
    const result = this.battleService.executeAction(roomId, clientId, action);
    
    if (!result.success) {
      this.sendError(clientId, 'ACTION_FAILED', result.error);
    }
  }

  /**
   * 处理对战重连
   */
  handleBattleReconnect(clientId, data) {
    const { roomId } = data;
    const result = this.battleService.handleReconnect(clientId, roomId);
    
    if (result.success) {
      this.sendToClient(clientId, {
        type: 'battle_reconnect_success',
        data: result.data
      });
    } else {
      this.sendError(clientId, 'RECONNECT_FAILED', result.error);
    }
  }

  /**
   * 处理心跳
   */
  handlePing(clientId) {
    this.sendToClient(clientId, {
      type: 'pong',
      data: { timestamp: Date.now() }
    });
  }

  /**
   * 发送消息给客户端
   */
  sendToClient(clientId, message) {
    this.connectionManager.sendToClient(clientId, message);
  }

  /**
   * 发送错误消息
   */
  sendError(clientId, code, message) {
    this.sendToClient(clientId, {
      type: 'error',
      data: { code, message }
    });
  }

  /**
   * 广播消息到房间
   */
  broadcastToRoom(roomId, message) {
    const room = this.battleService.rooms.get(roomId);
    if (!room) return;

    Object.keys(room.players).forEach(clientId => {
      this.sendToClient(clientId, message);
    });
  }
}

module.exports = MessageHandler;