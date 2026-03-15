/**
 * WebSocket服务器主入口
 * 负责启动WebSocket服务，处理连接管理和消息路由
 * 
 * @author ⚙️后端大牛
 * @version 1.0.0
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const ConnectionManager = require('./services/ConnectionManager');
const MatchmakingService = require('./services/MatchmakingService');
const BattleService = require('./services/BattleService');
const MessageHandler = require('./services/MessageHandler');
const logger = require('./utils/logger');

// 服务器配置
const CONFIG = {
  PORT: process.env.PORT || 8080,
  HEARTBEAT_INTERVAL: 30000,  // 心跳检测间隔 30秒
  HEARTBEAT_TIMEOUT: 60000    // 心跳超时 60秒
};

class PVPGameServer {
  constructor() {
    this.wss = null;
    this.connectionManager = new ConnectionManager();
    this.matchmakingService = new MatchmakingService();
    this.battleService = new BattleService();
    this.messageHandler = new MessageHandler(
      this.connectionManager,
      this.matchmakingService,
      this.battleService
    );
  }

  /**
   * 启动WebSocket服务器
   */
  start() {
    this.wss = new WebSocket.Server({ 
      port: CONFIG.PORT,
      // 允许跨域连接
      verifyClient: (info) => {
        logger.info(`客户端连接请求: ${info.origin}`);
        return true;
      }
    });

    logger.info(`🚀 PVP游戏服务器启动成功，监听端口: ${CONFIG.PORT}`);

    // 处理新连接
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // 启动心跳检测
    this.startHeartbeatCheck();

    // 优雅关闭
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * 处理新连接
   * @param {WebSocket} ws - WebSocket连接对象
   * @param {http.IncomingMessage} req - HTTP请求对象
   */
  handleConnection(ws, req) {
    const clientId = uuidv4();
    const clientInfo = {
      id: clientId,
      ws: ws,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      isAuthenticated: false,
      playerId: null,
      playerData: null,
      currentRoom: null,
      matchState: 'idle' // idle, matching, battling
    };

    // 注册连接
    this.connectionManager.addConnection(clientId, clientInfo);
    logger.info(`✅ 客户端连接成功 [${clientId}]，当前连接数: ${this.connectionManager.getConnectionCount()}`);

    // 发送连接成功消息
    this.sendMessage(ws, {
      type: 'connection_established',
      data: { clientId, timestamp: Date.now() }
    });

    // 处理消息
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.messageHandler.handle(clientId, message);
      } catch (error) {
        logger.error(`消息解析错误 [${clientId}]:`, error.message);
        this.sendMessage(ws, {
          type: 'error',
          data: { code: 'INVALID_MESSAGE', message: '消息格式错误' }
        });
      }
    });

    // 处理关闭
    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });

    // 处理错误
    ws.on('error', (error) => {
      logger.error(`WebSocket错误 [${clientId}]:`, error.message);
    });

    // 处理心跳响应
    ws.on('pong', () => {
      this.connectionManager.updateHeartbeat(clientId);
    });
  }

  /**
   * 处理断开连接
   * @param {string} clientId - 客户端ID
   * @param {number} code - 关闭代码
   * @param {string} reason - 关闭原因
   */
  handleDisconnection(clientId, code, reason) {
    const client = this.connectionManager.getConnection(clientId);
    if (!client) return;

    logger.info(`❌ 客户端断开连接 [${clientId}]，代码: ${code}，原因: ${reason}`);

    // 如果在匹配中，取消匹配
    if (client.matchState === 'matching') {
      this.matchmakingService.cancelMatch(clientId);
    }

    // 如果在对战中，处理断线
    if (client.matchState === 'battling' && client.currentRoom) {
      this.battleService.handleDisconnect(clientId, client.currentRoom);
    }

    // 移除连接
    this.connectionManager.removeConnection(clientId);
    logger.info(`当前连接数: ${this.connectionManager.getConnectionCount()}`);
  }

  /**
   * 启动心跳检测
   */
  startHeartbeatCheck() {
    setInterval(() => {
      const connections = this.connectionManager.getAllConnections();
      const now = Date.now();

      connections.forEach((client, clientId) => {
        // 检查心跳超时
        if (now - client.lastHeartbeat > CONFIG.HEARTBEAT_TIMEOUT) {
          logger.warn(`💔 心跳超时，断开连接 [${clientId}]`);
          client.ws.terminate();
          return;
        }

        // 发送ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, CONFIG.HEARTBEAT_INTERVAL);

    logger.info(`💓 心跳检测已启动，间隔: ${CONFIG.HEARTBEAT_INTERVAL}ms`);
  }

  /**
   * 发送消息到客户端
   * @param {WebSocket} ws - WebSocket连接
   * @param {Object} message - 消息对象
   */
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 优雅关闭服务器
   */
  shutdown() {
    logger.info('🛑 服务器正在关闭...');
    
    // 通知所有客户端
    this.connectionManager.getAllConnections().forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1001, '服务器关闭');
      }
    });

    // 关闭WebSocket服务器
    this.wss.close(() => {
      logger.info('✅ 服务器已安全关闭');
      process.exit(0);
    });
  }
}

// 启动服务器
const server = new PVPGameServer();
server.start();

module.exports = PVPGameServer;