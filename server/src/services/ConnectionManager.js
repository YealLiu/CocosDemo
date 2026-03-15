/**
 * 连接管理器
 * 负责管理所有WebSocket连接
 * 
 * @author ⚙️后端大牛
 * @version 1.0.0
 */

class ConnectionManager {
  constructor() {
    // 存储所有连接: Map<clientId, clientInfo>
    this.connections = new Map();
    // 玩家ID到客户端ID的映射: Map<playerId, clientId>
    this.playerConnections = new Map();
  }

  /**
   * 添加新连接
   * @param {string} clientId - 客户端唯一ID
   * @param {Object} clientInfo - 客户端信息
   */
  addConnection(clientId, clientInfo) {
    this.connections.set(clientId, clientInfo);
    
    // 如果已认证，建立玩家ID映射
    if (clientInfo.playerId) {
      this.playerConnections.set(clientInfo.playerId, clientId);
    }
  }

  /**
   * 移除连接
   * @param {string} clientId - 客户端ID
   */
  removeConnection(clientId) {
    const client = this.connections.get(clientId);
    if (client && client.playerId) {
      this.playerConnections.delete(client.playerId);
    }
    this.connections.delete(clientId);
  }

  /**
   * 获取连接信息
   * @param {string} clientId - 客户端ID
   * @returns {Object|null}
   */
  getConnection(clientId) {
    return this.connections.get(clientId) || null;
  }

  /**
   * 通过玩家ID获取连接
   * @param {string} playerId - 玩家ID
   * @returns {Object|null}
   */
  getConnectionByPlayerId(playerId) {
    const clientId = this.playerConnections.get(playerId);
    return clientId ? this.connections.get(clientId) || null : null;
  }

  /**
   * 获取所有连接
   * @returns {Map}
   */
  getAllConnections() {
    return this.connections;
  }

  /**
   * 获取连接数量
   * @returns {number}
   */
  getConnectionCount() {
    return this.connections.size;
  }

  /**
   * 更新心跳时间
   * @param {string} clientId - 客户端ID
   */
  updateHeartbeat(clientId) {
    const client = this.connections.get(clientId);
    if (client) {
      client.lastHeartbeat = Date.now();
    }
  }

  /**
   * 设置玩家认证信息
   * @param {string} clientId - 客户端ID
   * @param {string} playerId - 玩家ID
   * @param {Object} playerData - 玩家数据
   */
  setPlayerAuth(clientId, playerId, playerData) {
    const client = this.connections.get(clientId);
    if (client) {
      client.isAuthenticated = true;
      client.playerId = playerId;
      client.playerData = playerData;
      this.playerConnections.set(playerId, clientId);
    }
  }

  /**
   * 更新玩家匹配状态
   * @param {string} clientId - 客户端ID
   * @param {string} state - 匹配状态 (idle/matching/battling)
   * @param {string} roomId - 房间ID（可选）
   */
  setMatchState(clientId, state, roomId = null) {
    const client = this.connections.get(clientId);
    if (client) {
      client.matchState = state;
      if (roomId) {
        client.currentRoom = roomId;
      }
    }
  }

  /**
   * 发送消息给指定客户端
   * @param {string} clientId - 客户端ID
   * @param {Object} message - 消息对象
   * @returns {boolean}
   */
  sendToClient(clientId, message) {
    const client = this.connections.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN = 1
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * 发送消息给指定玩家
   * @param {string} playerId - 玩家ID
   * @param {Object} message - 消息对象
   * @returns {boolean}
   */
  sendToPlayer(playerId, message) {
    const clientId = this.playerConnections.get(playerId);
    return clientId ? this.sendToClient(clientId, message) : false;
  }

  /**
   * 广播消息给所有连接
   * @param {Object} message - 消息对象
   * @param {Function} filter - 过滤函数 (client) => boolean
   */
  broadcast(message, filter = null) {
    this.connections.forEach((client) => {
      if (filter && !filter(client)) return;
      if (client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * 获取在线玩家数量
   * @returns {number}
   */
  getOnlinePlayerCount() {
    let count = 0;
    this.connections.forEach((client) => {
      if (client.isAuthenticated) count++;
    });
    return count;
  }

  /**
   * 获取匹配中的玩家数量
   * @returns {number}
   */
  getMatchingPlayerCount() {
    let count = 0;
    this.connections.forEach((client) => {
      if (client.matchState === 'matching') count++;
    });
    return count;
  }
}

module.exports = ConnectionManager;